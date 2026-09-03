<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reports', function (Blueprint $table) {
            $table->id();
            $table->string('report_number', 50)->unique();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('category_id')->constrained('report_categories')->onDelete('restrict');
            $table->string('title');
            $table->text('description');
            $table->decimal('latitude', 10, 7);
            $table->decimal('longitude', 10, 7);
            $table->text('address');
            $table->string('province', 100)->nullable();
            $table->string('city', 100)->nullable();
            $table->string('district', 100)->nullable();
            $table->string('subdistrict', 100)->nullable();
            $table->string('priority', 20)->default('MEDIUM'); // 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
            $table->string('status', 30)->default('SUBMITTED'); // 'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'VERIFIED', 'ASSIGNED', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'REJECTED', 'CLOSED'
            $table->string('verification_status', 30)->default('PENDING'); // 'PENDING', 'VERIFIED', 'REJECTED', 'NEEDS_INFO'
            $table->text('rejection_reason')->nullable();
            $table->timestamp('sla_deadline')->nullable();
            $table->boolean('is_overdue')->default(false);
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->softDeletes();
            $table->timestamps();

            // Indexes for speed & spatial queries
            $table->index('status');
            $table->index('priority');
            $table->index('verification_status');
            $table->index(['latitude', 'longitude']);
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reports');
    }
};
