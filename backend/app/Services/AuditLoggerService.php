<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\Request;

class AuditLoggerService
{
    /**
     * Log an action to the audit_logs table.
     */
    public static function log(
        string $action,
        ?string $entityType = null,
        ?int $entityId = null,
        ?array $oldValues = null,
        ?array $newValues = null,
        ?User $user = null
    ): AuditLog {
        $actor = $user ?: auth('sanctum')->user() ?: auth()->user();

        return AuditLog::create([
            'user_id' => $actor?->id,
            'actor_name' => $actor?->name ?? 'Sistem / Anonim',
            'actor_role' => $actor?->role ?? 'system',
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip() ?? '127.0.0.1',
        ]);
    }
}
