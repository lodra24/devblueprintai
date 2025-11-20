<?php

namespace App\Services\AiProviders;

use App\Exceptions\AiGenerationException;
use Illuminate\Http\Client\Response;

class GoogleProvider extends AbstractAiProvider
{
    public function providerName(): string
    {
        return 'google';
    }

    protected function getBaseUrl(): string
    {
        return rtrim($this->config['base_url'], '/') . '/' . $this->config['model'];
    }

    protected function getHeaders(): array
    {
        return [
            'Content-Type' => 'application/json',
            'x-goog-api-key' => $this->config['api_key'],
        ];
    }

    public function buildRequestBody(string $prompt): array
    {
        $systemInstruction = $this->config['defaults']['system_instruction'] ?? '';
        $generationConfig = $this->config['defaults']['generation_config'] ?? [];

        return [
            'contents' => [['parts' => [['text' => $prompt]], 'role' => 'user']],
            'systemInstruction' => ['parts' => [['text' => $systemInstruction]]],
            'generationConfig' => $generationConfig,
        ];
    }

    public function getGenerationEndpoint(): string
    {
        return ':generateContent';
    }

    public function extractContentFromResponse(Response $response): string
    {
        $content = $response->json('candidates.0.content.parts.0.text');
        $finishReason = $response->json('candidates.0.finishReason');
        if (empty($content) || in_array($finishReason, ['SAFETY', 'OTHER', 'BLOCKED'])) {
            throw new AiGenerationException("AI failed to generate content or it was blocked. Finish reason: " . ($finishReason ?? 'N/A'));
        }
        return $content;
    }
}
