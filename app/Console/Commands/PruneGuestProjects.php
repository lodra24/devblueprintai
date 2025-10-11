<?php

namespace App\Console\Commands;

use App\Models\Project;
use Illuminate\Console\Command;

class PruneGuestProjects extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'projects:prune';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Deletes guest projects older than 30 days';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting to prune guest projects older than 30 days...');

        $deletedCount = Project::whereNull('user_id')
            ->where('created_at', '<', now()->subDays(30))
            ->delete();

        if ($deletedCount > 0) {
            $this->info("Successfully pruned {$deletedCount} guest project(s).");
        } else {
            $this->info('No guest projects needed pruning.');
        }

        return 0;
    }
}