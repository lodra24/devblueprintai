<?php

namespace App\Console\Commands;

use App\Models\Project;
use App\Services\AiGenerationService;
use Illuminate\Console\Command;
use Exception;

class TestAiService extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'ai:test';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Tests the AiGenerationService with the first available project.';

    /**
     * Execute the console command.
     */
    public function handle(AiGenerationService $aiService): int
    {
        $this->info('Starting AI Generation Service test...');

        $project = Project::first();

        if (!$project) {
            $this->error('No projects found in the database. Please seed the database first.');
            return 1;
        }

        $this->info("Found project: '{$project->name}' (ID: {$project->id})");
        $this->info("Idea: {$project->idea_text}");

        try {
            $this->info('Generating blueprint...');
            $generatedMarkdown = $aiService->generate($project);

            $this->info('Successfully generated blueprint!');
            $this->line('--- Generated Markdown ---');
            $this->line($generatedMarkdown);
            $this->line('--------------------------');

            // Loglanan ai_runs kaydını da kontrol edelim
            $lastRun = $project->aiRuns()->latest()->first();
            if ($lastRun) {
                $this->info("AI run logged successfully with status: {$lastRun->status}");
            } else {
                $this->warn("AI run was not logged.");
            }


        } catch (Exception $e) {
            $this->error('An error occurred during AI generation:');
            $this->error($e->getMessage());
            
            $lastRun = $project->aiRuns()->latest()->first();
            if ($lastRun && $lastRun->status === 'failed') {
                $this->info("AI run was correctly logged as 'failed'.");
            }

            return 1;
        }

        return 0;
    }
}