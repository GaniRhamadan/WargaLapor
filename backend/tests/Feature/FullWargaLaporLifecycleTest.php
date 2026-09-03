<?php

namespace Tests\Feature;

use Tests\TestCase;
use App\Models\User;
use App\Models\ReportCategory;
use App\Models\Report;
use App\Models\Officer;
use Laravel\Sanctum\Sanctum;
use Illuminate\Foundation\Testing\RefreshDatabase;

class FullWargaLaporLifecycleTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    public function test_complete_wargalapor_citizen_admin_officer_lifecycle()
    {
        // 1. PUBLIC: Get Categories
        $categoriesResponse = $this->getJson('/api/categories');
        $this->assertEquals(200, $categoriesResponse->status(), 'STEP 1: ' . json_encode($categoriesResponse->json()));

        $category = ReportCategory::first();
        $this->assertNotNull($category);

        // 2. CITIZEN: Register new citizen
        $uniqueEmail = 'warga_' . uniqid() . '@wargalapor.test';
        $registerResponse = $this->postJson('/api/auth/register', [
            'name' => 'Budi Santoso Pratama',
            'email' => $uniqueEmail,
            'password' => 'password123',
            'password_confirmation' => 'password123',
            'phone' => '081234567890',
            'nik' => '3171012304920005',
        ]);

        $this->assertEquals(201, $registerResponse->status(), 'STEP 2: ' . json_encode($registerResponse->json()));
        $citizenUser = User::where('email', $uniqueEmail)->first();

        // 2b. CITIZEN: Verify OTP
        $otp = \App\Models\OtpVerification::where('identifier', $uniqueEmail)->latest()->first();
        $this->assertNotNull($otp);
        $verifyResponse = $this->postJson('/api/auth/verify-otp', [
            'identifier' => $uniqueEmail,
            'otp_code' => $otp->otp_code,
        ]);
        $this->assertEquals(200, $verifyResponse->status(), 'STEP 2b: ' . json_encode($verifyResponse->json()));

        $citizenUser->refresh();
        Sanctum::actingAs($citizenUser);

        // 3. CITIZEN: Trigger AI Analysis Preview
        $aiAnalysisResponse = $this->postJson('/api/reports/analyze-ai', [
            'title' => 'Pohon Trembesi Raksasa Tumbang Menimpa Tiang Listrik',
            'description' => 'Pohon tumbang menutup total dua arah jalan Sudirman dan kabel listrik menjuntai berasap sangat membahayakan.',
            'category_id' => $category->id,
        ]);

        $this->assertEquals(200, $aiAnalysisResponse->status(), 'STEP 3: ' . json_encode($aiAnalysisResponse->json()));

        // 4. CITIZEN: Check Duplicates
        $dupResponse = $this->postJson('/api/reports/check-duplicates', [
            'latitude' => -6.2088,
            'longitude' => 106.8227,
            'category_id' => $category->id,
            'title' => 'Pohon Tumbang Sudirman',
            'description' => 'Pohon menutup jalan',
        ]);
        $this->assertEquals(200, $dupResponse->status(), 'STEP 4: ' . json_encode($dupResponse->json()));

        // 5. CITIZEN: Submit New Report (Photo + GPS)
        $createReportResponse = $this->postJson('/api/reports', [
            'category_id' => $category->id,
            'title' => 'Pohon Trembesi Raksasa Tumbang Menimpa Tiang Listrik',
            'description' => 'Pohon tumbang menutup total dua arah jalan Sudirman dan kabel listrik menjuntai berasap sangat membahayakan.',
            'latitude' => -6.2088,
            'longitude' => 106.8227,
            'address' => 'Jl. Jenderal Sudirman No. 25, RT 01 / RW 03, Jakarta Pusat',
            'images' => [
                'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
            ],
            'user_action' => 'PROCEEDED'
        ]);

        $this->assertEquals(201, $createReportResponse->status(), 'STEP 5: ' . json_encode($createReportResponse->json()));
        $reportId = $createReportResponse->json('report.id');

        // 6. ADMIN: Switch to Admin Session
        $adminUser = User::where('role', 'admin')->first();
        $this->assertNotNull($adminUser);
        Sanctum::actingAs($adminUser);

        // 7. ADMIN: Verify Report
        $verifyResponse = $this->postJson("/api/admin/reports/{$reportId}/verify", [
            'priority' => 'CRITICAL',
            'notes' => 'Laporan terverifikasi valid dan darurat oleh Administrator.'
        ]);
        $this->assertEquals(200, $verifyResponse->status(), 'STEP 7: ' . json_encode($verifyResponse->json()));

        // 8. ADMIN: Assign Officer
        $officer = Officer::first();
        $assignResponse = $this->postJson("/api/admin/reports/{$reportId}/assign", [
            'officer_id' => $officer->id,
            'notes' => 'Segera terjunkan TRC gergaji mesin dan koordinasikan dengan PLN.'
        ]);
        $this->assertEquals(200, $assignResponse->status(), 'STEP 8: ' . json_encode($assignResponse->json()));

        // 9. OFFICER: Switch to Officer Session
        $officerUser = $officer->user;
        Sanctum::actingAs($officerUser);

        // 10. OFFICER: Update Status to IN_PROGRESS
        $inProgressResponse = $this->postJson("/api/officer/tasks/{$reportId}/status", [
            'status' => 'IN_PROGRESS',
            'notes' => 'Tim TRC telah tiba di lokasi dan mulai proses pemotongan dahan.'
        ]);
        $this->assertEquals(200, $inProgressResponse->status(), 'STEP 10: ' . json_encode($inProgressResponse->json()));

        // 11. OFFICER: Update Status to RESOLVED with Proof Photo
        $resolveResponse = $this->postJson("/api/officer/tasks/{$reportId}/status", [
            'status' => 'RESOLVED',
            'notes' => 'Batang pohon telah dipotong tuntas, jalanan telah dibersihkan dan arus lalu lintas normal.',
            'proof_image' => 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
        ]);
        $this->assertEquals(200, $resolveResponse->status(), 'STEP 11: ' . json_encode($resolveResponse->json()));

        // 12. CITIZEN: Switch back to Citizen Session & View Report Detail
        Sanctum::actingAs($citizenUser);
        $detailResponse = $this->getJson("/api/reports/{$reportId}");
        $this->assertEquals(200, $detailResponse->status(), 'STEP 12: ' . json_encode($detailResponse->json()));
        $this->assertEquals('RESOLVED', $detailResponse->json('report.status'));

        // 13. CITIZEN: Submit Rating & Feedback
        $feedbackResponse = $this->postJson("/api/reports/{$reportId}/feedback", [
            'rating' => 5,
            'comments' => 'Luar biasa cepat responnya! Hanya 1 jam petugas sudah membereskan pohon tumbang.'
        ]);
        $this->assertEquals(200, $feedbackResponse->status(), 'STEP 13: ' . json_encode($feedbackResponse->json()));

        // 14. ADMIN: Switch to Admin and Check Analytics
        Sanctum::actingAs($adminUser);
        $analyticsResponse = $this->getJson('/api/admin/analytics');
        $this->assertEquals(200, $analyticsResponse->status(), 'STEP 14: ' . json_encode($analyticsResponse->json()));
        $this->assertGreaterThanOrEqual(1, $analyticsResponse->json('metrics.total_reports'));
    }
}
