<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AiAnalysis;
use App\Models\DuplicateReport;
use App\Models\Notification;
use App\Models\Report;
use App\Models\ReportCategory;
use App\Models\ReportComment;
use App\Models\ReportFeedback;
use App\Models\ReportImage;
use App\Models\ReportStatusHistory;
use App\Models\User;
use App\Services\AiAnalysisService;
use App\Services\AuditLoggerService;
use App\Services\DuplicateDetectionService;
use App\Services\PriorityEngineService;
use App\Services\SlaService;
use App\Services\StorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function __construct(
        protected AiAnalysisService $aiService,
        protected DuplicateDetectionService $duplicateService,
        protected PriorityEngineService $priorityEngine,
        protected SlaService $slaService,
        protected StorageService $storageService
    ) {}

    /**
     * List reports with filtering (Citizen own reports / Public reports)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Report::with(['category', 'images', 'aiAnalysis', 'feedback', 'user:id,name,avatar'])
            ->latest();

        // Scope filter
        if ($request->get('scope') === 'my') {
            if (!$user) {
                return response()->json(['message' => 'Silakan login terlebih dahulu.'], 401);
            }
            $query->where('user_id', $user->id);
        } elseif ($request->get('scope') === 'public') {
            // Only verified / active reports for public view
            $query->whereIn('status', ['VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED']);
        }

        // Status filter
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Priority filter
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        // Category filter
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        // Search query
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', "%{$s}%")
                  ->orWhere('report_number', 'like', "%{$s}%")
                  ->orWhere('address', 'like', "%{$s}%")
                  ->orWhere('description', 'like', "%{$s}%");
            });
        }

        $perPage = (int) $request->get('per_page', 12);
        $reports = $query->paginate($perPage);

        return response()->json($reports);
    }

    /**
     * Preview AI analysis without saving report (Wizard Step)
     */
    public function analyzeAi(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'nullable|integer',
            'image' => 'nullable',
        ]);

        $categoryName = null;
        if (!empty($validated['category_id'])) {
            $cat = ReportCategory::find($validated['category_id']);
            $categoryName = $cat?->name;
        }

        $analysis = $this->aiService->analyze(
            $validated['title'],
            $validated['description'],
            $categoryName
        );

        return response()->json([
            'analysis' => $analysis,
        ]);
    }

    /**
     * Check duplicate reports in real-time before submission
     */
    public function checkDuplicates(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'category_id' => 'required|integer',
            'title' => 'required|string',
            'description' => 'required|string',
        ]);

        $result = $this->duplicateService->checkDuplicates(
            (float) $validated['latitude'],
            (float) $validated['longitude'],
            (int) $validated['category_id'],
            $validated['title'],
            $validated['description']
        );

        return response()->json($result);
    }

    /**
     * Store new report from Wizard
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Autentikasi diperlukan.'], 401);
        }

        $validated = $request->validate([
            'category_id' => 'required|exists:report_categories,id',
            'title' => 'required|string|max:255',
            'description' => 'required|string|min:10',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'address' => 'required|string',
            'province' => 'nullable|string',
            'city' => 'nullable|string',
            'district' => 'nullable|string',
            'subdistrict' => 'nullable|string',
            'images' => 'nullable|array|min:1',
            'images.*' => 'nullable|string', // base64 or url or uploaded file
            'user_action' => 'nullable|string|in:PROCEEDED,MERGED',
            'merged_into_id' => 'nullable|exists:reports,id',
        ]);

        $category = ReportCategory::findOrFail($validated['category_id']);

        // Step 1: Run AI Analysis (outside DB transaction to avoid connection lock during HTTP request)
        $aiResult = $this->aiService->analyze(
            $validated['title'],
            $validated['description'],
            $category->name
        );

        // Step 2: Determine Priority & SLA
        $priority = $this->priorityEngine->determinePriority(
            $category->id,
            $aiResult['severity'] ?? null,
            $aiResult['priority'] ?? null
        );

        $deadline = $this->slaService->calculateDeadline($priority);

        return DB::transaction(function () use ($request, $user, $validated, $category, $aiResult, $priority, $deadline) {
            // Generate collision-safe report number (WL-2026-XXXXXX)
            $nextSeq = (Report::whereYear('created_at', now()->year)->max('id') ?? 0) + 1;
            do {
                $reportNumber = sprintf('WL-%s-%06d', now()->format('Y'), $nextSeq);
                $exists = Report::where('report_number', $reportNumber)->exists();
                if ($exists) {
                    $nextSeq++;
                }
            } while ($exists);

            // Step 3: Create Report Record
            $report = Report::create([
                'report_number' => $reportNumber,
                'user_id' => $user->id,
                'category_id' => $category->id,
                'title' => $validated['title'],
                'description' => $validated['description'],
                'latitude' => $validated['latitude'],
                'longitude' => $validated['longitude'],
                'address' => $validated['address'],
                'province' => $validated['province'] ?? 'DKI Jakarta',
                'city' => $validated['city'] ?? 'Jakarta Pusat',
                'district' => $validated['district'] ?? null,
                'subdistrict' => $validated['subdistrict'] ?? null,
                'priority' => $priority,
                'status' => 'SUBMITTED',
                'verification_status' => 'PENDING',
                'sla_deadline' => $deadline,
            ]);

            // Step 4: Save Images
            if (!empty($validated['images'])) {
                foreach ($validated['images'] as $imgData) {
                    if (!empty($imgData)) {
                        $storedPath = $this->storageService->storeImage($imgData, 'reports');
                        ReportImage::create([
                            'report_id' => $report->id,
                            'image_path' => $storedPath,
                            'image_type' => 'REPORT',
                            'uploaded_by' => $user->id,
                        ]);
                    }
                }
            }

            // Step 5: Save AI Analysis Record
            AiAnalysis::create([
                'report_id' => $report->id,
                'category_suggested' => $aiResult['category'] ?? $category->name,
                'severity' => $aiResult['severity'] ?? 'medium',
                'priority' => $aiResult['priority'] ?? $priority,
                'confidence' => $aiResult['confidence'] ?? 0.85,
                'hazard_level' => $aiResult['hazard_level'] ?? 'medium',
                'summary' => $aiResult['summary'] ?? null,
                'recommendation' => $aiResult['recommendation'] ?? null,
                'raw_response' => $aiResult['raw_response'] ?? null,
                'is_fallback' => $aiResult['is_fallback'] ?? false,
            ]);

            // Step 6: Record Status History
            ReportStatusHistory::create([
                'report_id' => $report->id,
                'status' => 'SUBMITTED',
                'actor_id' => $user->id,
                'actor_name' => $user->name,
                'actor_role' => 'citizen',
                'notes' => 'Laporan baru dibuat oleh warga melalui portal WargaLapor.',
            ]);

            // Step 7: Duplicate Check & Save Log
            $duplicateCheck = $this->duplicateService->checkDuplicates(
                (float) $validated['latitude'],
                (float) $validated['longitude'],
                $category->id,
                $validated['title'],
                $validated['description'],
                $report->id
            );

            if (!empty($duplicateCheck['duplicates'])) {
                $topDup = $duplicateCheck['duplicates'][0];
                DuplicateReport::create([
                    'report_id' => $report->id,
                    'original_report_id' => $topDup['report']->id,
                    'similarity_percentage' => $topDup['similarity_percentage'],
                    'distance_meters' => $topDup['distance_meters'],
                    'comparison_summary' => $topDup['summary'],
                    'user_action' => $validated['user_action'] ?? 'PROCEEDED',
                ]);
            }

            // Step 8: Notify Admins and Officers about new report
            $admins = User::where('role', 'admin')->get();
            foreach ($admins as $admin) {
                Notification::create([
                    'user_id' => $admin->id,
                    'title' => 'Laporan Baru: ' . $report->report_number,
                    'message' => "Laporan baru [{$category->name}] di {$report->address} membutuhkan verifikasi.",
                    'type' => 'REPORT_SUBMITTED',
                    'link' => '/admin/verification',
                ]);
            }

            // Also notify officers (for awareness)
            $officers = User::where('role', 'officer')->get();
            foreach ($officers as $officer) {
                Notification::create([
                    'user_id' => $officer->id,
                    'title' => 'Info Laporan Baru: ' . $report->report_number,
                    'message' => "Ada laporan baru di wilayah Anda: {$report->title}",
                    'type' => 'REPORT_INFO',
                    'link' => null,
              ]);
            }

            // Notification for Citizen
            Notification::create([
                'user_id' => $user->id,
                'title' => 'Laporan Berhasil Dibuat',
                'message' => "Laporan Anda (#{$report->report_number}) telah berhasil dikirim dan sedang menunggu verifikasi admin.",
                'type' => 'REPORT_SUBMITTED',
                'link' => '/citizen/reports/' . $report->id,
            ]);

            // Step 9: Audit Log
            AuditLoggerService::log('CREATE_REPORT', 'Report', $report->id, null, [
                'report_number' => $report->report_number,
                'title' => $report->title,
                'priority' => $report->priority,
            ], $user);

            return response()->json([
                'message' => 'Laporan Anda berhasil dikirimkan!',
                'report' => $report->load(['category', 'images', 'aiAnalysis', 'statusHistories']),
            ], 201);
        });
    }

    /**
     * Show single report details
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $report = Report::with([
            'category',
            'images',
            'statusHistories',
            'aiAnalysis',
            'duplicateReports.originalReport',
            'latestAssignment.officer.user',
            'comments.user:id,name,role,avatar',
            'feedback',
            'user:id,name,email,phone,avatar',
        ])->findOrFail($id);

        // Mask citizen sensitive data for public / other citizens
        if (!$user || (!$user->isAdmin() && !$user->isOfficer() && $user->id !== $report->user_id)) {
            if ($report->user) {
                $report->user->email = '***@wargalapor.test';
                $report->user->phone = '08**********';
                $report->user->nik = null;
            }
        }

        return response()->json([
            'report' => $report,
        ]);
    }

    /**
     * Add comment to report
     */
    public function addComment(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Silakan login terlebih dahulu.'], 401);
        }

        $report = Report::findOrFail($id);

        $validated = $request->validate([
            'comment' => 'required|string|min:2|max:1000',
            'is_internal' => 'boolean',
        ]);

        $isInternal = ($user->isAdmin() || $user->isOfficer()) && ($validated['is_internal'] ?? false);

        $comment = ReportComment::create([
            'report_id' => $report->id,
            'user_id' => $user->id,
            'comment' => $validated['comment'],
            'is_internal' => $isInternal,
        ]);

        // Send notification to report author if comment is from officer/admin
        if ($user->id !== $report->user_id && !$isInternal) {
            Notification::create([
                'user_id' => $report->user_id,
                'title' => 'Komentar Baru pada Laporan #' . $report->report_number,
                'message' => "{$user->name} menambahkan komentar: \"{$validated['comment']}\"",
                'type' => 'REPORT_COMMENT',
                'link' => '/citizen/reports/' . $report->id,
            ]);
        }

        AuditLoggerService::log('ADD_COMMENT', 'Report', $report->id, null, ['comment_id' => $comment->id], $user);

        return response()->json([
            'message' => 'Komentar berhasil ditambahkan.',
            'comment' => $comment->load('user:id,name,role,avatar'),
        ], 201);
    }

    /**
     * Citizen submits rating & feedback after report is resolved
     */
    public function addFeedback(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Silakan login terlebih dahulu.'], 401);
        }

        $report = Report::findOrFail($id);

        if ($report->user_id !== $user->id && !$user->isAdmin()) {
            return response()->json(['message' => 'Hanya pelapor yang dapat memberikan feedback pada laporan ini.'], 403);
        }

        if (!in_array($report->status, ['RESOLVED', 'CLOSED'])) {
            return response()->json(['message' => 'Feedback hanya dapat diberikan setelah laporan dinyatakan selesai (RESOLVED).'], 422);
        }

        $validated = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comments' => 'nullable|string|max:1000',
        ]);

        $feedback = ReportFeedback::updateOrCreate(
            ['report_id' => $report->id],
            [
                'user_id' => $user->id,
                'rating' => $validated['rating'],
                'comments' => $validated['comments'] ?? null,
            ]
        );

        // Update status to CLOSED
        $report->status = 'CLOSED';
        $report->save();

        ReportStatusHistory::create([
            'report_id' => $report->id,
            'status' => 'CLOSED',
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => 'citizen',
            'notes' => 'Warga memberikan feedback kepuasan (' . $validated['rating'] . '/5 bintang). Laporan resmi ditutup.',
        ]);

        AuditLoggerService::log('GIVE_FEEDBACK', 'ReportFeedback', $feedback->id, null, ['rating' => $feedback->rating], $user);

        return response()->json([
            'message' => 'Terima kasih atas feedback dan penilaian yang Anda berikan!',
            'feedback' => $feedback,
        ]);
    }
}
