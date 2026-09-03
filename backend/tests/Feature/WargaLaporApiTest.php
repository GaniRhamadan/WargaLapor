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
        $report = Report::where('status', 'ASSIGNED')->first() ?: Report::first();

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
}
