<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInputMiddleware
{
    /**
     * Handle an incoming request by sanitizing inputs against XSS and script injections.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();
        array_walk_recursive($input, function (&$value, $key) {
            if (is_string($value)) {
                // Do not sanitize password fields to avoid altering valid characters
                if (str_contains($key, 'password') || str_contains($key, 'token') || str_contains($key, 'otp')) {
                    return;
                }

                // Strip dangerous html tags, script tags, javascript: pseudo-protocols, and malicious event handlers
                $value = preg_replace('/<script\b[^>]*>(.*?)<\/script>/is', '', $value);
                $value = preg_replace('/<iframe\b[^>]*>(.*?)<\/iframe>/is', '', $value);
                $value = preg_replace('/javascript\s*:/i', '', $value);
                $value = preg_replace('/\bon[a-z]+\s*=/i', '', $value);
                $value = strip_tags($value);
                $value = trim($value);
            }
        });

        $request->merge($input);

        return $next($request);
    }
}
