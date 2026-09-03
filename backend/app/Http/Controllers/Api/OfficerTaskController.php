<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Officer;
use App\Models\Report;
use App\Models\ReportAssignment;
use App\Models\ReportImage;
use App\Models\ReportStatusHistory;
use App\Models\User;
use App\Services\AuditLoggerService;
use App\Services\StorageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OfficerTaskController extends Controller
{
    public function __construct(
        protected StorageService $storageService
    ) {}

    /**
     * Get officer's assigned tasks
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isOfficer() && !$user->isAdmin())) {
            return response()->json(['message' => 'Akses ditolak. Khusus Petugas Lapangan.'], 403);
        }

        $officer = Officer::where('user_id', $user->id)->first();
        if (!$officer && !$user->isAdmin()) {
            return response()->json(['message' => 'Profil petugas tidak ditemukan.'], 404);
        }

        $query = Report::with(['category', 'images', 'aiAnalysis', 'latestAssignment', 'user:id,name,phone'])
            ->whereHas('assignments', function ($q) use ($officer, $user) {
                if ($officer) {
                    $q->where('officer_id', $officer->id);
                }
            })
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        $tasks = $query->paginate($request->get('per_page', 15));

        // Quick Officer Stats
        $stats = [
            'total_assigned' => Report::whereHas('assignments', fn($q) => $officer ? $q->where('officer_id', $officer->id) : null)->count(),
            'in_progress' => Report::whereHas('assignments', fn($q) => $officer ? $q->where('officer_id', $officer->id) : null)->where('status', 'IN_PROGRESS')->count(),
            'resolved' => Report::whereHas('assignments', fn($q) => $officer ? $q->where('officer_id', $officer->id) : null)->whereIn('status', ['RESOLVED', 'CLOSED'])->count(),
            'urgent' => Report::whereHas('assignments', fn($q) => $officer ? $q->where('officer_id', $officer->id) : null)->where('priority', 'CRITICAL')->whereNotIn('status', ['RESOLVED', 'CLOSED'])->count(),
        ];

        return response()->json([
            'tasks' => $tasks,
            'stats' => $stats,
        ]);
    }

    /**
     * Show task detail for officer
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isOfficer() && !$user->isAdmin())) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $report = Report::with([
            'category',
            'images',
            'statusHistories',
            'aiAnalysis',
            'latestAssignment.officer.user',
            'comments.user:id,name,role,avatar',
            'user:id,name,phone,email',
            'feedback',
        ])->findOrFail($id);

        return response()->json([
            'task' => $report,
        ]);
    }

    /**
     * Officer updates status (IN_PROGRESS, WAITING, RESOLVED)
     */
    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || (!$user->isOfficer() && !$user->isAdmin())) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $report = Report::with(['category', 'latestAssignment.officer.user'])->findOrFail($id);

        // Verify officer owns this assignment
        if (!$user->isAdmin()) {
            $officer = Officer::where('user_id', $user->id)->first();
            if (!$officer) {
                return response()->json(['message' => 'Profil petugas tidak ditemukan.'], 404);
            }
            
            $assignment = ReportAssignment::where('report_id', $report->id)
                ->where('officer_id', $officer->id)
                ->whereIn('status', ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'])
                ->first();
                
            if (!$assignment) {
                return response()->json([
                    'message' => 'Anda tidak memiliki tugas pada laporan ini.',
                ], 403);
            }
        }

        $validated = $request->validate([
            'status' => 'required|in:IN_PROGRESS,WAITING,RESOLVED',
            'notes' => 'nullable|string|max:1000',
            'progress_images' => 'nullable|array',
            'progress_images.*' => 'nullable|string',
            'resolution_proof_image' => 'nullable|string',
        ]);

        $newStatus = strtoupper($validated['status']);
        $oldStatus = $report->status;

        return DB::transaction(function () use ($report, $user, $validated, $newStatus, $oldStatus) {
            $report->status = $newStatus;
            if ($newStatus === 'RESOLVED') {
                $report->resolved_at = now();
            }
            $report->save();

            if (!empty($validated['progress_images'])) {
                foreach ($validated['progress_images'] as $pImg) {
                    if (!empty($pImg)) {
                        $imgPath = $this->storageService->storeImage($pImg, 'reports/progress');
                        ReportImage::create([
                            'report_id' => $report->id,
                            'image_path' => $imgPath,
                            'image_type' => 'PROGRESS',
                            'caption' => 'Foto Progress Penanganan',
                            'uploaded_by' => $user->id,
                        ]);
                    }
                }
            }

            if ($newStatus === 'RESOLVED' && !empty($validated['resolution_proof_image'])) {
                $proofPath = $this->storageService->storeImage($validated['resolution_proof_image'], 'reports/resolution');
                ReportImage::create([
                    'report_id' => $report->id,
                    'image_path' => $proofPath,
                    'image_type' => 'RESOLUTION',
                    'caption' => 'Bukti Pengerjaan Selesai oleh Petugas ' . $user->name,
                    'uploaded_by' => $user->id,
                ]);
            }

            ReportStatusHistory::create([
                'report_id' => $report->id,
                'status' => $newStatus,
                'actor_id' => $user->id,
                'actor_name' => $user->name,
                'actor_role' => $user->isOfficer() ? 'officer' : 'admin',
                'notes' => $validated['notes'] ?? '',
            ]);

            $recentNotification = Notification::where('user_id', $report->user_id)
                ->where('type', $newStatus === 'RESOLVED' ? 'REPORT_RESOLVED' : 'REPORT_IN_PROGRESS')
                ->where('created_at', '>=', now()->subHour())
                ->where('title', 'like', '%' . $report->report_number . '%')
                ->first();

            if (!$recentNotification) {
                $citizenMsg = match ($newStatus) {
                    'IN_PROGRESS' => "Petugas {$user->name} sedang menangani laporan Anda.",
                    'WAITING' => "Laporan Anda dalam status menunggu.",
                    'RESOLVED' => "Kabar baik! Laporan Anda telah SELESAI. Silakan cek bukti dan berikan rating.",
                };

                Notification::create([
                    'user_id' => $report->user_id,
                    'title' => "Update Laporan #{$report->report_number}: {$newStatus}",
                    'message' => $citizenMsg,
                    'type' => $newStatus === 'RESOLVED' ? 'REPORT_RESOLVED' : 'REPORT_IN_PROGRESS',
                    'link' => '/citizen/reports/' . $report->id,
                ]);
            }

            if ($newStatus === 'RESOLVED') {
                $admins = User::where('role', 'admin')->get();
                foreach ($admins as $adm) {
                    Notification::create([
                        'user_id' => $adm->id,
                        'title' => "Laporan Selesai: #{$report->report_number}",
                        'message' => "Petugas {$user->name} telah menyelesaikan laporan {$report->title}.",
                        'type' => 'REPORT_RESOLVED',
                        'link' => '/admin/reports/' . $report->id,
                    ]);
                }
            }

            AuditLoggerService::log('OFFICER_UPDATE_STATUS', 'Report', $report->id, ['status' => $oldStatus], [
                'status' => $newStatus,
                'notes' => $validated['notes'] ?? '',
            ], $user);

            return response()->json([
                'message' => "Status tugas berhasil diperbarui menjadi {$newStatus}.",
                'report' => $report->fresh(['category', 'images', 'statusHistories', 'latestAssignment.officer.user']),
            ]);
        });
    }
}
