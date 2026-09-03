#!/usr/bin/env bash
# WargaLapor Full-Stack Development Runner

echo "========================================================"
echo "          WARGALAPOR — SMART CITIZEN REPORTING          "
echo "========================================================"
echo ""
echo "[1/3] Menyiapkan Backend Laravel & Database..."
cd /home/gani/benefit/backend
php -c /home/gani/benefit/backend/php.ini artisan migrate --seed --force

echo ""
echo "[2/3] Menjalankan Server Backend API di http://127.0.0.1:8000..."
php -c /home/gani/benefit/backend/php.ini -S 127.0.0.1:8000 -t /home/gani/benefit/backend/public &
BACKEND_PID=$!

echo ""
echo "[3/3] Menjalankan Server Frontend Vite di http://localhost:5173..."
cd /home/gani/benefit/frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "========================================================"
echo " Aplikasi siap diakses di: http://localhost:5173"
echo " REST API Backend di:     http://127.0.0.1:8000/api"
echo " Akun Demo Tersedia:"
echo "   - Admin:   admin@wargalapor.test   (password: password)"
echo "   - Petugas: petugas@wargalapor.test (password: password)"
echo "   - Warga:   warga@wargalapor.test   (password: password)"
echo "========================================================"
echo "Tekan [CTRL+C] untuk menghentikan server."

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
