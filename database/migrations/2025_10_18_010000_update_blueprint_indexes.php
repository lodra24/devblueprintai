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
        Schema::table('schema_suggestions', function (Blueprint $table) {
            if (Schema::hasColumn('schema_suggestions', 'prompt_hash')) {
                try {
                    $table->dropIndex(['prompt_hash']);
                } catch (\Throwable $exception) {
                    $table->dropIndex('schema_suggestions_prompt_hash_index');
                }
                $table->unique(['project_id', 'prompt_hash'], 'schema_suggestions_project_prompt_unique');
            }
            $table->index(['project_id', 'created_at'], 'schema_suggestions_project_created_index');
        });

        Schema::table('epics', function (Blueprint $table) {
            if (Schema::hasColumn('epics', 'is_ai_generated')) {
                $table->index(['project_id', 'is_ai_generated'], 'epics_project_ai_index');
            }
        });

        Schema::table('user_stories', function (Blueprint $table) {
            if (Schema::hasColumn('user_stories', 'is_ai_generated')) {
                $table->index(['epic_id', 'is_ai_generated'], 'user_stories_epic_ai_index');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schema_suggestions', function (Blueprint $table) {
            $table->dropIndex('schema_suggestions_project_created_index');
            $table->dropUnique('schema_suggestions_project_prompt_unique');
            $table->index(['project_id', 'prompt_hash'], 'schema_suggestions_prompt_hash_index');
        });

        Schema::table('epics', function (Blueprint $table) {
            $table->dropIndex('epics_project_ai_index');
        });

        Schema::table('user_stories', function (Blueprint $table) {
            $table->dropIndex('user_stories_epic_ai_index');
        });
    }
};
