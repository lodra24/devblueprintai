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
        Schema::create('ai_runs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('project_id')->constrained()->onDelete('cascade');
            $table->string('provider')->nullable();
            $table->string('model')->nullable();
            $table->string('prompt_hash')->index();
            $table->mediumText('request_payload')->nullable();
            $table->mediumText('response_payload')->nullable();
            $table->jsonb('usage')->nullable(); // To store token counts like { "prompt_tokens": 100, "completion_tokens": 200 }
            $table->string('status'); // e.g., success, failed
            $table->text('error_message')->nullable();
            $table->unsignedInteger('latency_ms')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_runs');
    }
};