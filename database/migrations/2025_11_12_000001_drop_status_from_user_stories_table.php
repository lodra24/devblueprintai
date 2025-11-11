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
        if (!Schema::hasColumn('user_stories', 'status')) {
            return;
        }

        Schema::table('user_stories', function (Blueprint $table) {
            $table->dropColumn('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('user_stories', 'status')) {
            return;
        }

        Schema::table('user_stories', function (Blueprint $table) {
            $table->string('status')->after('content');
        });
    }
};
