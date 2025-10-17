<?php

namespace App\Services;

use App\Exceptions\AiGenerationException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use App\Models\Project;
use Illuminate\Support\Facades\Http;
use Illuminate\Http\Client\PendingRequest;
use Throwable;
use Illuminate\Support\Facades\Log;

class AiGenerationService
{
    protected array $config;
    protected PendingRequest $client;

    public function __construct()
    {
        $provider = config('ai.provider');
        $this->config = config("ai.{$provider}");

        if (empty($this->config['api_key'])) {
            throw new AiGenerationException("API key for '{$provider}' is not configured.");
        }
        
        $this->client = $this->buildClient();
    }
    
    /**
     * Builds the HTTP client with necessary headers and base URL.
     */
    protected function buildClient(): PendingRequest
    {
        $provider = config('ai.provider');
        $baseUrl = rtrim($this->config['base_url'], '/');
        $headers = [];

        switch ($provider) {
            case 'google':
                // Google's base URL in config already includes up to /models/, so we just append the model name
                $baseUrl .= '/' . $this->config['model'];
                $headers = [
                    'Content-Type' => 'application/json',
                    'x-goog-api-key' => $this->config['api_key'],
                ];
                break;
            case 'openai':
                $headers = [
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Bearer ' . $this->config['api_key'],
                ];
                break;
            default:
                throw new AiGenerationException("Unsupported AI provider: {$provider}");
        }

        return Http::withHeaders($headers)
            ->baseUrl($baseUrl)
            ->timeout($this->config['timeout'])
            ->retry(3, 1000, function ($exception) {
                return $exception instanceof ConnectionException ||
                       ($exception instanceof RequestException && in_array($exception->response->status(), [429, 500, 502, 503, 504]));
            }, throw: false);
    }

    /**
     * Generates a project blueprint using the configured AI provider.
     *
     * @throws AiGenerationException
     */
    public function generate(Project $project): string
    {
        $prompt = $this->buildPrompt($project);
        $promptHash = sha1($prompt);

        $existingRun = $project->aiRuns()
            ->where('prompt_hash', $promptHash)
            ->where('status', 'success')
            ->where('provider', config('ai.provider'))
            ->where('model', $this->config['model'])
            ->first();

        if ($existingRun && !empty($existingRun->raw_markdown)) {
            Log::info("Using cached successful AI run for project {$project->id}");
            return $existingRun->raw_markdown;
        }
        
        $startTime = microtime(true);
        $body = $this->buildRequestBody($prompt); // Define body here to use in both try and catch
        
        try {
            $endpoint = $this->getGenerationEndpoint();
            $response = $this->client->post($endpoint, $body);
            $response->throw();

            $rawContent = $this->extractContentFromResponse($response);
            
            $this->logAiRun($project, $promptHash, $body, $response, microtime(true) - $startTime, 'success', null, $rawContent);

            return $rawContent;

        } catch (Throwable $e) {
            $responseInstance = ($e instanceof RequestException) ? $e->response : null;
            $this->logAiRun($project, $promptHash, $body, $responseInstance, microtime(true) - $startTime, 'failed', $e->getMessage());

            throw new AiGenerationException("AI API request failed: {$e->getMessage()}", 0, $e);
        }
    }

    /**
     * Builds the request body payload for the AI API.
     */
    protected function buildRequestBody(string $prompt): array
    {
        $provider = config('ai.provider');
        $systemInstruction = config("ai.{$provider}.defaults.system_instruction");
        $generationConfig = config("ai.{$provider}.defaults.generation_config");

        switch ($provider) {
            case 'google':
                return [
                    'contents' => [['parts' => [['text' => $prompt]], 'role' => 'user']],
                    'systemInstruction' => ['parts' => [['text' => $systemInstruction]]],
                    'generationConfig' => $generationConfig,
                ];
            case 'openai':
                if (isset($generationConfig['maxOutputTokens'])) {
                    $generationConfig['max_tokens'] = $generationConfig['maxOutputTokens'];
                    unset($generationConfig['maxOutputTokens']);
                }
                
                return [
                    'model' => $this->config['model'],
                    'messages' => [
                        ['role' => 'system', 'content' => $systemInstruction],
                        ['role' => 'user', 'content' => $prompt],
                    ],
                    ...$generationConfig,
                ];
            default:
                throw new AiGenerationException('Unsupported AI provider for request body.');
        }
    }
    /**
     * Constructs the prompt from the project's idea.
     */
    protected function buildPrompt(Project $project): string
    {
        return "Project Name: {$project->name}\nProject Idea: {$project->idea_text}";
    }

    /**
     * Logs the AI API call details to the database.
     */
    protected function logAiRun(Project $project, string $promptHash, array $requestBody, ?\Illuminate\Http\Client\Response $response, float $latency, string $status, ?string $errorMessage = null, ?string $rawMarkdown = null): void
    {
        $project->aiRuns()->create([
            'provider' => config('ai.provider'),
            'model' => $this->config['model'],
            'prompt_hash' => $promptHash,
            'request_payload' => json_encode($requestBody),
            'response_payload' => null, // We no longer store the full response body
            'raw_markdown' => $rawMarkdown,
            'usage' => $status === 'success' && $response ? $response->json('usageMetadata', []) : null,
            'status' => $status,
            'error_message' => $errorMessage,
            'latency_ms' => round($latency * 1000),
        ]);
    }

    protected function getGenerationEndpoint(): string
    {
        switch (config('ai.provider')) {
            case 'google':
                return ':generateContent';
            case 'openai':
                return '/chat/completions';
            default:
                throw new AiGenerationException('Unsupported AI provider for endpoint.');
        }
    }

    protected function extractContentFromResponse($response): string
    {
        $provider = config('ai.provider');

        switch ($provider) {
            case 'google':
                $content = $response->json('candidates.0.content.parts.0.text');
                $finishReason = $response->json('candidates.0.finishReason');
                if (empty($content) || in_array($finishReason, ['SAFETY', 'OTHER', 'BLOCKED'])) {
                     throw new AiGenerationException("AI failed to generate content or it was blocked. Finish reason: " . ($finishReason ?? 'N/A'));
                }
                return $content;
            case 'openai':
                 $content = $response->json('choices.0.message.content');
                 $finishReason = $response->json('choices.0.finish_reason');
                 if (empty($content) || $finishReason === 'content_filter') {
                     throw new AiGenerationException("AI failed to generate content or it was blocked by filters. Finish reason: " . ($finishReason ?? 'N/A'));
                 }
                 return $content;
            default:
                throw new AiGenerationException('Unsupported AI provider for response extraction.');
        }
    }
}