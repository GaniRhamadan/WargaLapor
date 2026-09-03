<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\AuditLoggerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    /**
     * Get all system settings
     */
    public function index(): JsonResponse
    {
        $settings = Setting::all();
        return response()->json([
            'settings' => $settings,
        ]);
    }

    /**
     * Update system settings in batch (Admin only)
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $validated = $request->validate([
            'settings' => 'required|array',
            'settings.*.key' => 'required|string',
            'settings.*.value' => 'nullable|string',
        ]);

        foreach ($validated['settings'] as $item) {
            Setting::set($item['key'], $item['value'] ?? '');
        }

        AuditLoggerService::log('UPDATE_SETTINGS', 'Setting', null, null, $validated['settings'], $user);

        return response()->json([
            'message' => 'Pengaturan sistem berhasil disimpan.',
            'settings' => Setting::all(),
        ]);
    }
}
