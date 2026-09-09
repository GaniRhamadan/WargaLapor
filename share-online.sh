#!/usr/bin/env bash
# ==============================================================================
# WargaLapor — High-Performance Cloudflare Tunnel Runner (Production Bundle)
# ==============================================================================

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "========================================================"
echo "    🚀 MENYIAPKAN WARGALAPOR FULL-STACK (PRODUCTION)    "
echo "========================================================"
echo ""

# Deteksi PHP Environment
if [ -f "$DIR/backend/php.ini" ] && [ "$USER" = "gani" ]; then
    PHP_BIN="php -c $DIR/backend/php.ini"
else
    PHP_BIN="php"
fi

# 1. Compile Frontend Bundle (Cepat & Ringan untuk Tunnel)
echo "[1/3] Mengompilasi Frontend React menjadi Production Bundle..."
cd "$DIR/frontend" || exit 1
npm run build > /dev/null 2>&1

# Salin aset frontend langsung ke direktori public Laravel
cp -rf "$DIR/frontend/dist/"* "$DIR/backend/public/"

# 2. Setup Database & Jalankan Server Full-Stack di Port 8000
echo "[2/3] Menyiapkan Database & Menjalankan Server Full-Stack..."
cd "$DIR/backend" || exit 1
$PHP_BIN artisan migrate --seed --force > /dev/null 2>&1
$PHP_BIN artisan storage:link > /dev/null 2>&1

# Matikan server lama jika masih ada
pkill -f "artisan serve --host=127.0.0.1 --port=8000" 2>/dev/null || true
pkill -f "cloudflared" 2>/dev/null || true

$PHP_BIN artisan serve --host=127.0.0.1 --port=8000 > /dev/null 2>&1 &
BACKEND_PID=$!

sleep 2

# Trap untuk mematikan semua proses saat CTRL+C
cleanup() {
    echo ""
    echo "Menghentikan semua server dan tunnel..."
    kill $BACKEND_PID 2>/dev/null || true
    pkill -f "cloudflared" 2>/dev/null || true
    exit 0
}
trap cleanup EXIT INT TERM

echo "[3/3] Menghubungkan ke Cloudflare Edge Network (HTTP/2 Stable)..."
echo ""
echo "========================================================"
echo " 🌐 AKUN DEMO SIAP PAKAI:"
echo "   - Admin:   admin@wargalapor.test   (password: password)"
echo "   - Petugas: petugas@wargalapor.test (password: password)"
echo "   - Warga:   warga@wargalapor.test   (password: password)"
echo "========================================================"
echo ""
echo "Salin LINK PUBLIK resmi yang ada di dalam kotak di bawah:"
echo ""

# Jalankan Cloudflare Tunnel dengan protokol HTTP/2 anti-disconnect
"$DIR/cloudflared" tunnel --protocol http2 --url http://127.0.0.1:8000
