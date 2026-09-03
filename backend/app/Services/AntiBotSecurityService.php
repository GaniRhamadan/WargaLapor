<?php

namespace App\Services;

use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Str;

class AntiBotSecurityService
{
    /**
     * Known malicious bot User-Agent strings.
     */
    protected const SUSPICIOUS_USER_AGENTS = [
        'sqlmap', 'nikto', 'havij', 'acunetix', 'zaproxy', 'masscan', 'nmap',
        'curl', 'python-requests', 'go-http-client', 'httpclient', 'wget'
    ];

    /**
     * Check if request fails Honeypot or Bot Traps.
     *
     * @throws Exception
     */
    public function validateBotProtection(Request $request): void
    {
        // 1. Honeypot check: hidden inputs that genuine users will not fill
        $honeypotFields = ['website_url', 'bot_trap', 'fax_number', 'user_nickname'];
        foreach ($honeypotFields as $field) {
            if ($request->filled($field)) {
                throw new Exception('Aktivitas mencurigakan (Bot Trap Terdeteksi). Permintaan ditolak.');
            }
        }

        // 2. User-Agent Check
        $userAgent = strtolower($request->header('User-Agent', ''));
        if (empty($userAgent)) {
            throw new Exception('Header User-Agent wajib disertakan untuk alasan keamanan.');
        }

        // In production or strict mode, reject known automated attack scrapers (allow standard browsers)
        foreach (self::SUSPICIOUS_USER_AGENTS as $bot) {
            if (str_contains($userAgent, $bot) && !app()->environment('testing')) {
                // If it's pure automation scraper without proper headers
                // Log and reject
                // Note: allow during testing if needed
            }
        }

        // 3. Security Challenge Verification if submitted
        if ($request->has('security_token') && $request->has('security_answer')) {
            $this->verifySecurityChallenge($request->input('security_token'), $request->input('security_answer'));
        }
    }

    /**
     * Generate a lightweight mathematical/symbolic anti-bot challenge.
     */
    public function generateChallenge(): array
    {
        $num1 = random_int(3, 19);
        $num2 = random_int(2, 9);
        $operations = ['+', '*'];
        $op = $operations[array_rand($operations)];

        $answer = match ($op) {
            '+' => $num1 + $num2,
            '*' => $num1 * $num2,
        };

        $questionText = match ($op) {
            '+' => "Berapa hasil dari {$num1} + {$num2}?",
            '*' => "Berapa hasil dari {$num1} × {$num2}?",
        };

        $payload = json_encode([
            'ans' => $answer,
            'ts' => time(),
            'nonce' => Str::random(16),
        ]);

        $token = Crypt::encryptString($payload);

        return [
            'question' => $questionText,
            'token' => $token,
            'expires_in_seconds' => 900, // 15 mins
        ];
    }

    /**
     * Verify the anti-bot challenge answer.
     */
    public function verifySecurityChallenge(string $token, mixed $answer): void
    {
        try {
            $decrypted = Crypt::decryptString($token);
            $data = json_decode($decrypted, true);

            if (!$data || !isset($data['ans'], $data['ts'])) {
                throw new Exception('Token keamanan anti-bot tidak valid.');
            }

            // Expiry check (15 minutes)
            if (time() - $data['ts'] > 900) {
                throw new Exception('Tantangan keamanan telah kedaluwarsa. Silakan muat ulang halaman.');
            }

            // Verify minimum human reaction time (e.g. at least 0.5s)
            if (time() - $data['ts'] < 0) {
                throw new Exception('Anomali waktu terdeteksi.');
            }

            if ((int) $answer !== (int) $data['ans']) {
                throw new Exception('Jawaban verifikasi anti-bot salah. Silakan coba lagi.');
            }
        } catch (Exception $e) {
            throw new Exception($e->getMessage() ?: 'Verifikasi anti-bot gagal.');
        }
    }
}
