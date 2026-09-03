<?php

namespace App\Services;

use App\Models\SlaSetting;
use Carbon\Carbon;

class SlaService
{
    /**
     * Calculate resolution deadline based on priority SLA rules.
     */
    public function calculateDeadline(string $priority, ?Carbon $startTime = null): Carbon
    {
        $start = $startTime ?: now();
        $normalized = strtoupper($priority);

        $setting = SlaSetting::where('priority', $normalized)->first();
        $hours = $setting ? $setting->resolution_time_hours : match ($normalized) {
            'CRITICAL' => 4,
            'HIGH' => 12,
            'MEDIUM' => 24,
            'LOW' => 72,
            default => 24
        };

        return $start->copy()->addHours($hours);
    }

    /**
     * Check if a given deadline has passed.
     */
    public function isOverdue(?Carbon $deadline): bool
    {
        if (!$deadline) {
            return false;
        }
        return now()->isAfter($deadline);
    }
}
