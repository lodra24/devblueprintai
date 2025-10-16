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
        Schema::create('user_stories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('epic_id')->constrained()->onDelete('cascade');
            $table->text('content');
            $table->string('status');
            $table->string('priority');
            $table->unsignedInteger('position')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_stories');
    }
};