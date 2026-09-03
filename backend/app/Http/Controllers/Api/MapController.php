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
     * Get weighted points for Leaflet Heatmap layer
     */
    public function getHeatmapData(Request $request): JsonResponse
    {
        $reports = Report::select('latitude', 'longitude', 'priority', 'status')
            ->whereNotIn('status', ['DRAFT', 'REJECTED'])
            ->get();

        $points = $reports->map(function ($r) {
            $weight = match ($r->priority) {
                'CRITICAL' => 1.0,
                'HIGH' => 0.8,
                'MEDIUM' => 0.5,
                default => 0.3,
            };

            // Slightly lower weight for resolved issues
            if (in_array($r->status, ['RESOLVED', 'CLOSED'])) {
                $weight *= 0.5;
            }

            return [
                (float) $r->latitude,
                (float) $r->longitude,
                $weight,
            ];
        });

        return response()->json([
            'points' => $points,
        ]);
    }
}
