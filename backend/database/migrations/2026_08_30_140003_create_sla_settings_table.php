<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sla_settings', function (Blueprint $table) {
            $table->id();
            $table->string('priority', 20)->unique(); // 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'
            $table->integer('response_time_hours')->default(24);
            $table->integer('resolution_time_hours')->default(72);
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sla_settings');
    }
};
