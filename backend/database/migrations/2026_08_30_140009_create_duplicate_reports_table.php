<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('duplicate_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('reports')->onDelete('cascade');
            $table->foreignId('original_report_id')->constrained('reports')->onDelete('cascade');
            $table->float('similarity_percentage')->default(0.0);
            $table->float('distance_meters')->nullable();
            $table->text('comparison_summary')->nullable();
            $table->string('user_action', 30)->default('PROCEEDED'); // 'PENDING', 'MERGED', 'PROCEEDED'
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('duplicate_reports');
    }
};
