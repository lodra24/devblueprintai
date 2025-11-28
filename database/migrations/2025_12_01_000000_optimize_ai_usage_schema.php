<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('has_unlimited_access')->default(false)->after('password');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->string('origin_ip_address', 45)->nullable()->after('progress');
        });

        Schema::table('ai_runs', function (Blueprint $table) {
            $table->string('ip_address', 45)->nullable()->after('project_id');
            $table->index(['ip_address', 'created_at'], 'idx_ai_quota_ip');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('has_unlimited_access');
        });

        Schema::table('projects', function (Blueprint $table) {
            $table->dropColumn('origin_ip_address');
        });

        Schema::table('ai_runs', function (Blueprint $table) {
            $table->dropIndex('idx_ai_quota_ip');
            $table->dropColumn('ip_address');
        });
    }
};
