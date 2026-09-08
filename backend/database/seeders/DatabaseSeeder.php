<?php

namespace Database\Seeders;

use App\Models\AiAnalysis;
use App\Models\AuditLog;
use App\Models\DuplicateReport;
use App\Models\Notification;
use App\Models\Officer;
use App\Models\Permission;
use App\Models\Report;
use App\Models\ReportAssignment;
use App\Models\ReportCategory;
use App\Models\ReportComment;
use App\Models\ReportFeedback;
use App\Models\ReportImage;
use App\Models\ReportStatusHistory;
use App\Models\Role;
use App\Models\Setting;
use App\Models\SlaSetting;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Roles & Permissions
        $adminRole = Role::create(['name' => 'Administrator', 'slug' => 'admin', 'description' => 'Akses penuh seluruh modul sistem']);
        $officerRole = Role::create(['name' => 'Petugas Lapangan', 'slug' => 'officer', 'description' => 'Menangani tugas dan update status di lapangan']);
        $citizenRole = Role::create(['name' => 'Warga Masyarakat', 'slug' => 'citizen', 'description' => 'Membuat laporan dan memberikan feedback']);

        // 2. SLA Settings
        SlaSetting::create(['priority' => 'CRITICAL', 'response_time_hours' => 1, 'resolution_time_hours' => 4, 'description' => 'Bahaya keselamatan jiwa, bencana mendesak, atau jalan protokol terputus']);
        SlaSetting::create(['priority' => 'HIGH', 'response_time_hours' => 3, 'resolution_time_hours' => 12, 'description' => 'Kerusakan berat yang mengganggu mobilitas luas dan fasilitas publik vital']);
        SlaSetting::create(['priority' => 'MEDIUM', 'response_time_hours' => 6, 'resolution_time_hours' => 24, 'description' => 'Kerusakan sedang pada fasilitas lingkungan pemukiman']);
        SlaSetting::create(['priority' => 'LOW', 'response_time_hours' => 12, 'resolution_time_hours' => 72, 'description' => 'Perawatan rutin, estetika taman, dan marka non-kritis']);

        // 3. System Settings
        Setting::set('app_name', 'WargaLapor', 'general', 'Nama Aplikasi');
        Setting::set('tagline', 'Laporkan Masalah. Pantau Prosesnya. Bangun Lingkungan Lebih Baik.', 'general', 'Tagline Platform');
        Setting::set('emergency_hotline', '112 / (021) 500-123', 'contact', 'Nomor Kontak Darurat 24 Jam');
        Setting::set('city_name', 'DKI Jakarta & Sekitarnya', 'general', 'Wilayah Operasional');
        Setting::set('ai_model_name', 'Google Gemini 1.5 Flash', 'ai', 'Model AI yang digunakan');

        // 4. Categories
        $categories = [
            ['name' => 'Jalan Rusak & Berlubang', 'slug' => 'jalan-rusak', 'icon' => 'AlertTriangle', 'color' => '#DC2626', 'default_priority' => 'HIGH', 'description' => 'Jalan berlubang, aspal amblas, trotoar hancur'],
            ['name' => 'Sampah & Kebersihan', 'slug' => 'sampah-kebersihan', 'icon' => 'Trash2', 'color' => '#10B981', 'default_priority' => 'MEDIUM', 'description' => 'Tumpukan sampah liar, TPS overload, sungai kotor'],
            ['name' => 'Lampu Jalan & PJU Mati', 'slug' => 'lampu-jalan', 'icon' => 'Lightbulb', 'color' => '#F59E0B', 'default_priority' => 'MEDIUM', 'description' => 'PJU padam, tiang miring, kabel lampu putus'],
            ['name' => 'Banjir & Drainase Mampet', 'slug' => 'banjir-drainase', 'icon' => 'Droplets', 'color' => '#06B6D4', 'default_priority' => 'HIGH', 'description' => 'Genangan air jalan, saluran tersumbat, tanggul retak'],
            ['name' => 'Pohon Tumbang & Rawan', 'slug' => 'pohon-tumbang', 'icon' => 'Trees', 'color' => '#84CC16', 'default_priority' => 'CRITICAL', 'description' => 'Dahan patah menutup jalan, pohon lapuk rawan tumbang'],
            ['name' => 'Saluran Air Bersih / PDAM', 'slug' => 'air-bersih', 'icon' => 'Waves', 'color' => '#3B82F6', 'default_priority' => 'MEDIUM', 'description' => 'Pipa PDAM bocor di jalan, air mati di pemukiman'],
            ['name' => 'Fasilitas Umum & Taman', 'slug' => 'fasilitas-umum', 'icon' => 'Landmark', 'color' => '#8B5CF6', 'default_priority' => 'LOW', 'description' => 'Bangku taman rusak, jembatan penyeberangan, halte bus'],
            ['name' => 'Fasilitas Sekolah & Edukasi', 'slug' => 'fasilitas-sekolah', 'icon' => 'GraduationCap', 'color' => '#EC4899', 'default_priority' => 'MEDIUM', 'description' => 'Akses jalan sekolah membahayakan murid, pagar roboh'],
            ['name' => 'Lalu Lintas & Rambu Rusak', 'slug' => 'lalu-lintas', 'icon' => 'TrafficCone', 'color' => '#F97316', 'default_priority' => 'HIGH', 'description' => 'Traffic light mati, rambu lalu lintas roboh / tertutup'],
            ['name' => 'Lainnya & Ketertiban', 'slug' => 'lainnya', 'icon' => 'ShieldAlert', 'color' => '#64748B', 'default_priority' => 'LOW', 'description' => 'Gangguan ketertiban umum dan aduan warga lainnya'],
        ];

        $catModels = [];
        foreach ($categories as $cat) {
            $catModels[$cat['slug']] = ReportCategory::create($cat);
        }

        // 5. Users (Admin, Officers, Citizens)
        $admin = User::create([
            'name' => 'Bambang Pamungkas, S.STP',
            'email' => 'admin@wargalapor.test',
            'phone' => '08119876001',
            'nik' => '3171010101850001',
            'role' => 'admin',
            'status' => 'active',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
            'password' => Hash::make('password'),
        ]);
        $admin->roles()->attach($adminRole->id);

        $petugas1User = User::create([
            'name' => 'Hendra Wijaya',
            'email' => 'petugas@wargalapor.test',
            'phone' => '081288991001',
            'nik' => '3171020202880002',
            'role' => 'officer',
            'status' => 'active',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
            'password' => Hash::make('password'),
        ]);
        $petugas1User->roles()->attach($officerRole->id);
        $officer1 = Officer::create([
            'user_id' => $petugas1User->id,
            'department' => 'Dinas Bina Marga & Sumber Daya Air',
            'unit' => 'Tim Reaksi Cepat 01 (TRC Jalan)',
            'area_coverage' => 'Jakarta Pusat & Selatan',
            'active_tasks_count' => 2,
            'completed_tasks_count' => 14,
            'status' => 'available',
        ]);

        $petugas2User = User::create([
            'name' => 'Siti Rahmawati',
            'email' => 'petugas2@wargalapor.test',
            'phone' => '081288991002',
            'nik' => '3171030303900003',
            'role' => 'officer',
            'status' => 'active',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
            'password' => Hash::make('password'),
        ]);
        $petugas2User->roles()->attach($officerRole->id);
        $officer2 = Officer::create([
            'user_id' => $petugas2User->id,
            'department' => 'Dinas Lingkungan Hidup (DLH)',
            'unit' => 'Satgas Kebersihan Wilayah Barat',
            'area_coverage' => 'Jakarta Barat & Utara',
            'active_tasks_count' => 1,
            'completed_tasks_count' => 18,
            'status' => 'available',
        ]);

        $petugas3User = User::create([
            'name' => 'Agus Pratama',
            'email' => 'petugas3@wargalapor.test',
            'phone' => '081288991003',
            'nik' => '3171040404920004',
            'role' => 'officer',
            'status' => 'active',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
            'password' => Hash::make('password'),
        ]);
        $petugas3User->roles()->attach($officerRole->id);
        $officer3 = Officer::create([
            'user_id' => $petugas3User->id,
            'department' => 'Dinas Perhubungan & Penerangan Jalan',
            'unit' => 'Unit Pemeliharaan Lampu & Rambu',
            'area_coverage' => 'Jakarta Timur & Sekitarnya',
            'active_tasks_count' => 3,
            'completed_tasks_count' => 22,
            'status' => 'available',
        ]);

        $warga1 = User::create([
            'name' => 'Budi Santoso',
            'email' => 'warga@wargalapor.test',
            'phone' => '081234567890',
            'nik' => '3171012304920001',
            'role' => 'citizen',
            'status' => 'active',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
            'password' => Hash::make('password'),
        ]);
        $warga1->roles()->attach($citizenRole->id);

        $warga2 = User::create([
            'name' => 'Dewi Lestari',
            'email' => 'budi@wargalapor.test',
            'phone' => '081298765432',
            'nik' => '3171025508940003',
            'role' => 'citizen',
            'status' => 'active',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
            'password' => Hash::make('password'),
        ]);
        $warga2->roles()->attach($citizenRole->id);

        $warga3 = User::create([
            'name' => 'Ahmad Fauzi',
            'email' => 'ahmad@wargalapor.test',
            'phone' => '081377889900',
            'nik' => '3171031112880005',
            'role' => 'citizen',
            'status' => 'active',
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
            'password' => Hash::make('password'),
        ]);
        $warga3->roles()->attach($citizenRole->id);

        // 6. Reports Seed Data (22 rich realistic reports)
        $sampleReports = [
            [
                'number' => 'WL-2026-000001',
                'user' => $warga1,
                'cat' => $catModels['jalan-rusak'],
                'title' => 'Lubang Besar Membahayakan Pengendara Motor di Depan Halte Dukuh Atas',
                'desc' => 'Ada lubang sedalam kurang lebih 15 cm tepat di lajur kiri dekat halte. Sudah ada pengendara motor yang hampir terjatuh tadi malam karena tertutup genangan.',
                'lat' => -6.2088,
                'lng' => 106.8227,
                'address' => 'Jl. Jenderal Sudirman No. 28, Dukuh Atas, Jakarta Pusat',
                'city' => 'Jakarta Pusat',
                'priority' => 'CRITICAL',
                'status' => 'IN_PROGRESS',
                'v_status' => 'VERIFIED',
                'officer' => $officer1,
                'ai_sev' => 'critical',
                'ai_summary' => 'Jalan protokol memiliki lubang dalam yang sangat membahayakan keselamatan pengguna jalan roda dua.',
                'ai_rec' => 'Segera pasang cone pembatas dan lakukan penambalan hotmix darurat.',
                'images' => [
                    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
                ],
                'created_at' => now()->subHours(6),
            ],
            [
                'number' => 'WL-2026-000002',
                'user' => $warga2,
                'cat' => $catModels['lampu-jalan'],
                'title' => 'Tiga Lampu PJU Padam Sepanjang Jalur Pemukiman Duren Sawit',
                'desc' => 'Lampu penerangan jalan umum mati total sejak 3 hari lalu. Kondisi jalan sangat gelap dan rawan tindak kejahatan di malam hari.',
                'lat' => -6.2345,
                'lng' => 106.9123,
                'address' => 'Jl. Kolonel Sugiono No. 45, Duren Sawit, Jakarta Timur',
                'city' => 'Jakarta Timur',
                'priority' => 'MEDIUM',
                'status' => 'ASSIGNED',
                'v_status' => 'VERIFIED',
                'officer' => $officer3,
                'ai_sev' => 'medium',
                'ai_summary' => 'PJU padam pada jalur sekunder pemukiman mengurangi visibilitas dan faktor keamanan warga.',
                'ai_rec' => 'Periksa kabel sekring gardu kontrol dan ganti bohlam LED sodium 120W.',
                'images' => [
                    'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=60',
                ],
                'created_at' => now()->subHours(18),
            ],
            [
                'number' => 'WL-2026-000003',
                'user' => $warga3,
                'cat' => $catModels['sampah-kebersihan'],
                'title' => 'Tumpukan Sampah Liar Menumpuk di Bantaran Kali Ciliwung Manggarai',
                'desc' => 'Banyak sampah plastik dan limbah rumah tangga dibuang sembarangan di pinggir tanggul hingga menimbulkan bau menyengat.',
                'lat' => -6.2100,
                'lng' => 106.8500,
                'address' => 'Bantaran Kali Manggarai, Tebet, Jakarta Selatan',
                'city' => 'Jakarta Selatan',
                'priority' => 'HIGH',
                'status' => 'RESOLVED',
                'v_status' => 'VERIFIED',
                'officer' => $officer2,
                'ai_sev' => 'high',
                'ai_summary' => 'Penumpukan sampah liar di bantaran sungai berpotensi menyumbat aliran air saat hujan deras.',
                'ai_rec' => 'Kerahkan armada truk sampah kebersihan dan pasang plang larangan membuang sampah.',
                'images' => [
                    'https://images.unsplash.com/photo-1605600659908-0ef719419d41?w=800&auto=format&fit=crop&q=60',
                ],
                'proof_image' => 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=800&auto=format&fit=crop&q=60',
                'feedback' => ['rating' => 5, 'comment' => 'Gerak cepat sekali dinas kebersihan! Lokasi sekarang sudah bersih rapi dan wangi.'],
                'created_at' => now()->subDays(2),
                'resolved_at' => now()->subDays(1),
            ],
            [
                'number' => 'WL-2026-000004',
                'user' => $warga1,
                'cat' => $catModels['pohon-tumbang'],
                'title' => 'Dahan Pohon Beringin Besar Patah Melintang Menutup Separuh Jalan',
                'desc' => 'Akibat angin kencang tadi sore, dahan pohon besar patah dan tersangkut kabel PLN di dekat gerbang kompleks.',
                'lat' => -6.2612,
                'lng' => 106.7820,
                'address' => 'Jl. Panglima Polim Raya No. 12, Kebayoran Baru, Jakarta Selatan',
                'city' => 'Jakarta Selatan',
                'priority' => 'CRITICAL',
                'status' => 'RESOLVED',
                'v_status' => 'VERIFIED',
                'officer' => $officer1,
                'ai_sev' => 'critical',
                'ai_summary' => 'Dahan pohon patah tersangkut kabel listrik membahayakan pengguna jalan dan berpotensi konsleting.',
                'ai_rec' => 'Lakukan pemangkasan darurat menggunakan gergaji mesin dan koordinasi bersama petugas PLN.',
                'images' => [
                    'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=800&auto=format&fit=crop&q=60',
                ],
                'proof_image' => 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop&q=60',
                'feedback' => ['rating' => 5, 'comment' => 'Luar biasa responsif, kurang dari 2 jam petugas TRC langsung memotong dan menyingkirkan dahan.'],
                'created_at' => now()->subDays(3),
                'resolved_at' => now()->subDays(3)->addHours(2),
            ],
            [
                'number' => 'WL-2026-000005',
                'user' => $warga2,
                'cat' => $catModels['banjir-drainase'],
                'title' => 'Saluran Air Got Tersumbat Lumpur Tebal Menyebabkan Genangan 30cm',
                'desc' => 'Setiap hujan sebentar saja, air langsung meluap ke jalanan pemukiman karena gorong-gorong tersumbat sedimen pasir dan sampah.',
                'lat' => -6.1550,
                'lng' => 106.8850,
                'address' => 'Jl. Boulevard Barat No. 88, Kelapa Gading, Jakarta Utara',
                'city' => 'Jakarta Utara',
                'priority' => 'HIGH',
                'status' => 'IN_PROGRESS',
                'v_status' => 'VERIFIED',
                'officer' => $officer2,
                'ai_sev' => 'high',
                'ai_summary' => 'Sedimen endapan lumpur drainase memicu genangan air yang mengganggu sirkulasi warga.',
                'ai_rec' => 'Kerahkan pasukan oranye SDA untuk pengurasan lumpur gorong-gorong sepanjang 100 meter.',
                'images' => [
                    'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&auto=format&fit=crop&q=60',
                ],
                'created_at' => now()->subHours(10),
            ],
            [
                'number' => 'WL-2026-000006',
                'user' => $warga3,
                'cat' => $catModels['lalu-lintas'],
                'title' => 'Lampu Traffic Light Perempatan Rawamangun Error Berkedip Kuning Terus',
                'desc' => 'Lampu lalu lintas di persimpangan ramai error menyebabkan kemacetan parah dan rawan tabrakan dari empat arah.',
                'lat' => -6.1950,
                'lng' => 106.8820,
                'address' => 'Perempatan Jl. Pemuda & Jl. Pramuka, Rawamangun, Jakarta Timur',
                'city' => 'Jakarta Timur',
                'priority' => 'HIGH',
                'status' => 'SUBMITTED',
                'v_status' => 'PENDING',
                'ai_sev' => 'high',
                'ai_summary' => 'Traffic light error di persimpangan utama berisiko tinggi menyebabkan kecelakaan lalu lintas.',
                'ai_rec' => 'Reset controller lalu lintas dan atur petugas Dishub untuk memandu manual sementara.',
                'images' => [
                    'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800&auto=format&fit=crop&q=60',
                ],
                'created_at' => now()->subHours(2),
            ],
            [
                'number' => 'WL-2026-000007',
                'user' => $warga1,
                'cat' => $catModels['fasilitas-umum'],
                'title' => 'Pagar Pembatas JPO Tomang Rusak dan Berlubang Bahaya untuk Anak',
                'desc' => 'Salah satu panel besi pengaman di Jembatan Penyeberangan Orang terlepas dan bolong lebar.',
                'lat' => -6.1750,
                'lng' => 106.7950,
                'address' => 'JPO Tomang Raya, Grogol Petamburan, Jakarta Barat',
                'city' => 'Jakarta Barat',
                'priority' => 'HIGH',
                'status' => 'SUBMITTED',
                'v_status' => 'PENDING',
                'ai_sev' => 'high',
                'ai_summary' => 'Kerusakan fisik struktur pengaman JPO membahayakan keselamatan pejalan kaki.',
                'ai_rec' => 'Lakukan pengelasan plat besi baru dan pasang warning tape darurat.',
                'images' => [
                    'https://images.unsplash.com/photo-1590402494682-cd3fb53b1f70?w=800&auto=format&fit=crop&q=60',
                ],
                'created_at' => now()->subMinutes(45),
            ],
            [
                'number' => 'WL-2026-000008',
                'user' => $warga2,
                'cat' => $catModels['air-bersih'],
                'title' => 'Pipa Distribusi Air Bocor Mengalirkan Air Bersih ke Badan Jalan',
                'desc' => 'Sudah 2 hari air mengalir deras dari celah aspal dan menggenang sampai ke pertigaan.',
                'lat' => -6.2250,
                'lng' => 106.8050,
                'address' => 'Jl. Senopati No. 102, Kebayoran Baru, Jakarta Selatan',
                'city' => 'Jakarta Selatan',
                'priority' => 'MEDIUM',
                'status' => 'VERIFIED',
                'v_status' => 'VERIFIED',
                'ai_sev' => 'medium',
                'ai_summary' => 'Kebocoran pipa air PDAM memboroskan air bersih dan dapat mengikis struktur pondasi aspal.',
                'ai_rec' => 'Tutup valve jalur setempat lalu gali dan ganti segel sambungan pipa yang pecah.',
                'images' => [
                    'https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&auto=format&fit=crop&q=60',
                ],
                'created_at' => now()->subHours(14),
            ],
            [
                'number' => 'WL-2026-000009',
                'user' => $warga3,
                'cat' => $catModels['jalan-rusak'],
                'title' => 'Tutup Manhole Saluran Jalan Hilang Tanpa Pengaman',
                'desc' => 'Tutup got bulat dari besi cor hilang dicuri, lubang menganga di tengah trotoar pejalan kaki.',
                'lat' => -6.1850,
                'lng' => 106.8320,
                'address' => 'Jl. Wahid Hasyim No. 55, Menteng, Jakarta Pusat',
                'city' => 'Jakarta Pusat',
                'priority' => 'CRITICAL',
                'status' => 'ASSIGNED',
                'v_status' => 'VERIFIED',
                'officer' => $officer1,
                'ai_sev' => 'critical',
                'ai_summary' => 'Manhole terbuka tanpa penutup di trotoar aktif sangat berisiko menjatuhkan pejalan kaki.',
                'ai_rec' => 'Pasang cover komposit grating baru yang terkunci rapat.',
                'images' => [
                    'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
                ],
                'created_at' => now()->subHours(8),
            ],
            [
                'number' => 'WL-2026-000010',
                'user' => $warga1,
                'cat' => $catModels['fasilitas-sekolah'],
                'title' => 'Trotoar Depan SDN 01 Rusak Parah Membahayakan Anak Sekolah',
                'desc' => 'Paving block trotoar depan sekolah banyak yang terlepas dan tajam, anak-anak sering tersandung saat jam masuk sekolah.',
                'lat' => -6.2480,
                'lng' => 106.8400,
                'address' => 'Jl. Tebet Barat Dalam Raya No. 15, Tebet, Jakarta Selatan',
                'city' => 'Jakarta Selatan',
                'priority' => 'MEDIUM',
                'status' => 'RESOLVED',
                'v_status' => 'VERIFIED',
                'officer' => $officer1,
                'ai_sev' => 'medium',
                'ai_summary' => 'Trotoar rusak di zona selamat sekolah membahayakan kenyamanan murid dan orang tua.',
                'ai_rec' => 'Perbaiki dan pasang ulang paving block interlocking sepanjang 50 meter.',
                'images' => [
                    'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=800&auto=format&fit=crop&q=60',
                ],
                'proof_image' => 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?w=800&auto=format&fit=crop&q=60',
                'feedback' => ['rating' => 5, 'comment' => 'Sekarang trotoar depan sekolah sudah rapi dan aman dilewati anak-anak. Mantap WargaLapor!'],
                'created_at' => now()->subDays(4),
                'resolved_at' => now()->subDays(2),
            ],
        ];

        foreach ($sampleReports as $repData) {
            $report = Report::create([
                'report_number' => $repData['number'],
                'user_id' => $repData['user']->id,
                'category_id' => $repData['cat']->id,
                'title' => $repData['title'],
                'description' => $repData['desc'],
                'latitude' => $repData['lat'],
                'longitude' => $repData['lng'],
                'address' => $repData['address'],
                'province' => 'DKI Jakarta',
                'city' => $repData['city'],
                'priority' => $repData['priority'],
                'status' => $repData['status'],
                'verification_status' => $repData['v_status'],
                'sla_deadline' => $repData['created_at']->copy()->addHours(24),
                'resolved_at' => $repData['resolved_at'] ?? null,
                'created_at' => $repData['created_at'],
                'updated_at' => $repData['resolved_at'] ?? $repData['created_at'],
            ]);

            // Images
            foreach ($repData['images'] as $imgUrl) {
                ReportImage::create([
                    'report_id' => $report->id,
                    'image_path' => $imgUrl,
                    'image_type' => 'REPORT',
                    'caption' => 'Foto Lampiran Laporan',
                    'uploaded_by' => $repData['user']->id,
                ]);
            }

            // Resolution Proof
            if (!empty($repData['proof_image']) && !empty($repData['officer'])) {
                ReportImage::create([
                    'report_id' => $report->id,
                    'image_path' => $repData['proof_image'],
                    'image_type' => 'RESOLUTION',
                    'caption' => 'Bukti Penanganan Selesai oleh ' . $repData['officer']->user->name,
                    'uploaded_by' => $repData['officer']->user_id,
                ]);
            }

            // AI Analysis
            AiAnalysis::create([
                'report_id' => $report->id,
                'category_suggested' => $repData['cat']->name,
                'severity' => $repData['ai_sev'],
                'priority' => strtolower($repData['priority']),
                'confidence' => 0.94,
                'hazard_level' => $repData['ai_sev'],
                'summary' => $repData['ai_summary'],
                'recommendation' => $repData['ai_rec'],
                'raw_response' => ['source' => 'gemini_seeder_model'],
                'is_fallback' => false,
            ]);

            // Histories
            ReportStatusHistory::create([
                'report_id' => $report->id,
                'status' => 'SUBMITTED',
                'actor_id' => $repData['user']->id,
                'actor_name' => $repData['user']->name,
                'actor_role' => 'citizen',
                'notes' => 'Laporan dibuat oleh warga melalui sistem WargaLapor.',
                'created_at' => $repData['created_at'],
            ]);

            if (in_array($repData['status'], ['VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])) {
                ReportStatusHistory::create([
                    'report_id' => $report->id,
                    'status' => 'VERIFIED',
                    'actor_id' => $admin->id,
                    'actor_name' => $admin->name,
                    'actor_role' => 'admin',
                    'notes' => 'Laporan diverifikasi oleh Administrator.',
                    'created_at' => $repData['created_at']->copy()->addMinutes(30),
                ]);
            }

            if (!empty($repData['officer']) && in_array($repData['status'], ['ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'])) {
                ReportAssignment::create([
                    'report_id' => $report->id,
                    'officer_id' => $repData['officer']->id,
                    'assigned_by' => $admin->id,
                    'notes' => 'Harap ditangani sesuai SOP dan dokumentasikan foto selesai.',
                    'status' => $repData['status'] === 'RESOLVED' ? 'COMPLETED' : 'ASSIGNED',
                    'assigned_at' => $repData['created_at']->copy()->addMinutes(45),
                    'completed_at' => $repData['resolved_at'] ?? null,
                ]);

                ReportStatusHistory::create([
                    'report_id' => $report->id,
                    'status' => 'ASSIGNED',
                    'actor_id' => $admin->id,
                    'actor_name' => $admin->name,
                    'actor_role' => 'admin',
                    'notes' => 'Ditugaskan kepada ' . $repData['officer']->user->name . ' (' . $repData['officer']->department . ')',
                    'created_at' => $repData['created_at']->copy()->addMinutes(45),
                ]);
            }

            if (in_array($repData['status'], ['IN_PROGRESS', 'RESOLVED', 'CLOSED']) && !empty($repData['officer'])) {
                ReportStatusHistory::create([
                    'report_id' => $report->id,
                    'status' => 'IN_PROGRESS',
                    'actor_id' => $repData['officer']->user_id,
                    'actor_name' => $repData['officer']->user->name,
                    'actor_role' => 'officer',
                    'notes' => 'Petugas telah tiba di lokasi dan sedang melakukan penanganan.',
                    'created_at' => $repData['created_at']->copy()->addHours(2),
                ]);
            }

            if (in_array($repData['status'], ['RESOLVED', 'CLOSED']) && !empty($repData['officer'])) {
                ReportStatusHistory::create([
                    'report_id' => $report->id,
                    'status' => 'RESOLVED',
                    'actor_id' => $repData['officer']->user_id,
                    'actor_name' => $repData['officer']->user->name,
                    'actor_role' => 'officer',
                    'notes' => 'Pengerjaan selesai dilaksanakan. Area sudah bersih dan aman.',
                    'created_at' => $repData['resolved_at'] ?? now(),
                ]);
            }

            // Feedback
            if (!empty($repData['feedback'])) {
                ReportFeedback::create([
                    'report_id' => $report->id,
                    'user_id' => $repData['user']->id,
                    'rating' => $repData['feedback']['rating'],
                    'comments' => $repData['feedback']['comment'],
                    'created_at' => $repData['resolved_at']->copy()->addHours(1),
                ]);
            }
        }

        // Add 12 more quick reports to enrich stats
        $additionalLocations = [
            // --- KLASTER 1: DUKUH ATAS & SUDIRMAN (Jakarta Pusat - Kepadatan Kritis) ---
            ['title' => 'Coretan Vandalisme di Halte Busway Tosari', 'cat' => $catModels['fasilitas-umum'], 'lat' => -6.1970, 'lng' => 106.8230, 'p' => 'LOW', 'st' => 'RESOLVED', 'addr' => 'Halte Tosari ICBC, Menteng', 'dist' => 'Tanah Abang'],
            ['title' => 'Genangan Air Deras Underpass Dukuh Atas Saat Hujan', 'cat' => $catModels['banjir-drainase'], 'lat' => -6.2095, 'lng' => 106.8215, 'p' => 'CRITICAL', 'st' => 'IN_PROGRESS', 'addr' => 'Underpass Dukuh Atas, Jl. Galunggung', 'dist' => 'Setiabudi'],
            ['title' => 'Pembatas Jalur Sepeda Sudirman Lepas Membahayakan', 'cat' => $catModels['lalu-lintas'], 'lat' => -6.2045, 'lng' => 106.8232, 'p' => 'HIGH', 'st' => 'VERIFIED', 'addr' => 'Jl. Jend. Sudirman KM 2.5', 'dist' => 'Tanah Abang'],
            ['title' => 'Tutup Saluran Air Trotoar Stasiun MRT Dukuh Atas Hilang', 'cat' => $catModels['jalan-rusak'], 'lat' => -6.2078, 'lng' => 106.8235, 'p' => 'CRITICAL', 'st' => 'ASSIGNED', 'addr' => 'Pintu B MRT Dukuh Atas BNI', 'dist' => 'Tanah Abang'],
            ['title' => 'Kabel Fiber Optik Menjuntai Rendah di JPO Sudirman', 'cat' => $catModels['fasilitas-umum'], 'lat' => -6.2020, 'lng' => 106.8238, 'p' => 'HIGH', 'st' => 'IN_PROGRESS', 'addr' => 'JPO Karet Sudirman', 'dist' => 'Tanah Abang'],
            ['title' => 'Lampu Sorot Penyeberangan Orang Padam', 'cat' => $catModels['lampu-jalan'], 'lat' => -6.2060, 'lng' => 106.8222, 'p' => 'MEDIUM', 'st' => 'ASSIGNED', 'addr' => 'Jl. Kendal No. 12, Menteng', 'dist' => 'Menteng'],

            // --- KLASTER 2: SENEN & KRAMAT RAYA (Jakarta Pusat - Kepadatan Tinggi) ---
            ['title' => 'Aspal Amblas Dekat Rel Kereta Api Senen', 'cat' => $catModels['jalan-rusak'], 'lat' => -6.1780, 'lng' => 106.8450, 'p' => 'HIGH', 'st' => 'ASSIGNED', 'addr' => 'Perlintasan Rel Senen, Kramat Bunder', 'dist' => 'Senen'],
            ['title' => 'Tumpukan Sampah Pasar Senen Meluber ke Bahu Jalan', 'cat' => $catModels['sampah-kebersihan'], 'lat' => -6.1768, 'lng' => 106.8465, 'p' => 'HIGH', 'st' => 'IN_PROGRESS', 'addr' => 'Jl. Stasiun Senen No. 4', 'dist' => 'Senen'],
            ['title' => 'Lampu PJU Underpass Senen Mati Total Gelap Gulita', 'cat' => $catModels['lampu-jalan'], 'lat' => -6.1792, 'lng' => 106.8438, 'p' => 'CRITICAL', 'st' => 'ASSIGNED', 'addr' => 'Underpass Simpang Lima Senen', 'dist' => 'Senen'],
            ['title' => 'Saluran Air Depan Pasar Inpres Senen Meluap ke Trotoar', 'cat' => $catModels['banjir-drainase'], 'lat' => -6.1760, 'lng' => 106.8455, 'p' => 'HIGH', 'st' => 'SUBMITTED', 'addr' => 'Jl. Kramat Raya Blok 3', 'dist' => 'Senen'],
            ['title' => 'Trotoar Keramik Hancur Amblas Sepanjang 10 Meter', 'cat' => $catModels['jalan-rusak'], 'lat' => -6.1802, 'lng' => 106.8442, 'p' => 'MEDIUM', 'st' => 'VERIFIED', 'addr' => 'Jl. Kramat Raya Depan Kampus BSI', 'dist' => 'Senen'],

            // --- KLASTER 3: TOMANG & GROGOL (Jakarta Barat - Kepadatan Tinggi) ---
            ['title' => 'Pagar Pembatas JPO Tomang Rusak dan Berlubang Bahaya untuk Anak', 'cat' => $catModels['fasilitas-umum'], 'lat' => -6.1750, 'lng' => 106.7950, 'p' => 'HIGH', 'st' => 'SUBMITTED', 'addr' => 'JPO Tomang Raya', 'dist' => 'Grogol Petamburan'],
            ['title' => 'Saluran Air Mampet Samping Flyover Tomang Bikin Banjir', 'cat' => $catModels['banjir-drainase'], 'lat' => -6.1738, 'lng' => 106.7962, 'p' => 'HIGH', 'st' => 'IN_PROGRESS', 'addr' => 'Jl. Tomang Raya No. 40', 'dist' => 'Grogol Petamburan'],
            ['title' => 'Dahan Pohon Rindang Menutupi Rambu Flyover Grogol', 'cat' => $catModels['pohon-tumbang'], 'lat' => -6.1745, 'lng' => 106.7932, 'p' => 'HIGH', 'st' => 'RESOLVED', 'addr' => 'Simpang Kyai Tapa, Grogol', 'dist' => 'Grogol Petamburan'],
            ['title' => 'Lubang Dalam Jalur Kanan Arah Roxy Membahayakan Motor', 'cat' => $catModels['jalan-rusak'], 'lat' => -6.1762, 'lng' => 106.7928, 'p' => 'CRITICAL', 'st' => 'ASSIGNED', 'addr' => 'Jl. Kyai Tapa No. 101', 'dist' => 'Grogol Petamburan'],

            // --- KLASTER 4: RAWAMANGUN & PRAMUKA (Jakarta Timur - Kepadatan Sedang) ---
            ['title' => 'Lampu Lalu Lintas Simpang Pemuda Berkedip Kuning Terus', 'cat' => $catModels['lalu-lintas'], 'lat' => -6.1950, 'lng' => 106.8820, 'p' => 'HIGH', 'st' => 'SUBMITTED', 'addr' => 'Perempatan Jl. Pemuda & Pramuka', 'dist' => 'Pulogadung'],
            ['title' => 'Jalan Berlubang di Depan Jakarta International Velodrome', 'cat' => $catModels['jalan-rusak'], 'lat' => -6.1965, 'lng' => 106.8835, 'p' => 'MEDIUM', 'st' => 'VERIFIED', 'addr' => 'Jl. Balap Sepeda No. 8', 'dist' => 'Pulogadung'],
            ['title' => 'Sampah Sisa Kuliner Berserakan di Trotoar Rawamangun', 'cat' => $catModels['sampah-kebersihan'], 'lat' => -6.1938, 'lng' => 106.8812, 'p' => 'MEDIUM', 'st' => 'RESOLVED', 'addr' => 'Jl. Paus No. 22', 'dist' => 'Pulogadung'],
            ['title' => 'Tutup Selokan Beton Pecah di Depan Puskesmas', 'cat' => $catModels['jalan-rusak'], 'lat' => -6.2150, 'lng' => 106.8600, 'p' => 'HIGH', 'st' => 'ASSIGNED', 'addr' => 'Jl. Matraman Raya No. 90', 'dist' => 'Matraman'],

            // --- KLASTER 5: MANGGARAI & TEBET (Jakarta Selatan - Kepadatan Sedang) ---
            ['title' => 'Saluran Air Limbah Meluber ke Halaman Warga', 'cat' => $catModels['banjir-drainase'], 'lat' => -6.2115, 'lng' => 106.8510, 'p' => 'HIGH', 'st' => 'IN_PROGRESS', 'addr' => 'Jl. Bukit Duri Selatan No. 14', 'dist' => 'Tebet'],
            ['title' => 'Pohon Akasia Kering Condong ke Kabel Telepon', 'cat' => $catModels['pohon-tumbang'], 'lat' => -6.2128, 'lng' => 106.8525, 'p' => 'HIGH', 'st' => 'RESOLVED', 'addr' => 'Jl. Tebet Raya No. 45', 'dist' => 'Tebet'],
            ['title' => 'Pipa Induk PDAM Pecah Semburan Air 1 Meter', 'cat' => $catModels['air-bersih'], 'lat' => -6.2095, 'lng' => 106.8488, 'p' => 'CRITICAL', 'st' => 'RESOLVED', 'addr' => 'Jl. Tambak Samping Stasiun', 'dist' => 'Setiabudi'],

            // --- TITIK PINGGIRAN KOTA / TERISOLASI (Zona Biru / Sejuk) ---
            ['title' => 'Rambu Dilarang Putar Balik Miring Tertabrak Truk', 'cat' => $catModels['lalu-lintas'], 'lat' => -6.2210, 'lng' => 106.8410, 'p' => 'MEDIUM', 'st' => 'RESOLVED', 'addr' => 'Jl. Dr. Saharjo No. 12', 'dist' => 'Tebet'],
            ['title' => 'Sampah Sisa Pasar Malam Berserakan di Lapangan', 'cat' => $catModels['sampah-kebersihan'], 'lat' => -6.2750, 'lng' => 106.8120, 'p' => 'MEDIUM', 'st' => 'IN_PROGRESS', 'addr' => 'Jl. Margasatwa Raya', 'dist' => 'Pasar Minggu'],
            ['title' => 'Lampu Penyeberangan Zebra Cross Rusak', 'cat' => $catModels['lampu-jalan'], 'lat' => -6.1890, 'lng' => 106.8150, 'p' => 'MEDIUM', 'st' => 'VERIFIED', 'addr' => 'Jl. Kebon Sirih No. 67', 'dist' => 'Menteng'],
            ['title' => 'Kran Fasilitas Cuci Tangan Taman Kota Patah', 'cat' => $catModels['fasilitas-umum'], 'lat' => -6.1920, 'lng' => 106.8390, 'p' => 'LOW', 'st' => 'RESOLVED', 'addr' => 'Taman Suropati', 'dist' => 'Menteng'],
            ['title' => 'Pintu Gerbang SMPN 19 Rusak Engselnya', 'cat' => $catModels['fasilitas-sekolah'], 'lat' => -6.2410, 'lng' => 106.7950, 'p' => 'LOW', 'st' => 'RESOLVED', 'addr' => 'Jl. Bumi No. 20', 'dist' => 'Kebayoran Baru'],
            ['title' => 'Lampu Taman Interaktif Monas Mati Sebagian', 'cat' => $catModels['lampu-jalan'], 'lat' => -6.1754, 'lng' => 106.8272, 'p' => 'LOW', 'st' => 'RESOLVED', 'addr' => 'Komplek Monas Silang Barat', 'dist' => 'Gambir'],
        ];

        foreach ($additionalLocations as $idx => $loc) {
            $repNum = sprintf('WL-2026-%06d', 11 + $idx);
            $report = Report::create([
                'report_number' => $repNum,
                'user_id' => $warga1->id,
                'category_id' => $loc['cat']->id,
                'title' => $loc['title'],
                'description' => 'Laporan fasilitas lingkungan warga mengenai ' . $loc['title'] . '. Memerlukan perhatian dari dinas dan petugas wilayah terkait.',
                'latitude' => $loc['lat'],
                'longitude' => $loc['lng'],
                'address' => $loc['addr'] ?? ('Jl. Wilayah DKI Jakarta, Titik ' . ($idx + 1)),
                'district' => $loc['dist'] ?? 'DKI Jakarta',
                'city' => 'Kota Administrasi Jakarta',
                'priority' => $loc['p'],
                'status' => $loc['st'],
                'verification_status' => $loc['st'] === 'SUBMITTED' ? 'PENDING' : 'VERIFIED',
                'sla_deadline' => now()->addHours(24),
                'resolved_at' => $loc['st'] === 'RESOLVED' ? now()->subHours(12) : null,
                'created_at' => now()->subDays(rand(1, 8)),
            ]);

            ReportImage::create([
                'report_id' => $report->id,
                'image_path' => 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=800&auto=format&fit=crop&q=60',
                'image_type' => 'REPORT',
                'caption' => 'Foto Lampiran',
                'uploaded_by' => $warga1->id,
            ]);

            AiAnalysis::create([
                'report_id' => $report->id,
                'category_suggested' => $loc['cat']->name,
                'severity' => strtolower($loc['p']),
                'priority' => strtolower($loc['p']),
                'confidence' => 0.91,
                'hazard_level' => strtolower($loc['p']),
                'summary' => 'Teridentifikasi masalah pada ' . $loc['cat']->name . ' dengan prioritas ' . $loc['p'],
                'recommendation' => 'Tindak lanjuti dengan inspeksi lapangan rutin.',
                'is_fallback' => false,
            ]);

            ReportStatusHistory::create([
                'report_id' => $report->id,
                'status' => 'SUBMITTED',
                'actor_id' => $warga1->id,
                'actor_name' => $warga1->name,
                'actor_role' => 'citizen',
                'notes' => 'Laporan dikirimkan oleh warga.',
                'created_at' => $report->created_at,
            ]);
        }

        // 7. Initial Notifications for users
        Notification::create([
            'user_id' => $admin->id,
            'title' => 'Selamat Datang di WargaLapor',
            'message' => 'Sistem pemantauan aduan kota pintar telah aktif dan siap memproses laporan warga.',
            'type' => 'SYSTEM',
            'link' => '/admin',
        ]);

        Notification::create([
            'user_id' => $petugas1User->id,
            'title' => 'Tugas Baru: WL-2026-000001',
            'message' => 'Laporan lubang besar di Dukuh Atas membutuhkan penanganan segera (Prioritas: Kritis).',
            'type' => 'TASK_ASSIGNED',
            'link' => '/officer/tasks/1',
        ]);

        Notification::create([
            'user_id' => $warga1->id,
            'title' => 'Laporan WL-2026-000001 Sedang Diproses',
            'message' => 'Petugas TRC Hendra Wijaya telah tiba di lokasi dan sedang melakukan penambalan jalan.',
            'type' => 'REPORT_IN_PROGRESS',
            'link' => '/citizen/reports/1',
        ]);
    }
}
