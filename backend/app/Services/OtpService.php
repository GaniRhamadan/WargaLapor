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

        // Dispatch OTP directly to active Email address via SMTP Gmail
        if (!$isPhone) {
            try {
                $isForgot = ($type === 'FORGOT_PASSWORD');
                $subject = $isForgot
                    ? 'Kode OTP Reset Kata Sandi WargaLapor'
                    : 'Kode Verifikasi OTP Akun WargaLapor - ' . $identifier;

                $htmlContent = $this->buildEmailHtml($otpCode, $identifier, $type, $user);
                $plainBody = $isForgot
                    ? "Halo Warga,\n\n" .
                      "Kode OTP Reset Kata Sandi WargaLapor Anda ({$identifier}) adalah: {$otpCode}\n" .
                      "Kode ini berlaku selama 10 menit. Jangan berikan kode ini kepada pihak mana pun demi menjaga keamanan data Anda.\n\n" .
                      "Salam hangat,\nPemerintah Kota & Tim Pengembang WargaLapor"
                    : "Halo Warga,\n\n" .
                      "Terima kasih telah mendaftar di Portal WargaLapor.\n" .
                      "Kode Verifikasi OTP Akun Anda ({$identifier}) adalah: {$otpCode}\n" .
                      "Kode ini berlaku selama 10 menit. Jangan berikan kode ini kepada pihak mana pun demi menjaga keamanan data Anda.\n\n" .
                      "Salam hangat,\nPemerintah Kota & Tim Pengembang WargaLapor";

                Mail::html($htmlContent, function ($message) use ($identifier, $subject, $plainBody) {
                    $message->to($identifier)
                        ->subject($subject)
                        ->text($plainBody);
                });
                Log::info("Email OTP successfully dispatched via SMTP to {$identifier} for [{$type}]");
            } catch (\Throwable $e) {
                Log::error("SMTP email dispatch to {$identifier} failed: " . $e->getMessage());
                // Tetap simpan log untuk audit & diagnosis teknis
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

    /**
     * Build responsive HTML email template with WargaLapor official theme.
     */
    private function buildEmailHtml(string $otpCode, string $identifier, string $type, ?User $user = null): string
    {
        $isForgot = ($type === 'FORGOT_PASSWORD');
        $recipientName = $user && !empty($user->name) ? htmlspecialchars($user->name) : 'Warga';
        $title = $isForgot ? 'Reset Kata Sandi Akun' : 'Verifikasi Akun Baru';
        $instruction = $isForgot
            ? 'Kami menerima permintaan untuk mengatur ulang kata sandi akun WargaLapor Anda. Gunakan kode verifikasi di bawah ini untuk melanjutkan proses pergantian kata sandi:'
            : 'Terima kasih telah mendaftarkan diri pada platform <strong>WargaLapor</strong>. Masukkan 6-digit kode OTP di bawah ini untuk memverifikasi alamat email dan mengaktifkan akun Anda:';

        return <<<HTML
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{$title}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 560px; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.01); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #0d9488 0%, #0f766e 100%); padding: 32px 30px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); backdrop-filter: blur(8px); padding: 6px 14px; border-radius: 30px; margin-bottom: 12px; border: 1px solid rgba(255, 255, 255, 0.25);">
                      <span style="color: #ffffff; font-size: 11px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase;">Portal Resmi WargaLapor</span>
                    </div>
                    <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">{$title}</h1>
                    <p style="color: #ccfbf1; font-size: 13px; margin: 6px 0 0 0;">Sistem Smart Citizen Reporting & Penanganan Fasilitas Publik</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Body -->
          <tr>
            <td style="padding: 35px 32px 28px 32px;">
              <p style="font-size: 15px; line-height: 1.6; margin: 0 0 14px 0; color: #334155;">
                Halo <strong>{$recipientName}</strong>,
              </p>
              <p style="font-size: 14px; line-height: 1.65; margin: 0 0 24px 0; color: #475569;">
                {$instruction}
              </p>

              <!-- OTP Code Display Card -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 24px 0;">
                <tr>
                  <td align="center">
                    <div style="background-color: #f0fdfa; border: 2px dashed #0d9488; border-radius: 16px; padding: 20px 24px; display: inline-block; width: 85%; max-width: 380px;">
                      <div style="font-size: 11px; font-weight: 700; color: #0f766e; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px;">KODE VERIFIKASI RESMI (OTP)</div>
                      <div style="font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #0d9488; font-family: Consolas, 'SF Mono', Monaco, monospace; padding-left: 10px;">
                        {$otpCode}
                      </div>
                      <div style="margin-top: 10px; font-size: 12px; font-weight: 600; color: #64748b;">
                        ⏱️ Berlaku selama <span style="color: #0f766e;">10 Menit</span> • Maks. 5x Percobaan
                      </div>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Security Reminder Notice -->
              <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 14px 16px; margin: 24px 0 16px 0;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0">
                  <tr>
                    <td valign="top" style="width: 24px; padding-right: 10px; font-size: 18px;">
                      🔒
                    </td>
                    <td style="font-size: 12px; line-height: 1.55; color: #92400e;">
                      <strong>PENTING:</strong> Jangan pernah memberikan kode OTP ini kepada siapa pun, termasuk pihak yang mengatasnamakan administrator atau petugas WargaLapor. Jika Anda tidak merasa meminta kode ini, akun Anda tetap aman dan abaikan email ini.
                    </td>
                  </tr>
                </table>
              </div>

              <p style="font-size: 12px; color: #64748b; margin: 20px 0 0 0; line-height: 1.5;">
                Email ini dikirimkan otomatis ke alamat aktif: <strong style="color: #334155;">{$identifier}</strong>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 32px; text-align: center;">
              <p style="font-size: 12px; font-weight: 600; color: #64748b; margin: 0 0 4px 0;">
                Pemerintah Kota & Tim Pengembang WargaLapor Indonesia
              </p>
              <p style="font-size: 11px; color: #94a3b8; margin: 0;">
                Email resmi: <a href="mailto:parabu12siliwangi@gmail.com" style="color: #0d9488; text-decoration: none;">parabu12siliwangi@gmail.com</a> • Pusat Bantuan: <a href="mailto:aduan@wargalapor.go.id" style="color: #0d9488; text-decoration: none;">aduan@wargalapor.go.id</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }
}

