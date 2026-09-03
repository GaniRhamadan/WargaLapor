<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('otp_verifications', function (Blueprint $table) {
            $table->id();
            $table->string('identifier')->index(); // email or phone number
            $table->string('otp_code');
            $table->string('type', 30)->default('REGISTER'); // 'REGISTER', 'LOGIN_2FA', 'FORGOT_PASSWORD'
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('expires_at');
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->boolean('is_used')->default(false);
            $table->string('ip_address', 45)->nullable();
            $table->timestamps();
        });

        // Add phone_verified_at and failed_login_attempts if not exists
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'phone_verified_at')) {
                $table->timestamp('phone_verified_at')->nullable()->after('email_verified_at');
            }
            if (!Schema::hasColumn('users', 'failed_login_attempts')) {
                $table->unsignedTinyInteger('failed_login_attempts')->default(0)->after('status');
            }
            if (!Schema::hasColumn('users', 'lockout_until')) {
                $table->timestamp('lockout_until')->nullable()->after('failed_login_attempts');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('otp_verifications');
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['phone_verified_at', 'failed_login_attempts', 'lockout_until']);
        });
    }
};
