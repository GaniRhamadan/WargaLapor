<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\AntiBotSecurityService;
use App\Services\AuditLoggerService;
use App\Services\OtpService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    protected OtpService $otpService;
    protected AntiBotSecurityService $antiBotService;

    public function __construct(
        OtpService $otpService,
        AntiBotSecurityService $antiBotService
    ) {
        $this->otpService = $otpService;
        $this->antiBotService = $antiBotService;
    }

    /**
     * Get dynamic anti-bot security challenge.
     */
    public function getSecurityChallenge(): JsonResponse
    {
        $challenge = $this->antiBotService->generateChallenge();
        return response()->json($challenge);
    }

    /**
     * Register a new citizen account with active verification via OTP.
     */
    public function register(Request $request): JsonResponse
    {
        // 1. Anti-Bot / Anti-Spam Check
        try {
            $this->antiBotService->validateBotProtection($request);
        } catch (Exception $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error_code' => 'BOT_DETECTED',
            ], 422);
        }

        // 2. Strict Input Validation (Active email & Valid Phone required)
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:3', 'max:100', 'regex:/^[a-zA-Z\s\.\,\'\-]+$/'],
            'email' => ['required', 'string', 'email:rfc,filter', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:15', 'regex:/^(\+62|62|0)8[1-9][0-9]{6,11}$/'],
            'nik' => ['nullable', 'string', 'size:16', 'regex:/^[0-9]{16}$/'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
            'security_token' => ['nullable', 'string'],
            'security_answer' => ['nullable'],
        ], [
            'name.regex' => 'Nama lengkap hanya boleh memuat huruf dan tanda baca umum.',
            'email.email' => 'Format alamat email tidak valid atau domain tidak aktif.',
            'phone.required' => 'Nomor HP/WhatsApp aktif wajib diisi untuk verifikasi OTP.',
            'phone.max' => 'Nomor HP/WhatsApp maksimal 15 karakter.',
            'phone.regex' => 'Format nomor HP tidak valid (contoh format Indonesia: 08123456789 atau +628123456789).',
            'nik.size' => 'NIK harus berupa tepat 16 digit angka sesuai KTP.',
            'nik.regex' => 'NIK harus berupa 16 digit angka sesuai KTP.',
            'password.min' => 'Kata sandi minimal 6 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
        ]);

        // Normalize phone number to standard Indonesian +62 international format
        $phone = trim($validated['phone']);
        if (str_starts_with($phone, '0')) {
            $phone = '+62' . substr($phone, 1);
        } elseif (str_starts_with($phone, '62')) {
            $phone = '+' . $phone;
        } elseif (!str_starts_with($phone, '+')) {
            $phone = '+62' . $phone;
        }

        // 3. Create Pending User (Unverified until OTP is confirmed)
        $user = User::create([
            'name' => $validated['name'],
            'email' => strtolower($validated['email']),
            'phone' => $phone,
            'nik' => $validated['nik'] ?? null,
            'role' => 'citizen',
            'status' => 'pending_verification',
            'email_verified_at' => null,
            'phone_verified_at' => null,
            'failed_login_attempts' => 0,
            'password' => Hash::make($validated['password']),
        ]);

        // 4. Generate and send 6-digit OTP code to email & phone
        $otpResult = $this->otpService->generateAndSend(
            $user->email,
            'REGISTER',
            $user,
            $request->ip()
        );

        AuditLoggerService::log('REGISTER_PENDING_USER', 'User', $user->id, null, [
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
        ], $user);

        return response()->json([
            'status' => 'PENDING_OTP',
            'message' => 'Pendaftaran akun berhasil diajukan. Silakan masukkan 6 digit kode OTP yang telah kami kirimkan untuk mengaktifkan akun Anda.',
            'identifier' => $user->email,
            'phone' => $user->phone,
            'channel' => $otpResult['channel'],
            'expires_at' => $otpResult['expires_at'],
        ], 201);
    }

    /**
     * Verify 6-digit OTP code and activate account.
     */
    public function verifyOtp(Request $request): JsonResponse
    {
        $request->validate([
            'identifier' => 'required|string',
            'otp_code' => 'required|string|size:6',
            'type' => 'nullable|string|in:REGISTER,LOGIN_2FA,FORGOT_PASSWORD',
        ], [
            'otp_code.size' => 'Kode OTP harus berupa 6 digit angka.',
        ]);

        $identifier = strtolower(trim($request->identifier));
        $code = trim($request->otp_code);
        $type = $request->type ?? 'REGISTER';

        $verifyResult = $this->otpService->verify($identifier, $code, $type);

        if (!$verifyResult['success']) {
            return response()->json([
                'message' => $verifyResult['message'],
                'error_code' => $verifyResult['code'] ?? 'OTP_FAILED',
                'remaining_attempts' => $verifyResult['remaining_attempts'] ?? null,
            ], 422);
        }

        // Find user by email or phone
        $user = User::where('email', $identifier)
            ->orWhere('phone', $identifier)
            ->first();

        if (!$user) {
            return response()->json([
                'message' => 'Pengguna tidak ditemukan.',
            ], 404);
        }

        // Activate User
        $user->status = 'active';
        $user->email_verified_at = now();
        $user->phone_verified_at = now();
        $user->failed_login_attempts = 0;
        $user->lockout_until = null;
        $user->save();

        // Generate Sanctum auth token
        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLoggerService::log('USER_VERIFIED_OTP', 'User', $user->id, null, [
            'identifier' => $identifier,
            'verified_at' => now()->toIso8601String(),
        ], $user);

        return response()->json([
            'message' => 'Verifikasi OTP berhasil! Akun Anda kini telah aktif dan siap digunakan.',
            'user' => $user->fresh()->load('officerProfile'),
            'token' => $token,
        ]);
    }

    /**
     * Resend OTP with rate limiting cooldown.
     */
    public function resendOtp(Request $request): JsonResponse
    {
        $request->validate([
            'identifier' => 'required|string',
            'type' => 'nullable|string|in:REGISTER,LOGIN_2FA,FORGOT_PASSWORD',
        ]);

        $identifier = strtolower(trim($request->identifier));
        $type = $request->type ?? 'REGISTER';

        $canResend = $this->otpService->canResend($identifier, $type);
        if (!$canResend['allowed']) {
            return response()->json([
                'message' => $canResend['message'],
                'wait_seconds' => $canResend['wait_seconds'],
            ], 429);
        }

        $user = User::where('email', $identifier)->orWhere('phone', $identifier)->first();

        if ($type === 'FORGOT_PASSWORD' && !$user) {
            return response()->json([
                'message' => 'Alamat email tidak terdaftar dalam sistem.',
            ], 404);
        }

        $result = $this->otpService->generateAndSend($identifier, $type, $user, $request->ip());

        return response()->json([
            'message' => 'Kode OTP baru telah berhasil dikirimkan.',
            'identifier' => $identifier,
            'channel' => $result['channel'],
            'expires_at' => $result['expires_at'],
        ]);
    }

    /**
     * Login user with Brute Force Protection & Active Verification Guard.
     */
    public function login(Request $request): JsonResponse
    {
        // 1. Anti-Bot Trap
        try {
            $this->antiBotService->validateBotProtection($request);
        } catch (Exception $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $request->validate([
            'email' => 'required|string',
            'password' => 'required|string',
            'security_token' => 'nullable|string',
            'security_answer' => 'nullable',
        ]);

        $emailOrPhone = strtolower(trim($request->email));

        // Automated Role Mapping based on Email
        // 1. admin@admin / admin -> Resolves to Administrator
        // 2. petugas@petugas / petugas -> Resolves to Officer
        // 3. Any active Gmail / personal email -> Resolves to Citizen
        if ($emailOrPhone === 'admin@admin' || $emailOrPhone === 'admin') {
            $user = User::where('email', 'admin@admin')
                ->orWhere('email', 'admin@wargalapor.test')
                ->orWhere('role', 'admin')
                ->with('officerProfile')
                ->first();
        } elseif ($emailOrPhone === 'petugas@petugas' || $emailOrPhone === 'petugas') {
            $user = User::where('email', 'petugas@petugas')
                ->orWhere('email', 'petugas@wargalapor.test')
                ->orWhere('role', 'officer')
                ->with('officerProfile')
                ->first();
        } else {
            $user = User::where('email', $emailOrPhone)
                ->orWhere('phone', $emailOrPhone)
                ->orWhere('nik', $emailOrPhone)
                ->with('officerProfile')
                ->first();
        }

        // Account Lockout check (15 minutes after 5 consecutive failed attempts)
        if ($user && $user->isLocked()) {
            $remainingMins = ceil(now()->diffInSeconds($user->lockout_until) / 60);
            return response()->json([
                'message' => "Akun terkunci sementara karena terlalu banyak percobaan login gagal demi keamanan. Silakan coba lagi dalam {$remainingMins} menit.",
            ], 423);
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            if ($user) {
                $user->increment('failed_login_attempts');
                if ($user->failed_login_attempts >= 5) {
                    $user->lockout_until = now()->addMinutes(15);
                    $user->save();
                    AuditLoggerService::log('ACCOUNT_LOCKED_BRUTEFORCE', 'User', $user->id, null, ['ip' => $request->ip()]);
                    return response()->json([
                        'message' => 'Terlalu banyak percobaan salah. Akun Anda telah dikunci sementara selama 15 menit demi perlindungan.',
                    ], 423);
                }
                $user->save();
            }

            throw ValidationException::withMessages([
                'email' => ['Kombinasi email/nomor HP dan kata sandi tidak cocok.'],
            ]);
        }

        // Suspended Account Check
        if ($user->status === 'suspended') {
            return response()->json([
                'message' => 'Akun Anda sedang dinonaktifkan oleh administrator. Silakan hubungi layanan bantuan.',
            ], 403);
        }

        // Active Account / OTP Verification Check
        if (!$user->isVerified() || $user->status === 'pending_verification') {
            // Generate OTP for activation
            $otpResult = $this->otpService->generateAndSend($user->email, 'REGISTER', $user, $request->ip());

            return response()->json([
                'requires_otp' => true,
                'status' => 'PENDING_OTP',
                'message' => 'Akun Anda belum aktif. Masukkan kode OTP yang dikirimkan ke email/WhatsApp Anda untuk melanjutkan login.',
                'identifier' => $user->email,
                'phone' => $user->phone,
                'channel' => $otpResult['channel'],
            ], 200);
        }

        // Reset failed login attempts on success
        $user->failed_login_attempts = 0;
        $user->lockout_until = null;
        $user->save();

        $token = $user->createToken('auth_token')->plainTextToken;

        AuditLoggerService::log('LOGIN_USER', 'User', $user->id, null, ['ip' => $request->ip()], $user);

        return response()->json([
            'message' => 'Login berhasil. Selamat datang kembali, ' . $user->name . '!',
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * Get authenticated user profile.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user()->load('officerProfile');
        return response()->json([
            'user' => $user,
        ]);
    }

    /**
     * Update authenticated user profile with validation.
     */
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'sometimes|required|string|min:3|max:100',
            'phone' => 'nullable|string|max:15|regex:/^(\+62|62|0)8[1-9][0-9]{6,11}$/',
            'nik' => 'nullable|string|size:16|regex:/^[0-9]{16}$/',
            'avatar' => 'nullable|string',
            'password' => 'nullable|string|min:6|confirmed',
        ], [
            'phone.max' => 'Nomor telepon maksimal 15 digit.',
            'phone.regex' => 'Format nomor telepon tidak valid (contoh: 081234567890).',
            'nik.size' => 'NIK harus berupa tepat 16 digit angka sesuai KTP.',
            'nik.regex' => 'NIK harus berupa 16 digit angka sesuai KTP.',
        ]);

        if (isset($validated['name'])) $user->name = $validated['name'];
        if (isset($validated['phone'])) $user->phone = $validated['phone'];
        if (isset($validated['nik'])) $user->nik = $validated['nik'];
        if (isset($validated['avatar'])) $user->avatar = $validated['avatar'];
        if (!empty($validated['password'])) {
            $user->password = Hash::make($validated['password']);
        }

        $user->save();

        AuditLoggerService::log('UPDATE_PROFILE', 'User', $user->id, null, ['name' => $user->name], $user);

        return response()->json([
            'message' => 'Profil Anda berhasil diperbarui.',
            'user' => $user->fresh()->load('officerProfile'),
        ]);
    }

    /**
     * Logout and revoke token.
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();
        if ($user) {
            $user->currentAccessToken()->delete();
            AuditLoggerService::log('LOGOUT_USER', 'User', $user->id, null, null, $user);
        }

        return response()->json([
            'message' => 'Anda telah berhasil keluar dari akun.',
        ]);
    }

    /**
     * Forgot Password Handler with OTP.
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        $request->validate(['email' => 'required|email'], [
            'email.required' => 'Alamat email akun wajib diisi.',
            'email.email' => 'Format alamat email tidak valid.',
        ]);

        $user = User::where('email', strtolower(trim($request->email)))->first();

        if (!$user) {
            return response()->json([
                'message' => 'Alamat email tidak terdaftar dalam sistem. Pastikan email Anda sudah benar atau lakukan pendaftaran akun terlebih dahulu.',
            ], 404);
        }

        $otpResult = $this->otpService->generateAndSend($user->email, 'FORGOT_PASSWORD', $user, $request->ip());

        return response()->json([
            'message' => 'Kode OTP 6-digit untuk reset kata sandi telah dikirimkan ke email Gmail Anda (' . $user->email . ').',
            'identifier' => $user->email,
            'channel' => $otpResult['channel'],
            'expires_at' => $otpResult['expires_at'],
        ]);
    }

    /**
     * Reset Password Handler with verified OTP.
     */
    public function resetPassword(Request $request): JsonResponse
    {
        $request->validate([
            'email' => 'required|email',
            'otp_code' => 'required|string|size:6',
            'password' => 'required|string|min:6|confirmed',
        ], [
            'email.required' => 'Email wajib diisi.',
            'email.email' => 'Format email tidak valid.',
            'otp_code.required' => 'Kode OTP 6-digit wajib diisi.',
            'otp_code.size' => 'Kode OTP harus berupa 6 digit angka.',
            'password.required' => 'Kata sandi baru wajib diisi.',
            'password.min' => 'Kata sandi minimal 6 karakter.',
            'password.confirmed' => 'Konfirmasi kata sandi tidak cocok.',
        ]);

        $verifyResult = $this->otpService->verify(strtolower(trim($request->email)), $request->otp_code, 'FORGOT_PASSWORD');
        if (!$verifyResult['success']) {
            return response()->json([
                'message' => $verifyResult['message'],
            ], 422);
        }

        $user = User::where('email', strtolower(trim($request->email)))->first();
        if ($user) {
            $user->password = Hash::make($request->password);
            $user->failed_login_attempts = 0;
            $user->lockout_until = null;
            $user->save();

            AuditLoggerService::log('RESET_PASSWORD', 'User', $user->id, null, null, $user);
        }

        return response()->json([
            'message' => 'Kata sandi Anda berhasil diperbarui! Silakan login dengan kata sandi baru.',
        ]);
    }
}
