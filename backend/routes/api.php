<?php

use App\Http\Controllers\Api\AdminReportController;
use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\MapController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\OfficerTaskController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\SettingController;
use App\Http\Controllers\Api\SlaController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| WargaLapor REST API Routes with Strict Security & Rate Limiting
|--------------------------------------------------------------------------
*/

// Public & Authentication Routes
Route::prefix('auth')->group(function () {
    Route::get('/security-challenge', [AuthController::class, 'getSecurityChallenge']);
    Route::post('/register', [AuthController::class, 'register'])->middleware('throttle:auth_sensitive');
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp'])->middleware('throttle:otp');
    Route::post('/resend-otp', [AuthController::class, 'resendOtp'])->middleware('throttle:otp');
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:auth_sensitive');
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword'])->middleware('throttle:auth_sensitive');
    Route::post('/reset-password', [AuthController::class, 'resetPassword'])->middleware('throttle:auth_sensitive');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/logout', [AuthController::class, 'logout']);
    });
});

// Public Stats & Map
Route::get('/public/stats', [AnalyticsController::class, 'getPublicStats']);
Route::get('/categories', [CategoryController::class, 'index']);
Route::get('/map/reports', [MapController::class, 'getReports']);
Route::get('/map/heatmap', [MapController::class, 'getHeatmapData']);

// Reports (Public Discovery)
Route::get('/reports', [ReportController::class, 'index']);
Route::get('/reports/{id}', [ReportController::class, 'show']);
Route::post('/reports/analyze-ai', [ReportController::class, 'analyzeAi'])->middleware('throttle:api');
Route::post('/reports/check-duplicate', [ReportController::class, 'checkDuplicates'])->middleware('throttle:api');
Route::post('/reports/check-duplicates', [ReportController::class, 'checkDuplicates'])->middleware('throttle:api');

// Authenticated Routes (Sanctum)
Route::middleware('auth:sanctum')->group(function () {

    // Citizen Report Operations (Protected by verified account check & anti-spam rate limiting)
    Route::middleware('verified.account')->group(function () {
        Route::post('/reports', [ReportController::class, 'store'])->middleware('throttle:reports_create');
        Route::post('/reports/{id}/comments', [ReportController::class, 'addComment']);
        Route::post('/reports/{id}/feedback', [ReportController::class, 'addFeedback']);
    });

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::put('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);

    // Officer Task Operations
    Route::prefix('officer')->middleware('role:officer,admin')->group(function () {
        Route::get('/tasks', [OfficerTaskController::class, 'index']);
        Route::get('/tasks/{id}', [OfficerTaskController::class, 'show']);
        Route::post('/tasks/{id}/status', [OfficerTaskController::class, 'updateStatus']);
    });

    // Admin Operations
    Route::prefix('admin')->middleware('role:admin')->group(function () {
        // Reports Management & Verification
        Route::get('/reports', [AdminReportController::class, 'index']);
        Route::post('/reports/{id}/verify', [AdminReportController::class, 'verify']);
        Route::post('/reports/{id}/reject', [AdminReportController::class, 'reject']);
        Route::post('/reports/{id}/assign', [AdminReportController::class, 'assignOfficer']);
        Route::put('/reports/{id}/priority', [AdminReportController::class, 'updatePriority']);

        // User & Officer Management
        Route::get('/citizens', [UserController::class, 'getCitizens']);
        Route::get('/citizens/{id}', [UserController::class, 'getCitizenDetail']);
        Route::get('/officers', [UserController::class, 'getOfficers']);
        Route::post('/officers', [UserController::class, 'createOfficer']);
        Route::put('/users/{id}/toggle-status', [UserController::class, 'toggleStatus']);
        Route::get('/audit-logs', [UserController::class, 'getAuditLogs']);

        // Category Management
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

        // Analytics & System
        Route::get('/analytics', [AnalyticsController::class, 'getAdminAnalytics']);
        Route::get('/sla-settings', [SlaController::class, 'index']);
        Route::put('/sla-settings/{id}', [SlaController::class, 'update']);
        Route::get('/settings', [SettingController::class, 'index']);
        Route::put('/settings', [SettingController::class, 'update']);
    });
});
