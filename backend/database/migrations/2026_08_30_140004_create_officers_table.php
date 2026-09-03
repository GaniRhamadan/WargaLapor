<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('officers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('department'); // e.g. Dinas PU, DLH, Dishub, Satpol PP
            $table->string('unit')->nullable(); // e.g. Tim Reaksi Cepat 01
            $table->string('area_coverage')->nullable(); // e.g. Wilayah Pusat / Utara
            $table->integer('active_tasks_count')->default(0);
            $table->integer('completed_tasks_count')->default(0);
            $table->string('status', 20)->default('available'); // 'available', 'busy', 'offline'
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('officers');
    }
};
