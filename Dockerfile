# ==========================================
# STAGE 1: Build Frontend React
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ==========================================
# STAGE 2: Backend Laravel & Full-Stack Runner
# ==========================================
FROM php:8.3-cli-alpine

# Install system dependencies & PHP extensions
RUN apk add --no-cache \
    bash \
    curl \
    git \
    unzip \
    libzip-dev \
    sqlite-dev \
    oniguruma-dev \
    && docker-php-ext-install pdo_sqlite mbstring zip bcmath pcntl

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Create app directory
WORKDIR /var/www/html

# Copy backend code
COPY backend/ .

# Copy compiled frontend dist into Laravel's public directory
COPY --from=frontend-builder /app/frontend/dist/ ./public/

# Install PHP dependencies
ENV COMPOSER_ALLOW_SUPERUSER=1
ENV APP_ENV=production
ENV DB_CONNECTION=sqlite
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Create database and ensure permissions
RUN mkdir -p database storage/framework/cache storage/framework/sessions storage/framework/views storage/logs bootstrap/cache \
    && touch database/database.sqlite \
    && chmod -R 777 storage bootstrap/cache database public

# Script entrypoint untuk Hugging Face (Port 7860)
RUN cat << 'EOF' > /usr/local/bin/entrypoint.sh
#!/usr/bin/env bash
set -e

# Generate APP_KEY if not provided
if [ -z "$APP_KEY" ]; then
    php artisan key:generate --force
fi

# Run migrations and seed data
touch database/database.sqlite
chmod -R 777 database storage bootstrap/cache public
php artisan migrate --force --seed || true
php artisan storage:link || true

PORT="${PORT:-7860}"
echo "==> WargaLapor Full-Stack LIVE di port $PORT"
exec php artisan serve --host=0.0.0.0 --port="$PORT"
EOF

RUN chmod +x /usr/local/bin/entrypoint.sh

# Hugging Face Spaces standard port is 7860
EXPOSE 7860
ENV PORT=7860

CMD ["/usr/local/bin/entrypoint.sh"]
