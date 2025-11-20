<?php

namespace App\Services\AiProviders;

use App\Exceptions\AiGenerationException;
use Illuminate\Http\Client\Response;

class OpenAiProvider extends AbstractAiProvider
{
    public function providerName(): string
    {
        return 'openai';
    }

    protected function getBaseUrl(): string
    {
        return rtrim($this->config['base_url'], '/');
    }

    protected function getHeaders(): array
    {
        return [
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $this->config['api_key'],
        ];
    }

    public function buildRequestBody(string $prompt): array
    {
        $systemInstruction = $this->config['defaults']['system_instruction'] ?? '';
        $generationConfig = $this->config['defaults']['generation_config'] ?? [];

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
    }

    public function getGenerationEndpoint(): string
    {
        return '/chat/completions';
    }

    public function extractContentFromResponse(Response $response): string
    {
        $content = $response->json('choices.0.message.content');
        $finishReason = $response->json('choices.0.finish_reason');
        if (empty($content) || $finishReason === 'content_filter') {
            throw new AiGenerationException("AI failed to generate content or it was blocked by filters. Finish reason: " . ($finishReason ?? 'N/A'));
        }
        return $content;
    }
}
