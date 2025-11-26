<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('user_stories', function (Blueprint $table) {
            $table->text('original_content')->nullable()->after('content');
        });

        // Backfill for existing AI-generated stories so restore can work immediately.
        DB::table('user_stories')
            ->whereNull('original_content')
            ->update([
                'original_content' => DB::raw('content'),
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_stories', function (Blueprint $table) {
            $table->dropColumn('original_content');
        });
    }
};
