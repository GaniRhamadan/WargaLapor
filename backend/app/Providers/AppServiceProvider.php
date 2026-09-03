<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Rate limiter for general API endpoints
        RateLimiter::for('api', function (Request $request) {
            return Limit::perMinute(120)->by($request->user()?->id ?: $request->ip());
        });

        // Strict rate limiter for sensitive authentication endpoints (Login / Password Reset)
        RateLimiter::for('auth_sensitive', function (Request $request) {
            return Limit::perMinute(6)->by($request->ip());
        });

        // Strict rate limiter for OTP requests (Anti-Spam OTP SMS/Email Bombing)
        RateLimiter::for('otp', function (Request $request) {
            $identifier = $request->input('identifier') ?: $request->input('email') ?: $request->input('phone') ?: $request->ip();
            return Limit::perMinute(3)->by($identifier);
        });

        // Rate limiter for report creation (Anti-Spam report flooding)
        RateLimiter::for('reports_create', function (Request $request) {
            return Limit::perMinute(5)->by($request->user()?->id ?: $request->ip());
        });
    }
}
