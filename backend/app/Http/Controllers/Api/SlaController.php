<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SlaSetting;
use App\Services\AuditLoggerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SlaController extends Controller
{
    /**
     * Get all SLA rules
     */
    public function index(): JsonResponse
    {
        $slaSettings = SlaSetting::all();
        return response()->json([
            'sla_settings' => $slaSettings,
        ]);
    }

    /**
     * Update SLA rule (Admin only)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $sla = SlaSetting::findOrFail($id);

        $validated = $request->validate([
            'response_time_hours' => 'required|integer|min:1|max:720',
            'resolution_time_hours' => 'required|integer|min:1|max:720',
            'description' => 'nullable|string',
        ]);

        $old = $sla->toArray();
        $sla->update($validated);

        AuditLoggerService::log('UPDATE_SLA', 'SlaSetting', $sla->id, $old, $sla->toArray(), $user);

        return response()->json([
            'message' => "Pengaturan SLA untuk prioritas {$sla->priority} berhasil diperbarui.",
            'sla_setting' => $sla,
        ]);
    }
}
