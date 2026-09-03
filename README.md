# 🏛️ WargaLapor — Smart Citizen Reporting Platform

> **“Laporkan Masalah. Pantau Prosesnya. Bangun Lingkungan Lebih Baik.”**

WargaLapor adalah platform **Civic Technology & Smart Citizen Reporting** modern yang menghubungkan partisipasi aktif warga dengan jajaran dinas teknis pemerintah kota. Dilengkapi dengan **Google Gemini AI** untuk analisis otomatis tingkat keparahan, pendeteksi laporan duplikat berbasis algoritma geospasial Haversine & NLP similarity, pelacakan SLA real-time, peta interaktif OpenStreetMap/Leaflet, dan sistem verifikasi foto bukti hasil perbaikan lapangan.

---

## 🌟 Fitur Utama

### 👤 1. Portal Warga (Citizen Portal)
- **5-Step Report Wizard**:
  1. **Upload Foto**: Drag-and-drop & kamera langsung dengan kompresi base64.
  2. **Pilih Kategori**: 10 kategori masalah terstruktur (Jalan Rusak, Sampah, Lampu PJU, Banjir, Pohon Tumbang, PDAM, dsb).
  3. **Judul & Deskripsi**: Penjelasan detail kondisi dan dampak.
  4. **Lokasi GPS & Peta**: Deteksi otomatis via Geolocation API + reverse geocoding nama jalan, serta fitur geser pin manual.
  5. **Review & Analisis AI**: Evaluasi instan Google Gemini AI (skor keparahan, estimasi prioritas, rekomendasi tindakan).
- **Pencegahan Laporan Ganda (Duplicate Alert)**: Deteksi otomatis laporan serupa dalam radius 600m dengan opsi *Merge / Gabung Aduan*.
- **Live Status Tracking**: Timeline pelacakan transparan (`SUBMITTED` $\to$ `VERIFIED` $\to$ `ASSIGNED` $\to$ `IN_PROGRESS` $\to$ `RESOLVED` $\to$ `CLOSED`).
- **Rating Kepuasan (1–5 Bintang)**: Feedback dan ulasan warga setelah perbaikan selesai.

### 👷 2. Portal Petugas Lapangan (Officer Portal)
- **Task Management**: Daftar penugasan aktif dengan indikator prioritas dan batas SLA.
- **Peta Rute Lapangan**: Integrasi rute navigasi menuju koordinat titik masalah.
- **Update Progres & Wajib Bukti Selesai**: Form pengubahan status lapangan (`IN_PROGRESS`, `WAITING`, `RESOLVED`) yang mewajibkan unggah foto bukti pengerjaan sebelum tiket dapat diselesaikan.
- **Riwayat Penanganan**: Arsip seluruh tugas yang berhasil ditangani oleh unit terkait.

### 👑 3. Portal Administrator (Admin Portal)
- **Executive Dashboard**: Statistik KPI harian, rasio keberhasilan penanganan, waktu respon rata-rata, dan peringatan laporan kritis.
- **Antrean Verifikasi**: Validasi keabsahan laporan warga, penyesuaian prioritas, atau penolakan dengan alasan terstruktur.
- **Penugasan Cerdas (Workload Assignment)**: Penunjukan petugas berdasarkan dinas terkait dan beban kerja (*active tasks count*).
- **Peta Spasial & Heatmap Kepadatan**: Visualisasi konsentrasi titik masalah untuk perencanaan intervensi infrastruktur.
- **Analytics & SLA Performance**: Grafik interaktif volume laporan harian, proporsi kategori masalah, dan evaluasi kepatuhan SLA.
- **Audit Trail Log**: Pencatatan aktivitas sistem permanen dan tidak dapat diubah (*immutable log*).
- **Master Data & Konfigurasi**: Manajemen kategori, batas waktu SLA per prioritas, data personil, dan pengaturan operasional.

---

## 🛠️ Arsitektur & Teknologi

| Layer | Teknologi |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React, Recharts |
| **Peta & GIS** | Leaflet, React-Leaflet, Leaflet.heat, OpenStreetMap Tiles |
| **Backend** | Laravel 11 REST API, PHP 8.5, Laravel Sanctum, Custom Services |
| **Database** | SQLite (Default plug-and-play) / MySQL Support |
| **AI Engine** | Google Gemini 1.5 Flash API + Indonesian Heuristic Fallback Engine |
| **Arsitektur Keamanan** | Sanctum Token Auth, Role-Based Access Control (RBAC), Form Validation, Audit Trail |

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### Persyaratan Sistem
- PHP >= 8.2 (dengan ekstensi `pdo_sqlite`, `pdo_mysql`, `curl`, `mbstring`, `zip`)
- Node.js >= 18.x & npm
- Composer

