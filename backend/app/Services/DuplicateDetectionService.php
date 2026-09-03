<?php

namespace App\Services;

use App\Models\Report;

class DuplicateDetectionService
{
    /**
     * Check if a new report is a duplicate of existing active reports.
     *
     * @return array{is_duplicate: bool, similarity_percentage: float, duplicates: array}
     */
    public function checkDuplicates(
        float $latitude,
        float $longitude,
        int $categoryId,
        string $title,
        string $description,
        ?int $excludeReportId = null,
        float $radiusMeters = 600.0
    ): array {
        // Spatial bounding-box pre-filter to leverage (latitude, longitude) composite database index
        $buffer = $radiusMeters * 1.5;
        $latDelta = $buffer / 111000.0;
        $lngDelta = $buffer / (111000.0 * max(0.1, cos(deg2rad($latitude))));

        // Query active or recent reports within bounding box
        $query = Report::with(['category', 'images'])
            ->whereNotIn('status', ['REJECTED', 'CLOSED'])
            ->where('created_at', '>=', now()->subDays(45))
            ->whereBetween('latitude', [$latitude - $latDelta, $latitude + $latDelta])
            ->whereBetween('longitude', [$longitude - $lngDelta, $longitude + $lngDelta]);

        if ($excludeReportId) {
            $query->where('id', '!=', $excludeReportId);
        }

        $candidates = $query->get();
        $matched = [];
        $maxSimilarity = 0.0;

        foreach ($candidates as $candidate) {
            $dist = $this->calculateHaversineDistance(
                $latitude,
                $longitude,
                (float) $candidate->latitude,
                (float) $candidate->longitude
            );

            // If within proximity radius
            if ($dist <= $radiusMeters) {
                // Calculate category match weight
                $categoryMatch = ($candidate->category_id == $categoryId) ? 0.40 : 0.10;

                // Calculate textual similarity (Levenshtein / similar_text)
                $text1 = strtolower($title . ' ' . $description);
                $text2 = strtolower($candidate->title . ' ' . $candidate->description);
                similar_text($text1, $text2, $textPercent);
                $textSimilarity = ($textPercent / 100) * 0.40;

                // Proximity weight (closer = higher score)
                $proximityWeight = max(0, (1 - ($dist / $radiusMeters))) * 0.20;

                $totalScore = ($categoryMatch + $textSimilarity + $proximityWeight) * 100;
                $totalScore = round(min(99.0, max(10.0, $totalScore)), 1);

                if ($totalScore >= 50.0) {
                    $matched[] = [
                        'report' => $candidate,
                        'similarity_percentage' => $totalScore,
                        'distance_meters' => round($dist, 1),
                        'summary' => "Laporan serupa #{$candidate->report_number} berjarak " . round($dist) . "m (" . $candidate->title . ")",
                    ];

                    if ($totalScore > $maxSimilarity) {
                        $maxSimilarity = $totalScore;
                    }
                }
            }
        }

        // Sort by highest similarity
        usort($matched, fn($a, $b) => $b['similarity_percentage'] <=> $a['similarity_percentage']);

        return [
            'is_duplicate' => $maxSimilarity >= 65.0,
            'similarity_percentage' => $maxSimilarity,
            'duplicates' => $matched,
        ];
    }

    /**
     * Calculate Haversine distance in meters between two lat/long points
     */
    public function calculateHaversineDistance(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000; // in meters

        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $earthRadius * $c;
    }
}
