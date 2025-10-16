<?php

namespace App\Jobs;

use App\Models\Project;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateBlueprintJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $projectId;

    public function __construct(string $projectId)
    {
        $this->projectId = $projectId;
    }

    public function handle(): void
    {
        $project = Project::find($this->projectId);

        if (!$project) {
            Log::error("GenerateBlueprintJob: Project with ID {$this->projectId} not found.");
            return;
        }

        try {
            // Initial update
            $project->update(['status' => 'generating', 'progress' => 10]);
            Log::info("Generating blueprint for project: {$project->name} (ID: {$this->projectId})");

            // --- AI LOGIC SIMULATION ---
            sleep(2); // Simulate first part of the generation
            $project->update(['progress' => 50]);

            sleep(3); // Simulate second part of the generation
            // --- END OF SIMULATION ---

            // Final update on success
            $project->update([
                'status' => 'completed',
                'progress' => 100,
                'blueprint' => ['epics' => ['// TODO: AI generated content will be here']]
            ]);

            Log::info("Blueprint generation completed for project ID: {$this->projectId}");

        } catch (\Throwable $e) {
            // Update on failure
            if (isset($project)) {
                $project->update(['status' => 'failed', 'progress' => 0]);
            }
            Log::error("Blueprint generation failed for project ID: {$this->projectId}. Error: {$e->getMessage()}");
            
            // Re-throw the exception to let the queue worker handle the failure
            throw $e;
        }
    }
}