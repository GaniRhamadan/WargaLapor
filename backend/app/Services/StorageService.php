<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class StorageService
{
    protected SecurityUploadService $securityUploadService;

    public function __construct(?SecurityUploadService $securityUploadService = null)
    {
        $this->securityUploadService = $securityUploadService ?? new SecurityUploadService();
    }

    /**
     * Store uploaded image file after deep security scanning and return public path.
     */
    public function storeImage(UploadedFile|string $file, string $folder = 'reports'): string
    {
        // 1. Run deep anti-virus / anti-webshell validation
        $this->securityUploadService->validateAndCleanImage($file);

        if ($file instanceof UploadedFile) {
            $ext = strtolower($file->getClientOriginalExtension());
            $filename = Str::uuid() . '.' . $ext;
            $path = $file->storeAs($folder, $filename, 'public');
            return Storage::disk('public')->url($path);
        }

        // Handle base64 image strings if passed
        if (is_string($file) && str_starts_with($file, 'data:image')) {
            @list($type, $data) = explode(';', $file);
            @list(, $data)      = explode(',', $data);
            $decoded = base64_decode($data);
            $extension = str_contains($type, 'png') ? 'png' : (str_contains($type, 'webp') ? 'webp' : 'jpg');
            $filename = Str::uuid() . '.' . $extension;
            Storage::disk('public')->put("{$folder}/{$filename}", $decoded);
            return Storage::disk('public')->url("{$folder}/{$filename}");
        }

        // Return path as is if already a safe URL or relative path
        return (string) $file;
    }
}
