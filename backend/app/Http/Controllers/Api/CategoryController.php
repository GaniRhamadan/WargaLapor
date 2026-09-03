<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReportCategory;
use App\Services\AuditLoggerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    /**
     * List all categories
     */
    public function index(Request $request): JsonResponse
    {
        $query = ReportCategory::withCount('reports');

        if (!$request->user() || !$request->user()->isAdmin()) {
            $query->where('is_active', true);
        }

        $categories = $query->orderBy('name')->get();

        return response()->json([
            'categories' => $categories,
        ]);
    }

    /**
     * Get single category
     */
    public function show(int $id): JsonResponse
    {
        $category = ReportCategory::withCount('reports')->findOrFail($id);
        return response()->json(['category' => $category]);
    }

    /**
     * Store new category (Admin only)
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak. Hanya Administrator yang dapat menambah kategori.'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:100|unique:report_categories,name',
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
            'default_priority' => 'required|in:LOW,MEDIUM,HIGH,CRITICAL',
            'is_active' => 'boolean',
        ]);

        $category = ReportCategory::create([
            'name' => $validated['name'],
            'slug' => Str::slug($validated['name']),
            'description' => $validated['description'] ?? null,
            'icon' => $validated['icon'] ?? 'AlertCircle',
            'color' => $validated['color'] ?? '#0D9488',
            'default_priority' => $validated['default_priority'],
            'is_active' => $validated['is_active'] ?? true,
        ]);

        AuditLoggerService::log('CREATE_CATEGORY', 'ReportCategory', $category->id, null, $category->toArray(), $user);

        return response()->json([
            'message' => 'Kategori berhasil ditambahkan.',
            'category' => $category,
        ], 201);
    }

    /**
     * Update category (Admin only)
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $category = ReportCategory::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:100|unique:report_categories,name,' . $id,
            'description' => 'nullable|string',
            'icon' => 'nullable|string|max:50',
            'color' => 'nullable|string|max:20',
            'default_priority' => 'sometimes|required|in:LOW,MEDIUM,HIGH,CRITICAL',
            'is_active' => 'boolean',
        ]);

        $oldValues = $category->toArray();

        if (isset($validated['name'])) {
            $category->name = $validated['name'];
            $category->slug = Str::slug($validated['name']);
        }
        if (isset($validated['description'])) $category->description = $validated['description'];
        if (isset($validated['icon'])) $category->icon = $validated['icon'];
        if (isset($validated['color'])) $category->color = $validated['color'];
        if (isset($validated['default_priority'])) $category->default_priority = $validated['default_priority'];
        if (isset($validated['is_active'])) $category->is_active = $validated['is_active'];

        $category->save();

        AuditLoggerService::log('UPDATE_CATEGORY', 'ReportCategory', $category->id, $oldValues, $category->toArray(), $user);

        return response()->json([
            'message' => 'Kategori berhasil diperbarui.',
            'category' => $category,
        ]);
    }

    /**
     * Delete/Toggle category
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $user = $request->user();
        if (!$user || !$user->isAdmin()) {
            return response()->json(['message' => 'Akses ditolak.'], 403);
        }

        $category = ReportCategory::findOrFail($id);
        $category->is_active = !$category->is_active;
        $category->save();

        return response()->json([
            'message' => 'Status kategori berhasil diubah.',
            'category' => $category,
        ]);
    }
}
