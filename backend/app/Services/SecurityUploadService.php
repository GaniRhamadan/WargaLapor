<?php

namespace App\Services;

use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class SecurityUploadService
{
    /**
     * Allowed MIME types and extensions for file uploads.
     */
    protected const ALLOWED_MIMES = [
        'image/jpeg' => ['jpg', 'jpeg'],
        'image/png'  => ['png'],
        'image/webp' => ['webp'],
    ];

    /**
     * Dangerous signature patterns commonly found in webshells, php scripts, or malicious polyglot images.
     */
    protected const MALICIOUS_PATTERNS = [
        '/<\?php/i',
        '/<\?=/i',
        '/<script[\s>]/i',
        '/eval\s*\(/i',
        '/base64_decode\s*\(/i',
        '/system\s*\(/i',
        '/passthru\s*\(/i',
        '/shell_exec\s*\(/i',
        '/proc_open\s*\(/i',
        '/popen\s*\(/i',
        '/file_put_contents\s*\(/i',
        '/assert\s*\(/i',
        '/<svg[\s>]/i', // Prevent SVG embedded javascript / XML external entity attacks
        '/<!DOCTYPE[\s>]/i',
        '/\bdata:text\/html\b/i',
    ];

    /**
     * Maximum allowed upload size (5 MB).
     */
    protected const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

    /**
     * Deep inspection & virus/webshell validation for uploaded files.
     *
     * @throws Exception if file is malicious, invalid, or violates safety rules.
     */
    public function validateAndCleanImage(UploadedFile|string $file): string|UploadedFile
    {
        if ($file instanceof UploadedFile) {
            $this->validateUploadedFile($file);
            return $file;
        }

        if (is_string($file) && str_starts_with($file, 'data:image')) {
            $this->validateBase64Image($file);
            return $file;
        }

        // Standard string URL or pre-existing safe path
        if (is_string($file) && (filter_var($file, FILTER_VALIDATE_URL) || str_starts_with($file, '/storage/'))) {
            return $file;
        }

        throw new Exception('Format file atau URL gambar tidak valid atau tidak diizinkan.');
    }

    /**
     * Deep validate standard UploadedFile instance.
     */
    protected function validateUploadedFile(UploadedFile $file): void
    {
        if (!$file->isValid()) {
            throw new Exception('File yang diunggah rusak atau tidak lengkap.');
        }

        // 1. Check File Size
        if ($file->getSize() > self::MAX_FILE_SIZE) {
            throw new Exception('Ukuran file melebihi batas maksimum 5MB.');
        }

        // 2. Check Extension Whitelist
        $clientExt = strtolower($file->getClientOriginalExtension());
        $allAllowedExts = array_merge(...array_values(self::ALLOWED_MIMES));
        if (!in_array($clientExt, $allAllowedExts, true)) {
            throw new Exception("Ekstensi file .{$clientExt} dilarang. Hanya diizinkan: jpg, jpeg, png, webp.");
        }

        // 3. Check Real MIME Type via finfo
        $realMime = $file->getMimeType();
        if (!array_key_exists($realMime, self::ALLOWED_MIMES)) {
            throw new Exception("Tipe konten file ({$realMime}) tidak valid atau terindikasi berbahaya.");
        }

        // 4. Verify Real Image Dimensions via getimagesize()
        $imageInfo = @getimagesize($file->getRealPath());
        if ($imageInfo === false || $imageInfo[0] <= 0 || $imageInfo[1] <= 0) {
            throw new Exception('File bukan gambar biner yang valid atau telah dimodifikasi secara ilegal.');
        }

        // 5. Deep Scan Binary Content for Webshell / Executable Script Injection
        $content = file_get_contents($file->getRealPath());
        $this->scanForMaliciousSignatures($content);
    }

    /**
     * Deep validate base64 encoded image string.
     */
    protected function validateBase64Image(string $base64String): void
    {
        @list($header, $data) = explode(';', $base64String, 2);
        if (!$data || !str_contains($header, 'data:image/')) {
            throw new Exception('Format Base64 gambar tidak valid.');
        }

        @list(, $data) = explode(',', $data, 2);
        $decoded = base64_decode($data, true);
        if ($decoded === false) {
            throw new Exception('Dekode data gambar Base64 gagal.');
        }

        if (strlen($decoded) > self::MAX_FILE_SIZE) {
            throw new Exception('Ukuran data gambar Base64 melebihi batas maksimum 5MB.');
        }

        // Scan binary content for signatures
        $this->scanForMaliciousSignatures($decoded);
    }

    /**
     * Scan raw binary / text content against known malicious code signatures.
     */
    protected function scanForMaliciousSignatures(string $content): void
    {
        // Check for dangerous patterns
        foreach (self::MALICIOUS_PATTERNS as $pattern) {
            if (preg_match($pattern, $content)) {
                throw new Exception('Sistem Keamanan: File ditolak karena terdeteksi mengandung skrip berbahaya / webshell / virus.');
            }
        }

        // Check for double extension patterns e.g., image.php.jpg or exploit payloads
        if (preg_match('/\.(php[0-9]?|phtml|phar|exe|sh|pl|cgi|bat|js|vbs)\b/i', $content)) {
            throw new Exception('Sistem Keamanan: Payload file mencurigakan terdeteksi.');
        }
    }
}
