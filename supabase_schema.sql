-- ==============================================================================
-- WARGALAPOR — DATABASE SCHEMA & SEED DATA UNTUK SUPABASE POSTGRESQL
-- Jalankan script ini di menu "SQL Editor" pada Dashboard Supabase Anda.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. REPORT CATEGORIES
CREATE TABLE IF NOT EXISTS report_categories (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    icon VARCHAR(100) DEFAULT 'AlertTriangle',
    color VARCHAR(50) DEFAULT '#DC2626',
    default_priority VARCHAR(20) DEFAULT 'MEDIUM',
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USERS / PROFILES
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    nik VARCHAR(30),
    role VARCHAR(30) DEFAULT 'citizen', -- 'admin', 'officer', 'citizen'
    avatar TEXT,
    status VARCHAR(30) DEFAULT 'active',
    password TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SLA SETTINGS
CREATE TABLE IF NOT EXISTS sla_settings (
    id BIGSERIAL PRIMARY KEY,
    priority VARCHAR(20) NOT NULL UNIQUE, -- 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
    response_time_hours INT NOT NULL,
    resolution_time_hours INT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. OFFICERS
CREATE TABLE IF NOT EXISTS officers (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    department VARCHAR(255) NOT NULL,
    unit VARCHAR(255),
    area_coverage VARCHAR(255),
    active_tasks_count INT DEFAULT 0,
    completed_tasks_count INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'available',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. REPORTS
CREATE TABLE IF NOT EXISTS reports (
    id BIGSERIAL PRIMARY KEY,
    report_number VARCHAR(50) NOT NULL UNIQUE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    category_id BIGINT REFERENCES report_categories(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    address TEXT NOT NULL,
    province VARCHAR(100),
    city VARCHAR(100),
    district VARCHAR(100),
    subdistrict VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
    status VARCHAR(30) DEFAULT 'SUBMITTED', -- 'SUBMITTED', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'
    verification_status VARCHAR(30) DEFAULT 'PENDING',
    rejection_reason TEXT,
    sla_deadline TIMESTAMPTZ,
    is_overdue BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_priority ON reports(priority);
CREATE INDEX IF NOT EXISTS idx_reports_coords ON reports(latitude, longitude);

-- 7. REPORT IMAGES
CREATE TABLE IF NOT EXISTS report_images (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT REFERENCES reports(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    type VARCHAR(30) DEFAULT 'PROBLEM', -- 'PROBLEM', 'PROGRESS', 'RESOLUTION'
    caption TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. REPORT STATUS HISTORIES
CREATE TABLE IF NOT EXISTS report_status_histories (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT REFERENCES reports(id) ON DELETE CASCADE,
    previous_status VARCHAR(30),
    new_status VARCHAR(30) NOT NULL,
    changed_by_user_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. AI ANALYSES
CREATE TABLE IF NOT EXISTS ai_analyses (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT REFERENCES reports(id) ON DELETE CASCADE,
    severity_score INT DEFAULT 5,
    priority_recommendation VARCHAR(20) DEFAULT 'MEDIUM',
    detected_category VARCHAR(100),
    action_recommendations TEXT,
    confidence_score NUMERIC(5, 2) DEFAULT 0.85,
    raw_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. REPORT FEEDBACK
CREATE TABLE IF NOT EXISTS report_feedback (
    id BIGSERIAL PRIMARY KEY,
    report_id BIGINT REFERENCES reports(id) ON DELETE CASCADE,
    user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ENABLE ROW LEVEL SECURITY (RLS) & IZINKAN AKSES PUBLIK / ANON
ALTER TABLE report_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sla_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_status_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_feedback ENABLE ROW LEVEL SECURITY;

-- Kebijakan akses (Bisa dibaca & ditulis oleh anon/authenticated)
CREATE POLICY "Public read categories" ON report_categories FOR SELECT USING (true);
CREATE POLICY "Public read reports" ON reports FOR SELECT USING (true);
CREATE POLICY "Public insert reports" ON reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update reports" ON reports FOR UPDATE USING (true);
CREATE POLICY "Public read images" ON report_images FOR SELECT USING (true);
CREATE POLICY "Public insert images" ON report_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read status histories" ON report_status_histories FOR SELECT USING (true);
CREATE POLICY "Public insert status histories" ON report_status_histories FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read officers" ON officers FOR SELECT USING (true);
CREATE POLICY "Public read users" ON users FOR SELECT USING (true);
CREATE POLICY "Public insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read feedback" ON report_feedback FOR SELECT USING (true);
CREATE POLICY "Public insert feedback" ON report_feedback FOR INSERT WITH CHECK (true);

-- 12. DATA AWAL (SEED DATA)
INSERT INTO report_categories (name, slug, icon, color, default_priority, description) VALUES
('Jalan Rusak & Berlubang', 'jalan-rusak', 'AlertTriangle', '#DC2626', 'HIGH', 'Jalan berlubang, aspal amblas, trotoar hancur'),
('Sampah & Kebersihan', 'sampah-kebersihan', 'Trash2', '#10B981', 'MEDIUM', 'Tumpukan sampah liar, TPS overload, sungai kotor'),
('Lampu Jalan & PJU Mati', 'lampu-jalan', 'Lightbulb', '#F59E0B', 'MEDIUM', 'PJU padam, tiang miring, kabel lampu putus'),
('Banjir & Drainase Mampet', 'banjir-drainase', 'Droplets', '#06B6D4', 'HIGH', 'Genangan air jalan, saluran tersumbat, tanggul retak'),
('Pohon Tumbang & Rawan', 'pohon-tumbang', 'Trees', '#84CC16', 'CRITICAL', 'Dahan patah menutup jalan, pohon lapuk rawan tumbang'),
('Saluran Air Bersih / PDAM', 'air-bersih', 'Waves', '#3B82F6', 'MEDIUM', 'Pipa PDAM bocor di jalan, air mati di pemukiman'),
('Fasilitas Umum & Taman', 'fasilitas-umum', 'Landmark', '#8B5CF6', 'LOW', 'Bangku taman rusak, jembatan penyeberangan, halte bus'),
('Fasilitas Sekolah & Edukasi', 'fasilitas-sekolah', 'GraduationCap', '#EC4899', 'MEDIUM', 'Akses jalan sekolah membahayakan murid, pagar roboh'),
('Lalu Lintas & Rambu Rusak', 'lalu-lintas', 'TrafficCone', '#F97316', 'HIGH', 'Traffic light mati, rambu lalu lintas roboh / tertutup'),
('Lainnya & Ketertiban', 'lainnya', 'ShieldAlert', '#64748B', 'LOW', 'Gangguan ketertiban umum dan aduan warga lainnya')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO sla_settings (priority, response_time_hours, resolution_time_hours, description) VALUES
('CRITICAL', 1, 4, 'Bahaya keselamatan jiwa, bencana mendesak, atau jalan protokol terputus'),
('HIGH', 3, 12, 'Kerusakan berat yang mengganggu mobilitas luas dan fasilitas publik vital'),
('MEDIUM', 6, 24, 'Kerusakan sedang pada fasilitas lingkungan pemukiman'),
('LOW', 12, 72, 'Perawatan rutin, estetika taman, dan marka non-kritis')
ON CONFLICT (priority) DO NOTHING;

INSERT INTO users (name, email, phone, nik, role, status) VALUES
('Bambang Pamungkas, S.STP', 'admin@wargalapor.test', '08119876001', '3171010101850001', 'admin', 'active'),
('Hendra Wijaya', 'petugas@wargalapor.test', '081288991001', '3171020202880002', 'officer', 'active'),
('Siti Aisyah Rahmawati', 'warga@wargalapor.test', '085711223344', '3171030303920003', 'citizen', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO officers (user_id, department, unit, area_coverage, active_tasks_count, completed_tasks_count, status)
SELECT id, 'Dinas Bina Marga & Sumber Daya Air', 'Tim Reaksi Cepat 01 (TRC Jalan)', 'Jakarta Pusat & Selatan', 1, 12, 'available'
FROM users WHERE email = 'petugas@wargalapor.test'
ON CONFLICT DO NOTHING;

-- STORAGE BUCKET UNTUK FOTO LAPORAN
INSERT INTO storage.buckets (id, name, public) 
VALUES ('report-images', 'report-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public Access Storage" ON storage.objects FOR SELECT USING (bucket_id = 'report-images');
CREATE POLICY "Public Upload Storage" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'report-images');
