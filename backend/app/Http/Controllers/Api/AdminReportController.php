<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Officer;
use App\Models\Report;
use App\Models\ReportAssignment;
use App\Models\ReportStatusHistory;
use App\Services\AuditLoggerService;
use App\Services\SlaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminReportController extends Controller
{
    public function __construct(
        protected SlaService $slaService
    ) {}

    /**
     * Admin reports list with stats & comprehensive filters
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $query = Report::with([
            'category',
            'user:id,name,email,phone,avatar',
            'aiAnalysis',
            'latestAssignment.officer.user',
            'feedback',
            'images',
        ])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('verification_status')) {
            $query->where('verification_status', $request->verification_status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('title', 'like', "%{$s}%")
                  ->orWhere('report_number', 'like', "%{$s}%")
                  ->orWhere('address', 'like', "%{$s}%");
            });
        }

        $reports = $query->paginate($request->get('per_page', 15));

        // Aggregate statistics for quick KPI badges
        $stats = [
            'total' => Report::count(),
            'pending_verification' => Report::where('verification_status', 'PENDING')->count(),
            'in_progress' => Report::where('status', 'IN_PROGRESS')->count(),
            'resolved' => Report::where('status', 'RESOLVED')->count(),
            'critical' => Report::where('priority', 'CRITICAL')->whereNotIn('status', ['RESOLVED', 'CLOSED', 'REJECTED'])->count(),
        ];

        return response()->json([
            'reports' => $reports,
            'stats' => $stats,
        ]);
    }

    /**
     * Admin verifies incoming report
     */
    public function verify(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $report = Report::findOrFail($id);

        $validated = $request->validate([
            'priority' => 'nullable|in:LOW,MEDIUM,HIGH,CRITICAL',
            'notes' => 'nullable|string',
        ]);

        $oldStatus = $report->status;
        $report->verification_status = 'VERIFIED';
        $report->status = 'VERIFIED';
        $report->verified_at = now();

        if (!empty($validated['priority'])) {
            $report->priority = $validated['priority'];
            $report->sla_deadline = $this->slaService->calculateDeadline($validated['priority']);
        }

        $report->save();

        // History
        ReportStatusHistory::create([
            'report_id' => $report->id,
            'status' => 'VERIFIED',
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => 'admin',
            'notes' => $validated['notes'] ?? 'Laporan telah diverifikasi oleh Administrator dan valid untuk ditindaklanjuti.',
        ]);

        // Notify Citizen
        Notification::create([
            'user_id' => $report->user_id,
            'title' => 'Laporan Terverifikasi: #' . $report->report_number,
            'message' => 'Laporan Anda telah diverifikasi oleh admin dengan prioritas ' . $report->priority . '. Menunggu penugasan petugas lapangan.',
            'type' => 'REPORT_VERIFIED',
            'link' => '/citizen/reports/' . $report->id,
        ]);

        AuditLoggerService::log('VERIFY_REPORT', 'Report', $report->id, ['status' => $oldStatus], ['status' => 'VERIFIED', 'priority' => $report->priority], $user);

        return response()->json([
            'message' => 'Laporan berhasil diverifikasi.',
            'report' => $report->fresh(['category', 'aiAnalysis', 'statusHistories']),
        ]);
    }

    /**
     * Admin rejects report with mandatory reason
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $report = Report::findOrFail($id);

        $validated = $request->validate([
            'reason' => 'required|string|min:5|max:1000',
        ]);

        $report->verification_status = 'REJECTED';
        $report->status = 'REJECTED';
        $report->rejection_reason = $validated['reason'];
        $report->save();

        ReportStatusHistory::create([
            'report_id' => $report->id,
            'status' => 'REJECTED',
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => 'admin',
            'notes' => 'Laporan ditolak. Alasan: ' . $validated['reason'],
        ]);

        Notification::create([
            'user_id' => $report->user_id,
            'title' => 'Laporan Ditolak: #' . $report->report_number,
            'message' => 'Laporan Anda ditolak dengan alasan: "' . $validated['reason'] . '"',
            'type' => 'REPORT_REJECTED',
            'link' => '/citizen/reports/' . $report->id,
        ]);

        AuditLoggerService::log('REJECT_REPORT', 'Report', $report->id, null, ['reason' => $validated['reason']], $user);

        return response()->json([
            'message' => 'Laporan telah ditolak.',
            'report' => $report,
        ]);
    }

    /**
     * Admin assigns report to an Officer
     */
    public function assignOfficer(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $report = Report::with('latestAssignment')->findOrFail($id);

        $validated = $request->validate([
            'officer_id' => 'required|exists:officers,id',
            'notes' => 'nullable|string',
        ]);

        $officer = Officer::with('user')->findOrFail($validated['officer_id']);

        // Check for duplicate assignment to same officer
        $existing = ReportAssignment::where('report_id', $report->id)
            ->where('officer_id', $officer->id)
            ->whereIn('status', ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'])
            ->first();
        
        if ($existing) {
            return response()->json([
                'message' => 'Petugas ini sudah ditugaskan pada laporan yang sama.',
            ], 422);
        }

        // Unassign previous officer if exists
        $previous = ReportAssignment::where('report_id', $report->id)
            ->whereNotIn('status', ['COMPLETED', 'CANCELLED'])
            ->orderBy('created_at', 'desc')
            ->first();
            
        if ($previous && $previous->officer_id != $officer->id) {
            $prevOfficer = Officer::find($previous->officer_id);
            if ($prevOfficer && $prevOfficer->user) {
                Notification::create([
                    'user_id' => $prevOfficer->user_id,
                    'title' => 'Penugasan Dibatalkan',
                    'message' => "Anda dibebaskan dari penanganan laporan #{$report->report_number}.",
                    'type' => 'STATUS_UPDATE',
                    'link' => null,
                ]);
            }
            $previous->update(['status' => 'COMPLETED', 'completed_at' => now()]);
            $prevOfficer->decrement('active_tasks_count');
        }

        return DB::transaction(function () use ($user, $report, $officer, $validated) {
            $assignment = ReportAssignment::create([
                'report_id' => $report->id,
                'officer_id' => $officer->id,
                'assigned_by' => $user->id,
                'notes' => $validated['notes'] ?? null,
                'status' => 'ASSIGNED',
                'assigned_at' => now(),
            ]);

            // Auto-verify when assigning from SUBMITTED state
            if ($report->status === 'SUBMITTED') {
                $report->verification_status = 'VERIFIED';
                $report->verified_at = now();
                ReportStatusHistory::create([
                    'report_id' => $report->id,
                    'status' => 'VERIFIED',
                    'actor_id' => $user->id,
                    'actor_name' => $user->name,
                    'actor_role' => 'admin',
                    'notes' => 'Auto-verified saat penugasan petugas.',
                ]);
            }
            
            $report->status = 'ASSIGNED';
            $report->save();

            $officer->increment('active_tasks_count');

            ReportStatusHistory::create([
                'report_id' => $report->id,
                'status' => 'ASSIGNED',
                'actor_id' => $user->id,
                'actor_name' => $user->name,
                'actor_role' => 'admin',
                'notes' => "Laporan ditugaskan kepada petugas {$officer->user->name} ({$officer->department}). " . ($validated['notes'] ? "Instruksi: {$validated['notes']}" : ''),
            ]);

            Notification::create([
                'user_id' => $officer->user_id,
                'title' => 'Tugas Baru: #' . $report->report_number,
                'message' => "Anda ditugaskan menangani [{$report->title}] di {$report->address}. Prioritas: {$report->priority}",
                'type' => 'TASK_ASSIGNED',
                'link' => '/officer/tasks/' . $report->id,
            ]);

            Notification::create([
                'user_id' => $report->user_id,
                'title' => 'Petugas Ditugaskan: #' . $report->report_number,
                'message' => "Laporan Anda telah ditugaskan ke {$officer->user->name}. Petugas akan segera memproses.",
                'type' => 'OFFICER_ASSIGNED',
                'link' => '/citizen/reports/' . $report->id,
            ]);

            AuditLoggerService::log('ASSIGN_OFFICER', 'Report', $report->id, null, [
                'officer_id' => $officer->id,
                'officer_name' => $officer->user->name,
            ], $user);

            return response()->json([
                'message' => "Petugas {$officer->user->name} berhasil ditugaskan.",
                'report' => $report->fresh(['category', 'latestAssignment.officer.user', 'statusHistories']),
            ]);
        });
    }

    /**
     * Admin updates priority manually
     */
    public function updatePriority(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $report = Report::findOrFail($id);

        $validated = $request->validate([
            'priority' => 'required|in:LOW,MEDIUM,HIGH,CRITICAL',
            'reason' => 'nullable|string',
        ]);

        $oldPriority = $report->priority;
        $report->priority = $validated['priority'];
        $report->sla_deadline = $this->slaService->calculateDeadline($validated['priority']);
        $report->save();

        ReportStatusHistory::create([
            'report_id' => $report->id,
            'status' => $report->status,
            'actor_id' => $user->id,
            'actor_name' => $user->name,
            'actor_role' => 'admin',
            'notes' => "Prioritas laporan diubah dari {$oldPriority} menjadi {$report->priority}. " . ($validated['reason'] ? "Alasan: {$validated['reason']}" : ''),
        ]);

        AuditLoggerService::log('UPDATE_PRIORITY', 'Report', $report->id, ['priority' => $oldPriority], ['priority' => $report->priority], $user);

        return response()->json([
            'message' => 'Prioritas laporan berhasil diperbarui.',
            'report' => $report,
        ]);
    }
}
