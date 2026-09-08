#!/usr/bin/env bash
set -e

echo "==> Menyiapkan WargaLapor Backend..."

# Pastikan folder dan file database SQLite ada
touch /var/www/html/database/database.sqlite
chmod -R 777 /var/www/html/database
chmod -R 777 /var/www/html/storage
chmod -R 777 /var/www/html/bootstrap/cache

# Generate app key jika belum ada
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

# Jalankan migrasi dan seeding data demo
php artisan migrate --force --seed || true
php artisan storage:link || true

PORT="${PORT:-8000}"
echo "==> Server WargaLapor siap di port $PORT"

exec php artisan serve --host=0.0.0.0 --port="$PORT"
