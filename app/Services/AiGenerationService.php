<?php

namespace App\Services;

use App\Exceptions\AiGenerationException;
use App\Models\Project;
use App\Services\AiProviders\AiProviderInterface;
use App\Services\AiProviders\GoogleProvider;
use App\Services\AiProviders\OpenAiProvider;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Log;
use Throwable;

class AiGenerationService
{
    protected AiProviderInterface $provider;
    protected PendingRequest $client;

    public function __construct()
    {
        $providerKey = config('ai.provider');
        $this->provider = $this->makeProvider($providerKey);
        $this->client = $this->provider->buildClient();
    }

    /**
     * Generates a project blueprint using the configured AI provider.
     *
     * @throws AiGenerationException
     */
    public function generate(Project $project): string
    {
        $prompt = $this->makePrompt($project);
        $promptHash = $this->calculatePromptHash($project, $prompt);

        $existingRun = $project->aiRuns()
            ->where('prompt_hash', $promptHash)
            ->where('status', 'success')
            ->where('provider', $this->provider->providerName())
            ->where('model', $this->provider->getModel())
            ->first();

        if ($existingRun && !empty($existingRun->raw_markdown)) {
            Log::info("Using cached successful AI run for project {$project->id}");
            return $existingRun->raw_markdown;
        }

        $startTime = microtime(true);
        $body = $this->provider->buildRequestBody($prompt);

        try {
            $endpoint = $this->provider->getGenerationEndpoint();
            $response = $this->client->post($endpoint, $body);
            $response->throw();

            $rawContent = $this->provider->extractContentFromResponse($response);

            $this->logAiRun($project, $promptHash, $body, $response, microtime(true) - $startTime, 'success', null, $rawContent);

            return $rawContent;
        } catch (Throwable $e) {
            $responseInstance = ($e instanceof RequestException) ? $e->response : null;
            $this->logAiRun($project, $promptHash, $body, $responseInstance, microtime(true) - $startTime, 'failed', $e->getMessage());

            throw new AiGenerationException("AI API request failed: {$e->getMessage()}", 0, $e);
        }
    }

    /**
     * Expose the prompt used for AI generation.
     */
    public function makePrompt(Project $project): string
    {
        return $this->buildPrompt($project);
    }

    public function calculatePromptHash(Project $project, ?string $prompt = null): string
    {
        $prompt ??= $this->makePrompt($project);

        return sha1($prompt);
    }

    /**
     * Constructs the prompt from the project's idea.
     */
    protected function buildPrompt(Project $project): string
    {
        return "Brand/Offer: {$project->name}\nMarketing context: {$project->idea_text}";
    }

    /**
     * Logs the AI API call details to the database.
     */
    protected function logAiRun(Project $project, string $promptHash, array $requestBody, ? Response $response, float $latency, string $status, ?string $errorMessage = null, ?string $rawMarkdown = null): void
    {
        // Extract usage per provider when available
        $usage = null;
        $statusCode = null;
        $finishReason = null;
        if ($status === 'success' && $response) {
            $provider = $this->provider->providerName();
            $statusCode = $response->status();
            if ($provider === 'google') {
                $usage = $response->json('usageMetadata', []) ?: null;
                $finishReason = $response->json('candidates.0.finishReason');
            } elseif ($provider === 'openai') {
                $usage = $response->json('usage', []) ?: null;
                $finishReason = $response->json('choices.0.finish_reason');
            }
        } elseif ($response) {
            // Failed but we have a response object
            $statusCode = $response->status();
        }

        $project->aiRuns()->create([
            'provider' => $this->provider->providerName(),
            'model' => $this->provider->getModel(),
            'prompt_hash' => $promptHash,
            'request_payload' => json_encode($requestBody),
            'response_payload' => null, // We no longer store the full response body
            'raw_markdown' => $rawMarkdown,
            'usage' => $usage,
            'status' => $status,
            'error_message' => $errorMessage,
            'latency_ms' => round($latency * 1000),
            'status_code' => $statusCode,
            'finish_reason' => $finishReason,
        ]);
    }

    protected function makeProvider(string $providerKey): AiProviderInterface
    {
        $config = config("ai.{$providerKey}");

        return match ($providerKey) {
            'google' => new GoogleProvider($config),
            'openai' => new OpenAiProvider($config),
            default => throw new AiGenerationException("Unsupported AI provider: {$providerKey}"),
        };
    }
}
