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

        $report = Report::with(['latestAssignment.officer.user'])->findOrFail($id);

        $validated = $request->validate([
            'officer_id' => 'required|exists:officers,id',
            'notes' => 'nullable|string|max:1000',
        ]);

        $officer = Officer::with('user')->findOrFail($validated['officer_id']);

        return DB::transaction(function () use ($user, $report, $officer, $validated) {
            // 1. If assigned to the same officer currently, simply update notes and refresh status
            $existing = ReportAssignment::where('report_id', $report->id)
                ->where('officer_id', $officer->id)
                ->whereIn('status', ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'])
                ->latest()
                ->first();

            if ($existing) {
                if (!empty($validated['notes'])) {
                    $existing->notes = $validated['notes'];
                    $existing->assigned_by = $user->id;
                    $existing->save();
                }

                if ($report->status === 'SUBMITTED' || $report->verification_status === 'PENDING') {
                    $report->status = 'ASSIGNED';
                    $report->verification_status = 'VERIFIED';
                    $report->verified_at = now();
                    $report->save();
                }

                ReportStatusHistory::create([
                    'report_id' => $report->id,
                    'status' => $report->status === 'SUBMITTED' ? 'ASSIGNED' : $report->status,
                    'actor_id' => $user->id,
                    'actor_name' => $user->name,
                    'actor_role' => 'admin',
                    'notes' => "Instruksi penugasan untuk {$officer->user->name} diperbarui. " . (!empty($validated['notes']) ? "Instruksi: {$validated['notes']}" : ''),
                ]);

                return response()->json([
                    'message' => "Instruksi penugasan untuk {$officer->user->name} berhasil diperbarui.",
                    'report' => $report->fresh(['category', 'latestAssignment.officer.user', 'statusHistories']),
                ]);
            }

            // 2. If assigning a new or different officer, cancel any previous active assignments
            $previousAssignments = ReportAssignment::where('report_id', $report->id)
                ->whereNotIn('status', ['COMPLETED', 'CANCELLED'])
                ->get();

            foreach ($previousAssignments as $previous) {
                if ($previous->officer_id != $officer->id) {
                    $previous->update(['status' => 'CANCELLED', 'completed_at' => now()]);
                    $prevOfficer = Officer::find($previous->officer_id);
                    if ($prevOfficer) {
                        if ($prevOfficer->active_tasks_count > 0) {
                            $prevOfficer->decrement('active_tasks_count');
                        }
                        if ($prevOfficer->user_id) {
                            Notification::create([
                                'user_id' => $prevOfficer->user_id,
                                'title' => 'Penugasan Dialihkan',
                                'message' => "Penugasan laporan #{$report->report_number} telah dialihkan kepada petugas lain.",
                                'type' => 'STATUS_UPDATE',
                                'link' => null,
                            ]);
                        }
                    }
                }
            }

            // 3. Create fresh assignment
            $assignment = ReportAssignment::create([
                'report_id' => $report->id,
                'officer_id' => $officer->id,
                'assigned_by' => $user->id,
                'notes' => $validated['notes'] ?? null,
                'status' => 'ASSIGNED',
                'assigned_at' => now(),
            ]);

            // Auto-verify when assigning from SUBMITTED or PENDING state
            if ($report->status === 'SUBMITTED' || $report->verification_status === 'PENDING') {
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
                'notes' => "Laporan ditugaskan kepada petugas {$officer->user->name} ({$officer->department}). " . (!empty($validated['notes']) ? "Instruksi: {$validated['notes']}" : ''),
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
