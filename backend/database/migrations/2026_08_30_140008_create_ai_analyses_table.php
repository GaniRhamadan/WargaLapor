<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_analyses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('report_id')->constrained('reports')->onDelete('cascade');
            $table->string('category_suggested')->nullable();
            $table->string('severity', 20)->default('medium'); // 'low', 'medium', 'high', 'critical'
            $table->string('priority', 20)->default('medium');
            $table->float('confidence')->default(0.85);
            $table->string('hazard_level', 20)->default('medium');
            $table->text('summary')->nullable();
            $table->text('recommendation')->nullable();
            $table->json('raw_response')->nullable();
            $table->boolean('is_fallback')->default(false);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_analyses');
    }
};
