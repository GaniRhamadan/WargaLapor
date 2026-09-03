#!/usr/bin/env bash
# WargaLapor Full-Stack Development Runner

echo "========================================================"
echo "          WARGALAPOR — SMART CITIZEN REPORTING          "
echo "========================================================"
echo ""
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [ -f "$DIR/backend/php.ini" ] && [ "$USER" = "gani" ]; then
    PHP_BIN="php -c $DIR/backend/php.ini"
else
    PHP_BIN="php"
fi

echo "[1/3] Menyiapkan Backend Laravel & Database..."
cd "$DIR/backend" || exit 1
$PHP_BIN artisan migrate --seed --force

echo ""
echo "[2/3] Menjalankan Server Backend API di http://127.0.0.1:8000..."
$PHP_BIN artisan serve --host=127.0.0.1 --port=8000 &
BACKEND_PID=$!

echo ""
echo "[3/3] Menjalankan Server Frontend Vite di http://0.0.0.0:5173..."
cd "$DIR/frontend" || exit 1
npm run dev -- --host 0.0.0.0 &
FRONTEND_PID=$!

echo ""
echo "========================================================"
echo " Aplikasi siap diakses di port: 5173"
echo " REST API Backend di port:     8000/api"
echo " Akun Demo Tersedia:"
echo "   - Admin:   admin@wargalapor.test   (password: password)"
echo "   - Petugas: petugas@wargalapor.test (password: password)"
echo "   - Warga:   warga@wargalapor.test   (password: password)"
echo "========================================================"
echo "Tekan [CTRL+C] untuk menghentikan server."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
