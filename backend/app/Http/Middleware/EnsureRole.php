<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
    /**
     * Handle an incoming request and check if user has one of the required roles.
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Autentikasi diperlukan.',
            ], 401);
        }

        if (!in_array($user->role, $roles, true)) {
            return response()->json([
                'message' => 'Akses ditolak. Peran pengguna (' . $user->role . ') tidak memiliki izin untuk modul ini.',
            ], 403);
        }

        return $next($request);
    }
}
