<?php

namespace Tests\Feature;

use App\Models\Officer;
use App\Models\Report;
use App\Models\ReportCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WargaLaporApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_user_can_login_and_get_sanctum_token(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'warga@wargalapor.test',
            'password' => 'password',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'message',
                'user' => ['id', 'name', 'email', 'role'],
                'token',
            ]);
    }

    public function test_citizen_can_create_report_with_ai_analysis(): void
    {
        $user = User::where('email', 'warga@wargalapor.test')->first();
        $category = ReportCategory::first();

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/reports', [
            'category_id' => $category->id,
            'title' => 'Lubang Jalan Sangat Bahaya di Depan Stasiun',
            'description' => 'Ada lubang aspal amblas dan pohon roboh di tikungan yang berpotensi menyebabkan kecelakaan parah.',
            'latitude' => -6.2000,
            'longitude' => 106.8166,
            'address' => 'Jl. Kebon Sirih No. 10',
            'images' => ['https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800'],
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'report' => [
                    'id',
                    'report_number',
                    'title',
                    'priority',
                    'status',
                    'ai_analysis',
                ],
            ]);

        $this->assertDatabaseHas('reports', [
            'title' => 'Lubang Jalan Sangat Bahaya di Depan Stasiun',
            'status' => 'SUBMITTED',
        ]);
    }

    public function test_admin_can_verify_and_assign_officer(): void
    {
        $admin = User::where('email', 'admin@wargalapor.test')->first();
        $officer = Officer::first();
        $report = Report::where('status', 'SUBMITTED')->first();

        // 1. Verify
        $verifyRes = $this->actingAs($admin, 'sanctum')->postJson("/api/admin/reports/{$report->id}/verify", [
            'priority' => 'HIGH',
            'notes' => 'Laporan diverifikasi untuk penanganan TRC.',
        ]);
        $verifyRes->assertStatus(200);

        // 2. Assign Officer
        $assignRes = $this->actingAs($admin, 'sanctum')->postJson("/api/admin/reports/{$report->id}/assign", [
            'officer_id' => $officer->id,
            'notes' => 'Tolong prioritaskan hari ini.',
        ]);
        $assignRes->assertStatus(200);

        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'status' => 'ASSIGNED',
        ]);
    }

    public function test_officer_can_update_status_and_resolve(): void
    {
        $officerUser = User::where('email', 'petugas@wargalapor.test')->first();
        $officer = Officer::where('user_id', $officerUser->id)->first();
        $report = Report::whereHas('assignments', function ($q) use ($officer) {
            $q->where('officer_id', $officer->id)->whereIn('status', ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS']);
        })->first();

        if (!$report) {
            $report = Report::first();
            $report->assignments()->create([
                'officer_id' => $officer->id,
                'assigned_by' => 1,
                'status' => 'ASSIGNED',
                'assigned_at' => now(),
            ]);
        }

        // Officer updates to IN_PROGRESS
        $res = $this->actingAs($officerUser, 'sanctum')->postJson("/api/officer/tasks/{$report->id}/status", [
            'status' => 'IN_PROGRESS',
            'notes' => 'Petugas sedang di lokasi melakukan perbaikan.',
        ]);
        $res->assertStatus(200);

        // Officer completes and uploads resolution proof
        $resolveRes = $this->actingAs($officerUser, 'sanctum')->postJson("/api/officer/tasks/{$report->id}/status", [
            'status' => 'RESOLVED',
            'notes' => 'Perbaikan jalan telah selesai ditambal dengan hotmix.',
            'proof_image' => 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800',
        ]);
        $resolveRes->assertStatus(200);

        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'status' => 'RESOLVED',
        ]);
    }

    public function test_role_authorization_guards_prevent_unauthorized_access(): void
    {
        $citizen = User::where('email', 'warga@wargalapor.test')->first();
        $officer = User::where('email', 'petugas@wargalapor.test')->first();

        // 1. Citizen cannot access admin reports or officer tasks
        $this->actingAs($citizen, 'sanctum')->getJson('/api/admin/reports')->assertStatus(403);
        $this->actingAs($citizen, 'sanctum')->getJson('/api/admin/citizens')->assertStatus(403);
        $this->actingAs($citizen, 'sanctum')->getJson('/api/admin/analytics')->assertStatus(403);
        $this->actingAs($citizen, 'sanctum')->getJson('/api/officer/tasks')->assertStatus(403);

        // 2. Officer cannot access admin management
        $this->actingAs($officer, 'sanctum')->getJson('/api/admin/reports')->assertStatus(403);
        $this->actingAs($officer, 'sanctum')->getJson('/api/admin/citizens')->assertStatus(403);
    }

    public function test_visual_captcha_challenge_generation_and_validation(): void
    {
        // 1. Fetch challenge
        $response = $this->getJson('/api/auth/security-challenge');
        $response->assertStatus(200)
            ->assertJsonStructure([
                'captcha_image',
                'token',
                'expires_in_seconds',
            ]);

        $this->assertStringStartsWith('data:image/svg+xml;base64,', $response->json('captcha_image'));

        // 2. Test failed login with invalid captcha answer
        $badCaptchaLogin = $this->postJson('/api/auth/login', [
            'email' => 'warga@wargalapor.test',
            'password' => 'password',
            'security_token' => $response->json('token'),
            'security_answer' => 'ZZZZZ', // wrong code
        ]);
        $badCaptchaLogin->assertStatus(422);
    }

    public function test_forgot_password_and_reset_flow_with_otp(): void
    {
        // 1. Non-existent email should return 404
        $notFound = $this->postJson('/api/auth/forgot-password', [
            'email' => 'unknown_user_123@example.com',
        ]);
        $notFound->assertStatus(404);

        // 2. Existing user forgot password dispatches OTP
        $forgotResponse = $this->postJson('/api/auth/forgot-password', [
            'email' => 'warga@wargalapor.test',
        ]);
        $forgotResponse->assertStatus(200);

        $otpRecord = \App\Models\OtpVerification::where('identifier', 'warga@wargalapor.test')
            ->where('type', 'FORGOT_PASSWORD')
            ->where('is_used', false)
            ->latest()
            ->first();

        $this->assertNotNull($otpRecord);
        $this->assertEquals(6, strlen($otpRecord->otp_code));

        // 3. Reset password with correct OTP
        $resetResponse = $this->postJson('/api/auth/reset-password', [
            'email' => 'warga@wargalapor.test',
            'otp_code' => $otpRecord->otp_code,
            'password' => 'newsecretpassword123',
            'password_confirmation' => 'newsecretpassword123',
        ]);
        $resetResponse->assertStatus(200);

        // 4. Verify login with new password
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'warga@wargalapor.test',
            'password' => 'newsecretpassword123',
        ]);
        $loginResponse->assertStatus(200)
            ->assertJsonStructure(['token', 'user']);
    }

    public function test_registration_validates_phone_and_nik_maximum_input(): void
    {
        // 1. Phone too long (> 15 chars) should fail with 422
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Warga Uji Coba',
            'email' => 'testphone@wargalapor.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '0812345678901234', // 16 digits
            'nik' => '3171012304920001',
        ]);
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['phone']);

        // 2. NIK not 16 digits should fail with 422
        $responseNikTooLong = $this->postJson('/api/auth/register', [
            'name' => 'Warga Uji Coba',
            'email' => 'testnik@wargalapor.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '081234567890',
            'nik' => '317101230492000199', // 18 digits
        ]);
        $responseNikTooLong->assertStatus(422)
            ->assertJsonValidationErrors(['nik']);

        $responseNikTooShort = $this->postJson('/api/auth/register', [
            'name' => 'Warga Uji Coba',
            'email' => 'testnik2@wargalapor.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '081234567890',
            'nik' => '31710123049', // 11 digits
        ]);
        $responseNikTooShort->assertStatus(422)
            ->assertJsonValidationErrors(['nik']);

        // 3. Valid input (Phone <= 15 and NIK = 16) should succeed
        $responseSuccess = $this->postJson('/api/auth/register', [
            'name' => 'Warga Sukses',
            'email' => 'wargasukses@wargalapor.test',
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '081234567890',
            'nik' => '3171012304920001',
        ]);
        $responseSuccess->assertStatus(201);
    }
}
