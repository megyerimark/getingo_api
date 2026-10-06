<?php

namespace App\Services;

use App\Models\Project;

class ProjectValidationService
{
    public const SERVER_VALIDATION_TYPES = [
        'html_contains',
        'css_contains',
        'javascript_contains',
        'source_contains',
    ];

    public const CLIENT_VALIDATION_TYPES = [
        'console_exact',
        'console_contains',
    ];

    public function validate(Project $project, array $payload): array
    {
        $expected = $this->expectedFragments((string) $project->expected_output);
        $type = (string) $project->validation_type;

        if ($expected === []) {
            return [
                'passed' => false,
                'trusted' => false,
                'console_output' => $this->normalizeConsole($payload['console_output'] ?? []),
            ];
        }

        if (in_array($type, self::SERVER_VALIDATION_TYPES, true)) {
            return [
                'passed' => $this->passesServerValidation($type, $payload, $expected),
                'trusted' => true,
                'console_output' => $this->normalizeConsole($payload['console_output'] ?? []),
            ];
        }

        $actual = $this->normalizeConsole($payload['console_output'] ?? []);

        return [
            'passed' => $this->passesClientConsoleValidation($type, $actual, $expected),
            'trusted' => false,
            'console_output' => $actual,
        ];
    }

    public function isTrustedType(?string $type): bool
    {
        return in_array((string) $type, self::SERVER_VALIDATION_TYPES, true);
    }

    private function passesServerValidation(string $type, array $payload, array $expected): bool
    {
        $source = match ($type) {
            'html_contains' => $this->stripHtmlComments((string) ($payload['html_code'] ?? '')),
            'css_contains' => $this->stripBlockComments((string) ($payload['css_code'] ?? '')),
            'javascript_contains' => $this->stripJavaScriptComments((string) ($payload['javascript_code'] ?? '')),
            'source_contains' => implode("\n", [
                $this->stripHtmlComments((string) ($payload['html_code'] ?? '')),
                $this->stripBlockComments((string) ($payload['css_code'] ?? '')),
                $this->stripJavaScriptComments((string) ($payload['javascript_code'] ?? '')),
            ]),
            default => '',
        };

        $normalizedSource = $this->normalizeSource($source);

        if ($normalizedSource === '') {
            return false;
        }

        foreach ($expected as $fragment) {
            if (! str_contains($normalizedSource, $this->normalizeSource($fragment))) {
                return false;
            }
        }

        return true;
    }

    private function passesClientConsoleValidation(string $type, array $actual, array $expected): bool
    {
        if ($type === 'console_contains') {
            foreach ($expected as $expectedLine) {
                if (! in_array($expectedLine, $actual, true)) {
                    return false;
                }
            }

            return true;
        }

        if ($type === 'console_exact') {
            return $actual === $expected;
        }

        return false;
    }

    private function expectedFragments(string $expected): array
    {
        return collect(preg_split('/\R/u', $expected) ?: [])
            ->map(fn ($line) => trim((string) $line))
            ->filter(fn (string $line) => $line !== '')
            ->values()
            ->all();
    }

    private function normalizeConsole(array $lines): array
    {
        return collect($lines)
            ->map(fn ($line) => trim((string) $line))
            ->filter(fn (string $line) => $line !== '')
            ->values()
            ->all();
    }

    private function normalizeSource(string $source): string
    {
        return trim((string) preg_replace('/\s+/u', ' ', $source));
    }

    private function stripHtmlComments(string $source): string
    {
        return (string) preg_replace('/<!--.*?-->/s', '', $source);
    }

    private function stripBlockComments(string $source): string
    {
        return (string) preg_replace('~/\*.*?\*/~s', '', $source);
    }

    private function stripJavaScriptComments(string $source): string
    {
        $source = $this->stripBlockComments($source);

        return (string) preg_replace('~(^|\s)//[^\r\n]*~m', '$1', $source);
    }
}
