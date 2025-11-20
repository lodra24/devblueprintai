<?php

namespace App\Services\AiProviders;

use App\Exceptions\AiGenerationException;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;

abstract class AbstractAiProvider implements AiProviderInterface
{
    public function __construct(protected array $config)
    {
        if (empty($this->config['api_key'])) {
            throw new AiGenerationException("API key for '{$this->providerName()}' is not configured.");
        }
    }

    abstract protected function getBaseUrl(): string;

    abstract protected function getHeaders(): array;

    public function buildClient(): PendingRequest
    {
        return Http::withHeaders($this->getHeaders())
            ->baseUrl($this->getBaseUrl())
            ->timeout($this->config['timeout'] ?? 60)
            ->retry(
                4,
                function (int $attempt, $exception) {
                    if ($exception instanceof RequestException && $exception->response && $exception->response->status() === 429) {
                        $retryAfter = $exception->response->header('Retry-After');

                        if (is_numeric($retryAfter)) {
                            return max(1000, (int) $retryAfter * 1000);
                        }

                        if (!empty($retryAfter)) {
                            $ts = strtotime($retryAfter);
                            if ($ts) {
                                return max(1000, ($ts - time()) * 1000);
                            }
                        }

                        return 65000;
                    }

                    if ($attempt === 1) {
                        return 2000;
                    }

                    if ($attempt === 2) {
                        return 65000;
                    }

                    if ($attempt === 3) {
                        return 2000;
                    }

                    return 1000;
                },
                function ($exception) {
                    return $exception instanceof ConnectionException
                        || ($exception instanceof RequestException
                            && in_array($exception->response?->status(), [429, 500, 502, 503, 504]));
                },
                throw: false
            );
    }

    public function getModel(): string
    {
        return $this->config['model'];
    }

    public function providerName(): string
    {
        return $this->config['name'] ?? '';
    }
}
