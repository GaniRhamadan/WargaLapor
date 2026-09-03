<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Officer;
use App\Models\User;
use App\Services\AuditLoggerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    /**
     * List citizens (Admin only)
     */
    public function getCitizens(Request $request): JsonResponse
    {
        $query = User::where('role', 'citizen')
            ->withCount('reports')
            ->latest();

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('phone', 'like', "%{$s}%")
                  ->orWhere('nik', 'like', "%{$s}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $citizens = $query->paginate($request->get('per_page', 15));

        return response()->json([
            'citizens' => $citizens,
        ]);
    }

    /**
     * Get single citizen details with their reports
     */
    public function getCitizenDetail(int $id): JsonResponse
    {
        $citizen = User::where('role', 'citizen')
            ->withCount('reports')
            ->with(['reports' => fn($q) => $q->with('category')->latest()->take(10)])
            ->findOrFail($id);

        return response()->json([
            'citizen' => $citizen,
        ]);
    }

    /**
     * List officers with workload (Admin and Officer selection)
     */
    public function getOfficers(Request $request): JsonResponse
    {
        $query = Officer::with('user');

        if ($request->filled('department')) {
            $query->where('department', $request->department);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->whereHas('user', function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%")
                  ->orWhere('phone', 'like', "%{$s}%");
            })->orWhere('unit', 'like', "%{$s}%")
              ->orWhere('department', 'like', "%{$s}%");
        }

        $officers = $query->get();

        return response()->json([
            'officers' => $officers,
        ]);
    }

    /**
     * Create new officer (Admin only)
     */
    public function createOfficer(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:6',
            'department' => 'required|string|max:100',
            'unit' => 'nullable|string|max:100',
            'area_coverage' => 'nullable|string|max:100',
        ]);

        return DB::transaction(function () use ($user, $validated) {
            $officerUser = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'] ?? null,
                'role' => 'officer',
                'status' => 'active',
                'password' => Hash::make($validated['password']),
            ]);

            $officer = Officer::create([
                'user_id' => $officerUser->id,
                'department' => $validated['department'],
                'unit' => $validated['unit'] ?? null,
                'area_coverage' => $validated['area_coverage'] ?? 'Seluruh Wilayah',
                'active_tasks_count' => 0,
                'completed_tasks_count' => 0,
                'status' => 'available',
            ]);

            AuditLoggerService::log('CREATE_OFFICER', 'Officer', $officer->id, null, [
                'name' => $officerUser->name,
                'department' => $officer->department,
            ], $user);

            return response()->json([
                'message' => 'Petugas baru berhasil ditambahkan.',
                'officer' => $officer->load('user'),
            ], 201);
        });
    }

    /**
     * Toggle user status (active / suspended)
     */
    public function toggleStatus(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $targetUser = User::findOrFail($id);
        if ($targetUser->id === $user->id) {
            return response()->json(['message' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.'], 422);
        }

        $oldStatus = $targetUser->status;
        $targetUser->status = ($targetUser->status === 'active') ? 'suspended' : 'active';
        $targetUser->save();

        AuditLoggerService::log('TOGGLE_USER_STATUS', 'User', $targetUser->id, ['status' => $oldStatus], ['status' => $targetUser->status], $user);

        return response()->json([
            'message' => "Status akun {$targetUser->name} berhasil diubah menjadi {$targetUser->status}.",
            'user' => $targetUser,
        ]);
    }

    /**
     * Get immutable Audit Logs (Admin only)
     */
    public function getAuditLogs(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $query = AuditLog::with('user:id,name,role,email')->latest();

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function ($q) use ($s) {
                $q->where('actor_name', 'like', "%{$s}%")
                  ->orWhere('action', 'like', "%{$s}%")
                  ->orWhere('entity_type', 'like', "%{$s}%");
            });
        }

        $logs = $query->paginate($request->get('per_page', 20));

        return response()->json([
            'audit_logs' => $logs,
        ]);
    }
}
