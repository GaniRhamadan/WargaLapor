<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAccountVerified
{
    /**
     * Ensure the authenticated user has verified their account via OTP.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && !$user->isVerified()) {
            return response()->json([
                'message' => 'Akun Anda belum aktif. Silakan lakukan verifikasi kode OTP terlebih dahulu sebelum melanjutkan tindakan ini.',
                'requires_otp' => true,
                'email' => $user->email,
                'phone' => $user->phone,
            ], 403);
        }

        return $next($request);
    }
}
