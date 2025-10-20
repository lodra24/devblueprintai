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
        Schema::table('epics', function (Blueprint $table) {
            $table->boolean('is_ai_generated')->default(false)->after('position');
            $table->string('origin_prompt_hash', 40)->nullable()->after('is_ai_generated');
            $table->index(['project_id', 'origin_prompt_hash'], 'epics_prompt_hash_index');
        });

        Schema::table('user_stories', function (Blueprint $table) {
            $table->boolean('is_ai_generated')->default(false)->after('position');
            $table->string('origin_prompt_hash', 40)->nullable()->after('is_ai_generated');
            $table->index(['epic_id', 'origin_prompt_hash'], 'user_stories_prompt_hash_index');
        });

        Schema::table('schema_suggestions', function (Blueprint $table) {
            $table->string('prompt_hash', 40)->nullable()->after('project_id');
            $table->index(['project_id', 'prompt_hash'], 'schema_suggestions_prompt_hash_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('epics', function (Blueprint $table) {
            $table->dropIndex('epics_prompt_hash_index');
            $table->dropColumn(['is_ai_generated', 'origin_prompt_hash']);
        });

        Schema::table('user_stories', function (Blueprint $table) {
            $table->dropIndex('user_stories_prompt_hash_index');
            $table->dropColumn(['is_ai_generated', 'origin_prompt_hash']);
        });

        Schema::table('schema_suggestions', function (Blueprint $table) {
            $table->dropIndex('schema_suggestions_prompt_hash_index');
            $table->dropColumn(['prompt_hash']);
        });
    }
};
