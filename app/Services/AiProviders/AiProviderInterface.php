<?php

namespace App\Services\AiProviders;

use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;

interface AiProviderInterface
{
    public function providerName(): string;

    public function buildClient(): PendingRequest;

    public function buildRequestBody(string $prompt): array;

    public function getGenerationEndpoint(): string;

    public function extractContentFromResponse(Response $response): string;

    public function getModel(): string;
}