### Langkah 1: Clone Repositori
```bash
git clone https://github.com/username/wargalapor.git
cd wargalapor
```

### Langkah 2: Konfigurasi Environment Backend
```bash
cd backend
cp .env.example .env
```
*(Opsional) Masukkan API Key Google Gemini Anda di `.env`:*
```env
GEMINI_API_KEY=your_gemini_api_key_here
```
> *Catatan: Jika `GEMINI_API_KEY` tidak diisi, WargaLapor secara otomatis beralih ke Mesin Analisis Heuristik Bahasa Indonesia bawaan.*

### Langkah 3: Setup Database & Seed Data
```bash
# Migrasi seluruh 19 tabel dan buat 22+ sampel laporan realistis
./art migrate:fresh --seed
./art storage:link
```

### Langkah 4: Jalankan Server Sekaligus
Dari direktori root proyek, jalankan script runner:
```bash
chmod +x start.sh
./start.sh
```

Atau jalankan secara manual di 2 terminal terpisah:

**Terminal 1 (Backend API):**
```bash
cd backend
php -c php.ini -S 127.0.0.1:8000 -t public
```

**Terminal 2 (Frontend React):**
```bash
cd frontend
npm install
npm run dev
```

Buka browser Anda di **`http://localhost:5173`**.

---

## 🔑 Kredensial Akun Demo (1-Click Login Ready)

Pada halaman login (`/login`), tersedia tombol **1-Click Login** untuk setiap role:

| Role | Email | Password | Deskripsi |
|---|---|---|---|
| 👑 **Admin** | `admin@wargalapor.test` | `password` | Administrator Utama Kota |
| 👷 **Petugas TRC** | `petugas@wargalapor.test` | `password` | Tim Reaksi Cepat Dinas Bina Marga |
| 👷 **Petugas DLH** | `petugas2@wargalapor.test` | `password` | Satuan Tugas Dinas Lingkungan Hidup |
| 👤 **Warga** | `warga@wargalapor.test` | `password` | Akun Warga Masyarakat Pelapor |

---

## 🧪 Menjalankan Automated Test Suite

Untuk memverifikasi seluruh lifecycle API secara otomatis:
```bash
cd backend
php -c php.ini vendor/bin/phpunit
```
**Hasil pengujian:** `100% Passed (7 tests, 43 assertions)`.

---

## 📄 Ringkasan Endpoint REST API

| Method | Endpoint | Deskripsi | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Pendaftaran akun warga | Public |
| `POST` | `/api/auth/login` | Login akun & perolehan token Sanctum | Public |
| `GET` | `/api/categories` | Daftar master kategori masalah | Public |
| `GET` | `/api/reports` | Daftar laporan publik / personal | Public / Sanctum |
| `GET` | `/api/reports/{id}` | Detail laporan lengkap & riwayat status | Public / Sanctum |
| `POST` | `/api/reports/analyze-ai` | Analisis Gemini AI pada formulir wizard | Public / Sanctum |
| `POST` | `/api/reports/check-duplicates` | Pemeriksaan laporan ganda geospasial | Public / Sanctum |
| `POST` | `/api/reports` | Pembuatan laporan baru (Foto + GPS) | Sanctum (Citizen) |
| `POST` | `/api/reports/{id}/feedback` | Pemberian rating bintang 1–5 & ulasan | Sanctum (Citizen) |
| `GET` | `/api/officer/tasks` | Daftar tugas penugasan lapangan | Sanctum (Officer) |
| `POST` | `/api/officer/tasks/{id}/status` | Update status tugas & upload foto bukti | Sanctum (Officer) |
| `POST` | `/api/admin/reports/{id}/verify` | Verifikasi laporan masuk | Sanctum (Admin) |
| `POST` | `/api/admin/reports/{id}/assign` | Penugasan petugas lapangan | Sanctum (Admin) |
| `GET` | `/api/admin/analytics` | Metrik statistik & visualisasi performa | Sanctum (Admin) |
| `GET` | `/api/map/heatmap` | Titik koordinat intensitas masalah | Public / Sanctum |

---

## 📜 Lisensi & Kontribusi

Dikembangkan untuk inisiatif Civic Technology dan Tata Kelola Kota Cerdas Indonesia. Lisensi di bawah **MIT License**.
