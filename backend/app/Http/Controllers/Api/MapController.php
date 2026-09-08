<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Report;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MapController extends Controller
{
    /**
     * Get geo-located reports for interactive Leaflet map
     */
    public function getReports(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Report::with(['category', 'images:id,report_id,image_path,image_type'])
            ->select([
                'id',
                'report_number',
                'category_id',
                'title',
                'latitude',
                'longitude',
                'address',
                'city',
                'priority',
                'status',
                'verification_status',
                'created_at',
            ]);

        // Hide rejected/draft for public
        if (!$user || (!$user->isAdmin() && !$user->isOfficer())) {
            $query->whereNotIn('status', ['DRAFT', 'REJECTED']);
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        if ($request->filled('city')) {
            $query->where('city', $request->city);
        }

        $reports = $query->get();

        return response()->json([
            'reports' => $reports,
        ]);
    }

    /**
     * Get weighted points for Leaflet Heatmap layer with filters, detail points and hotspot analysis
     */
    public function getHeatmapData(Request $request): JsonResponse
    {
        $query = Report::with('category:id,name,color')
            ->select('id', 'category_id', 'title', 'latitude', 'longitude', 'address', 'district', 'city', 'priority', 'status')
            ->whereNotNull('latitude')
            ->whereNotNull('longitude')
            ->whereNotIn('status', ['DRAFT', 'REJECTED']);

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        if ($request->filled('status')) {
            if ($request->status === 'ACTIVE') {
                $query->whereNotIn('status', ['RESOLVED', 'CLOSED']);
            } elseif ($request->status === 'RESOLVED') {
                $query->whereIn('status', ['RESOLVED', 'CLOSED']);
            } else {
                $query->where('status', $request->status);
            }
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }

        $reports = $query->get();

        $points = [];
        $detailPoints = [];
        $criticalCount = 0;
        $highCount = 0;
        $activeCount = 0;

        foreach ($reports as $r) {
            $baseWeight = match ($r->priority) {
                'CRITICAL' => 1.0,
                'HIGH' => 0.8,
                'MEDIUM' => 0.5,
                default => 0.35,
            };

            $isResolved = in_array($r->status, ['RESOLVED', 'CLOSED']);
            $weight = $isResolved ? $baseWeight * 0.6 : $baseWeight;

            if (!$isResolved) {
                $activeCount++;
            }

            if ($r->priority === 'CRITICAL') {
                $criticalCount++;
            } elseif ($r->priority === 'HIGH') {
                $highCount++;
            }

            $lat = (float) $r->latitude;
            $lng = (float) $r->longitude;

            $points[] = [$lat, $lng, round($weight, 2)];
            $detailPoints[] = [
                'id' => $r->id,
                'lat' => $lat,
                'lng' => $lng,
                'weight' => round($weight, 2),
                'title' => $r->title,
                'category' => $r->category?->name ?? 'Umum',
                'priority' => $r->priority,
                'status' => $r->status,
                'address' => $r->address,
            ];
        }

        $hotspots = $this->calculateHotspots($reports);

        return response()->json([
            'points' => $points,
            'detail_points' => $detailPoints,
            'stats' => [
                'total' => count($points),
                'critical_count' => $criticalCount,
                'high_count' => $highCount,
                'active_count' => $activeCount,
            ],
            'hotspots' => $hotspots,
        ]);
    }

    /**
     * Compute top hotspot clusters based on proximity
     */
    private function calculateHotspots($reports): array
    {
        $clusters = [];
        foreach ($reports as $r) {
            $gridKey = round($r->latitude, 2) . ',' . round($r->longitude, 2);
            if (!isset($clusters[$gridKey])) {
                $clusters[$gridKey] = [
                    'name' => $r->district ?: ($r->address ?: 'Kawasan ' . $r->city),
                    'count' => 0,
                    'critical_count' => 0,
                    'total_weight' => 0,
                    'lats' => [],
                    'lngs' => [],
                    'categories' => [],
                ];
            }
            $clusters[$gridKey]['count']++;
            if ($r->priority === 'CRITICAL') {
                $clusters[$gridKey]['critical_count']++;
            }
            $w = match ($r->priority) {
                'CRITICAL' => 1.0,
                'HIGH' => 0.8,
                'MEDIUM' => 0.5,
                default => 0.35,
            };
            $clusters[$gridKey]['total_weight'] += $w;
            $clusters[$gridKey]['lats'][] = (float) $r->latitude;
            $clusters[$gridKey]['lngs'][] = (float) $r->longitude;
            $catName = $r->category?->name;
            if ($catName) {
                $clusters[$gridKey]['categories'][$catName] = ($clusters[$gridKey]['categories'][$catName] ?? 0) + 1;
            }
        }

        usort($clusters, function ($a, $b) {
            return $b['total_weight'] <=> $a['total_weight'];
        });

        $topHotspots = [];
        foreach (array_slice($clusters, 0, 5) as $c) {
            arsort($c['categories']);
            $topCategory = key($c['categories']) ?: 'Laporan Campuran';
            $avgLat = array_sum($c['lats']) / count($c['lats']);
            $avgLng = array_sum($c['lngs']) / count($c['lngs']);

            $level = $c['count'] >= 4 || $c['critical_count'] >= 2 ? 'KRITIS' : ($c['count'] >= 2 ? 'TINGGI' : 'SEDANG');

            $topHotspots[] = [
                'name' => $c['name'],
                'count' => $c['count'],
                'critical_count' => $c['critical_count'],
                'top_category' => $topCategory,
                'level' => $level,
                'lat' => round($avgLat, 5),
                'lng' => round($avgLng, 5),
            ];
        }

        return $topHotspots;
    }
}
