<?php

namespace App\Jobs;

use App\Enums\ProjectStatus;
use App\Events\BlueprintGenerated;
use App\Events\BlueprintStatusUpdated;
use App\Models\Project;
use App\Services\AiGenerationService;
use App\Services\BlueprintPersistenceService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Throwable;

class GenerateBlueprintJob implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public function __construct(public string $projectId)
    {
    }

    public function handle(
        AiGenerationService $aiService,
        BlueprintPersistenceService $persistenceService
    ): void {
        $project = Project::find($this->projectId);

        if (!$project) {
            Log::error("GenerateBlueprintJob: Project with ID {$this->projectId} not found.");
            return;
        }

        $promptHash = $aiService->calculatePromptHash($project);

        try {
            $this->updateProject($project, ProjectStatus::Generating, 10, 'generating');
            Log::info("Generating blueprint for project: {$project->name} (ID: {$this->projectId})");

            $rawMarkdown = $aiService->generate($project);
            $this->updateProject($project, ProjectStatus::Generating, 50, 'generating');
            Log::info("AI generation complete for project ID: {$this->projectId}. Now persisting.");

            $this->updateProject($project, ProjectStatus::Parsing, 65, 'parsing');
            $persistenceService->persist($project, $rawMarkdown, $promptHash);
            $this->updateProject($project, ProjectStatus::Parsing, 90, 'parsing');
            Log::info("Persistence complete for project ID: {$this->projectId}.");

            $this->updateProject($project, ProjectStatus::Ready, 100, 'ready');
            BlueprintGenerated::dispatch($project->fresh(), $promptHash);
            Log::info("Blueprint generation fully completed for project ID: {$this->projectId}");
        } catch (Throwable $e) {
            $this->updateProject($project, ProjectStatus::Failed, 0, 'failed', $e->getMessage());
            Log::error("Blueprint generation failed for project ID: {$this->projectId}. Error: {$e->getMessage()}");

            throw $e;
        }
    }

    private function updateProject(
        Project $project,
        ProjectStatus $status,
        int $progress,
        string $stage,
        ?string $message = null
    ): void {
        $project->forceFill([
            'status' => $status,
            'progress' => $progress,
        ])->save();

        BlueprintStatusUpdated::dispatch($project->fresh(), $status, $progress, $stage, $message);
    }
}
