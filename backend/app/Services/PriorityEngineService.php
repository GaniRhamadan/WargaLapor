<?php

namespace App\Services;

use App\Models\ReportCategory;

class PriorityEngineService
{
    /**
     * Determine final priority based on AI severity, Category default, and keywords.
     */
    public function determinePriority(int $categoryId, ?string $aiSeverity = null, ?string $aiPriority = null): string
    {
        if ($aiPriority) {
            $normalized = strtoupper($aiPriority);
            if (in_array($normalized, ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])) {
                return $normalized;
            }
        }

        if ($aiSeverity) {
            $normalized = strtoupper($aiSeverity);
            if (in_array($normalized, ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])) {
                return $normalized;
            }
        }

        $category = ReportCategory::find($categoryId);
        return $category ? strtoupper($category->default_priority) : 'MEDIUM';
    }
}
