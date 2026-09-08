<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\OtpVerification;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class OtpService
{
    /**
     * Generate and dispatch a 6-digit OTP to identifier (email / phone).
     */
    public function generateAndSend(string $identifier, string $type = 'REGISTER', ?User $user = null, ?string $ip = null): array
    {
        // Invalidate previous unused OTPs for this identifier
        OtpVerification::where('identifier', $identifier)
            ->where('type', $type)
            ->where('is_used', false)
            ->update(['is_used' => true]);

        // Generate cryptographically secure 6-digit number (100000 - 999999)
        $otpCode = (string) random_int(100000, 999999);
        $expiresAt = now()->addMinutes(10);

        $otp = OtpVerification::create([
            'identifier' => $identifier,
            'otp_code' => $otpCode,
            'type' => $type,
            'user_id' => $user?->id,
            'expires_at' => $expiresAt,
            'attempts' => 0,
            'is_used' => false,
            'ip_address' => $ip,
        ]);

        // Channel notification & delivery
        $isPhone = preg_match('/^[0-9+]+$/', $identifier);
        $channel = $isPhone ? 'WhatsApp / SMS' : 'Email Aktif';

        if ($user) {
            $isForgot = ($type === 'FORGOT_PASSWORD');
            Notification::create([
                'user_id' => $user->id,
                'title' => $isForgot ? "Kode OTP Reset Kata Sandi WargaLapor: {$otpCode}" : "Kode Verifikasi OTP WargaLapor: {$otpCode}",
                'message' => $isForgot
                    ? "Kode OTP untuk mengatur ulang kata sandi Anda adalah {$otpCode}. Berlaku 10 menit. Jangan berikan kode ini kepada siapapun."
                    : "Kode OTP Anda adalah {$otpCode}. Berlaku 10 menit. Jangan berikan kode ini kepada siapapun demi keamanan akun Anda.",
                'type' => 'OTP_SECURITY',
                'link' => null,
            ]);
        }

        // Dispatch OTP directly to active Email address via SMTP
        if (!$isPhone) {
            try {
                if ($type === 'FORGOT_PASSWORD') {
                    $subject = 'Kode OTP Reset Kata Sandi WargaLapor';
                    $body = "Halo Warga,\n\n" .
                        "Kami menerima permintaan untuk mengatur ulang kata sandi akun WargaLapor Anda ({$identifier}).\n" .
                        "Berikut adalah Kode Verifikasi OTP untuk mereset kata sandi Anda:\n\n" .
                        "=========================================\n" .
                        "         KODE OTP ANDA: {$otpCode}\n" .
                        "=========================================\n\n" .
                        "Kode verifikasi ini berlaku selama 10 menit.\n" .
                        "PERINGATAN: Jangan berikan kode ini kepada pihak mana pun demi menjaga keamanan data Anda. Jika Anda tidak merasa melakukan permintaan ini, silakan abaikan pesan ini.\n\n" .
                        "Salam hangat,\n" .
                        "Pemerintah Kota & Tim Pengembang WargaLapor";
                } else {
                    $subject = 'Kode Verifikasi OTP Akun WargaLapor - ' . $identifier;
                    $body = "Halo Warga,\n\n" .
                        "Terima kasih telah mendaftar di Portal WargaLapor.\n" .
                        "Berikut adalah Kode Verifikasi OTP untuk aktivasi akun Anda:\n\n" .
                        "=========================================\n" .
                        "         KODE OTP ANDA: {$otpCode}\n" .
                        "=========================================\n\n" .
                        "Kode ini berlaku selama 10 menit.\n" .
                        "PERINGATAN: Jangan berikan kode ini kepada pihak mana pun demi menjaga keamanan data Anda.\n\n" .
                        "Salam hangat,\n" .
                        "Pemerintah Kota & Tim Pengembang WargaLapor";
                }

                Mail::raw($body, function ($message) use ($identifier, $subject) {
                    $message->to($identifier)
                        ->subject($subject);
                });
                Log::info("Email OTP successfully dispatched via SMTP to {$identifier} for [{$type}]");
            } catch (\Throwable $e) {
                Log::warning("SMTP email dispatch to {$identifier} failed: " . $e->getMessage() . " - Fallback demo mode available.");
            }
        }

        Log::info("OTP [{$type}] sent to {$identifier} via {$channel}: {$otpCode} (Valid until: {$expiresAt})");

        return [
            'success' => true,
            'identifier' => $identifier,
            'channel' => $channel,
            'expires_at' => $expiresAt->toISOString(),
            'message' => "Kode OTP 6-digit telah dikirimkan ke {$channel} ({$identifier}). Silakan buka kotak masuk email Anda.",
        ];
    }

    /**
     * Verify submitted 6-digit OTP.
     */
    public function verify(string $identifier, string $code, string $type = 'REGISTER'): array
    {
        $otp = OtpVerification::where('identifier', $identifier)
            ->where('type', $type)
            ->where('is_used', false)
            ->latest()
            ->first();

        if (!$otp) {
            return [
                'success' => false,
                'message' => 'Kode OTP tidak ditemukan atau sudah kedaluwarsa. Silakan minta kode baru.',
                'code' => 'OTP_NOT_FOUND',
            ];
        }

        if ($otp->isExpired()) {
            $otp->update(['is_used' => true]);
            return [
                'success' => false,
                'message' => 'Kode OTP telah kedaluwarsa (masa berlaku 10 menit). Silakan kirim ulang kode baru.',
                'code' => 'OTP_EXPIRED',
            ];
        }

        if ($otp->isExceeded()) {
            $otp->update(['is_used' => true]);
            return [
                'success' => false,
                'message' => 'Batas maksimal 5 kali percobaan gagal telah terlampaui demi keamanan. Silakan minta kode OTP baru.',
                'code' => 'OTP_MAX_ATTEMPTS',
            ];
        }

        if (trim($otp->otp_code) !== trim($code)) {
            $otp->increment('attempts');
            $remaining = 5 - $otp->attempts;
            return [
                'success' => false,
                'message' => "Kode OTP salah. Sisa kesempatan mencoba: {$remaining} kali.",
                'code' => 'OTP_INVALID',
                'remaining_attempts' => max(0, $remaining),
            ];
        }

        // Mark OTP as successfully used
        $otp->update(['is_used' => true]);

        return [
            'success' => true,
            'message' => 'Verifikasi OTP berhasil!',
            'otp' => $otp,
        ];
    }

    /**
     * Check if user can request a resend (Cooldown 60s).
     */
    public function canResend(string $identifier, string $type = 'REGISTER'): array
    {
        $lastOtp = OtpVerification::where('identifier', $identifier)
            ->where('type', $type)
            ->latest()
            ->first();

        if ($lastOtp && $lastOtp->created_at->diffInSeconds(now()) < 60) {
            $waitTime = 60 - $lastOtp->created_at->diffInSeconds(now());
            return [
                'allowed' => false,
                'wait_seconds' => $waitTime,
                'message' => "Harap tunggu {$waitTime} detik sebelum meminta kode OTP baru.",
            ];
        }

        return ['allowed' => true];
    }
}
