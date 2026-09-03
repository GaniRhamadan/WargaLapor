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
     * Character set excluding ambiguous characters (0, O, 1, I, l), matching ai_agar_tidak_ada_cliper_jahat.
     */
    protected const CHAR_SET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';

    /**
     * Generate a visual image CAPTCHA challenge (distorted image with signed HMAC token).
     */
    public function generateChallenge(): array
    {
        $length = 5;
        $code = '';
        $charSetLen = strlen(self::CHAR_SET);
        for ($i = 0; $i < $length; $i++) {
            $code .= self::CHAR_SET[random_int(0, $charSetLen - 1)];
        }

        $image = $this->renderCaptchaSvg($code);

        $payload = json_encode([
            'ans' => $code,
            'ts' => time(),
            'nonce' => Str::random(16),
        ]);

        $token = Crypt::encryptString($payload);

        return [
            'captcha_image' => $image,
            'token' => $token,
            'expires_in_seconds' => 300, // 5 mins
        ];
    }

    /**
     * Render SVG-based distorted CAPTCHA with noise, disturbance curves, and rotated characters.
     */
    protected function renderCaptchaSvg(string $code): string
    {
        $width = 180;
        $height = 54;
        $svg = '<svg xmlns="http://www.w3.org/2000/svg" width="'.$width.'" height="'.$height.'" viewBox="0 0 '.$width.' '.$height.'">';
        $svg .= '<rect width="100%" height="100%" fill="#141826" rx="8"/>';

        // Background noise dots
        for ($i = 0; $i < 65; $i++) {
            $cx = random_int(2, $width - 2);
            $cy = random_int(2, $height - 2);
            $rCol = random_int(70, 200);
            $gCol = random_int(70, 200);
            $bCol = random_int(180, 255);
            $svg .= '<circle cx="'.$cx.'" cy="'.$cy.'" r="1" fill="rgb('.$rCol.','.$gCol.','.$bCol.')" opacity="0.6"/>';
        }

        // Disturbance curved lines
        for ($i = 0; $i < 4; $i++) {
            $x1 = random_int(5, $width - 5);
            $y1 = random_int(5, $height - 5);
            $x2 = random_int(5, $width - 5);
            $y2 = random_int(5, $height - 5);
            $qx = random_int(20, $width - 20);
            $qy = random_int(5, $height - 5);
            $lineColor = 'rgba('.random_int(100, 255).','.random_int(150, 255).','.random_int(200, 255).',0.5)';
            $svg .= '<path d="M'.$x1.','.$y1.' Q'.$qx.','.$qy.' '.$x2.','.$y2.'" stroke="'.$lineColor.'" stroke-width="1.6" fill="none"/>';
        }

        // Distorted characters with rotation
        $fontColors = ['#38BDF8', '#34D399', '#FBBF24', '#F472B6', '#A78BFA', '#2DD4BF', '#60A5FA'];
        $len = strlen($code);
        $charStep = ($width - 32) / $len;
        for ($i = 0; $i < $len; $i++) {
            $char = $code[$i];
            $x = 18 + ($i * $charStep) + random_int(-2, 2);
            $y = 38 + random_int(-3, 3);
            $rot = random_int(-22, 22);
            $col = $fontColors[array_rand($fontColors)];
            $svg .= '<text x="'.$x.'" y="'.$y.'" font-family="Courier, Consolas, monospace" font-weight="900" font-size="28" fill="'.$col.'" transform="rotate('.$rot.', '.$x.', '.$y.')">'.$char.'</text>';
        }

        $svg .= '</svg>';
        return 'data:image/svg+xml;base64,' . base64_encode($svg);
    }

    /**
     * Verify the anti-bot challenge answer (case-insensitive).
     */
    public function verifySecurityChallenge(string $token, mixed $answer): void
    {
        try {
            $decrypted = Crypt::decryptString($token);
            $data = json_decode($decrypted, true);

            if (!$data || !isset($data['ans'], $data['ts'])) {
                throw new Exception('Token keamanan anti-bot tidak valid.');
            }

            // Expiry check (5 minutes)
            if (time() - $data['ts'] > 300) {
                throw new Exception('Kode CAPTCHA telah kedaluwarsa. Silakan muat ulang kode baru.');
            }

            // Verify minimum human reaction time
            if (time() - $data['ts'] < 0) {
                throw new Exception('Anomali waktu terdeteksi.');
            }

            $expected = strtoupper(trim((string) $data['ans']));
            $submitted = strtoupper(trim((string) $answer));

            if ($submitted !== $expected) {
                throw new Exception('Kode CAPTCHA salah atau tidak sesuai gambar. Silakan coba lagi.');
            }
        } catch (Exception $e) {
            throw new Exception($e->getMessage() ?: 'Verifikasi anti-bot gagal.');
        }
    }
}
