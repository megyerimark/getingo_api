<?php

namespace App\Http\Controllers;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use RuntimeException;

class CodeExecutionController extends Controller
{
    public function capabilities()
    {
        $languages = [];

        foreach (['python', 'csharp', 'sql'] as $language) {
            $primary = $this->primaryProvider($language);
            $fallback = $this->fallbackProvider();

            $languages[$language] = [
                'provider' => $primary,
                'configured' => $this->providerConfigured($primary),
                'fallback_provider' => $fallback !== $primary ? $fallback : null,
                'fallback_configured' => $fallback !== $primary ? $this->providerConfigured($fallback) : false,
                'sandboxed' => true,
            ];
        }

        return response()->json(['languages' => $languages]);
    }

    public function run(Request $request)
    {
        $validated = $request->validate([
            'language' => ['required', Rule::in(['python', 'csharp', 'sql'])],
            'code' => ['required', 'string', 'max:30000'],
            'stdin' => ['nullable', 'string', 'max:10000'],
        ]);

        $language = $validated['language'];
        $providers = array_values(array_unique(array_filter([
            $this->primaryProvider($language),
            $this->fallbackProvider(),
        ])));

        $lastInfrastructureError = null;

        foreach ($providers as $provider) {
            if (! $this->providerConfigured($provider)) {
                continue;
            }

            try {
                $result = match ($provider) {
                    'onecompiler' => $this->runOneCompiler($language, $validated['code'], $validated['stdin'] ?? ''),
                    'piston' => $this->runPiston($language, $validated['code'], $validated['stdin'] ?? ''),
                    'judge0' => $this->runJudge0($language, $validated['code'], $validated['stdin'] ?? ''),
                    default => throw new RuntimeException('Ismeretlen kódfuttató szolgáltató.'),
                };

                if ($provider !== $providers[0]) {
                    $result['warning'] = trim(($result['warning'] ?? '')."\nAz elsődleges futtató nem volt elérhető, ezért tartalék sandbox futott.");
                }

                return response()->json($result);
            } catch (ConnectionException|RuntimeException $exception) {
                $lastInfrastructureError = $exception;
                Log::warning('Code runner provider failed', [
                    'provider' => $provider,
                    'language' => $language,
                    'message' => $exception->getMessage(),
                ]);
            } catch (\Throwable $exception) {
                report($exception);
                $lastInfrastructureError = $exception;
            }
        }

        return response()->json([
            'message' => $lastInfrastructureError
                ? 'A kódfuttató szolgáltatás most nem elérhető. Próbáld újra később.'
                : 'Ehhez a nyelvhez nincs beállítva használható sandbox futtató.',
        ], 503);
    }

    private function runOneCompiler(string $language, string $code, string $stdin): array
    {
        $baseUrl = rtrim((string) config('services.onecompiler.url'), '/');
        $apiKey = trim((string) config('services.onecompiler.api_key'));

        if ($baseUrl === '' || $apiKey === '') {
            throw new RuntimeException('A OneCompiler nincs konfigurálva.');
        }

        $remoteLanguage = match ($language) {
            'python' => 'python',
            'csharp' => 'csharp',
            'sql' => 'mysql',
        };

        $source = $language === 'sql'
            ? $this->sqlPrelude('mysql')."\n\n".$code
            : $code;

        $fileName = match ($language) {
            'python' => 'main.py',
            'csharp' => 'Program.cs',
            'sql' => 'query.sql',
        };

        $response = Http::acceptJson()
            ->asJson()
            ->withHeaders(['X-API-Key' => $apiKey])
            ->timeout(25)
            ->post($baseUrl.'/run', [
                'language' => $remoteLanguage,
                'stdin' => $stdin,
                'files' => [[
                    'name' => $fileName,
                    'content' => $source,
                ]],
            ]);

        if ($response->failed()) {
            throw new RuntimeException('A OneCompiler HTTP hibát adott.');
        }

        $payload = $response->json();
        if (! is_array($payload) || (($payload['status'] ?? 'success') === 'failed')) {
            throw new RuntimeException((string) ($payload['error'] ?? 'A OneCompiler nem tudta elindítani a futtatást.'));
        }

        $stdout = $this->limitOutput((string) ($payload['stdout'] ?? ''));
        $stderr = $this->limitOutput((string) ($payload['stderr'] ?? ''));
        $exception = $this->limitOutput((string) ($payload['exception'] ?? $payload['error'] ?? ''));

        $parts = array_values(array_filter([
            $exception !== '' ? "Fordítási / futási hiba:\n".$exception : '',
            $stderr !== '' ? "Hiba:\n".$stderr : '',
            $stdout,
        ]));

        $hasError = $exception !== '' || $stderr !== '';
        $runtime = match ($language) {
            'python' => 'Python · OneCompiler sandbox',
            'csharp' => 'C# · OneCompiler sandbox',
            'sql' => 'MySQL · OneCompiler sandbox',
        };

        return [
            'language' => $language,
            'provider' => 'onecompiler',
            'runtime' => $runtime,
            'status' => $hasError ? 'Hiba' : 'Sikeres',
            'output' => $parts !== [] ? implode("\n\n", $parts) : 'A program lefutott, de nem adott kimenetet.',
            'stdout' => $stdout,
            'stderr' => $stderr,
            'compile_output' => $exception,
            'time' => isset($payload['executionTime']) ? number_format(((float) $payload['executionTime']) / 1000, 3, '.', '') : null,
            'memory' => isset($payload['memory']) ? (int) $payload['memory'] : null,
            'sql_dialect' => $language === 'sql' ? 'MySQL' : null,
            'warning' => null,
        ];
    }

    private function runPiston(string $language, string $code, string $stdin): array
    {
        $baseUrl = rtrim((string) config('services.piston.url'), '/');
        if ($baseUrl === '') {
            throw new RuntimeException('A Piston nincs konfigurálva.');
        }

        $runtime = $this->pistonRuntime($baseUrl, $language);
        if (! $runtime) {
            throw new RuntimeException('A kiválasztott nyelv nincs telepítve a Piston sandboxban.');
        }

        $source = $language === 'sql'
            ? $this->sqlPrelude('sqlite')."\n\n".$code
            : $code;

        $fileName = match ($language) {
            'python' => 'main.py',
            'csharp' => 'Program.cs',
            'sql' => 'query.sql',
        };

        $response = $this->pistonClient()
            ->timeout(25)
            ->post($baseUrl.'/execute', [
                'language' => $runtime['language'],
                'version' => $runtime['version'],
                'files' => [[
                    'name' => $fileName,
                    'content' => $source,
                ]],
                'stdin' => $stdin,
                'compile_timeout' => 10000,
                'run_timeout' => 5000,
                'compile_cpu_time' => 10000,
                'run_cpu_time' => 5000,
                'compile_memory_limit' => 268435456,
                'run_memory_limit' => 268435456,
            ]);

        if ($response->failed()) {
            throw new RuntimeException('A Piston HTTP hibát adott.');
        }

        $payload = $response->json();
        if (! is_array($payload)) {
            throw new RuntimeException('Érvénytelen Piston válasz.');
        }

        $compile = is_array($payload['compile'] ?? null) ? $payload['compile'] : [];
        $run = is_array($payload['run'] ?? null) ? $payload['run'] : [];

        $compileOut = $this->limitOutput(trim((string) ($compile['stdout'] ?? '')."\n".(string) ($compile['stderr'] ?? '')));
        $stdout = $this->limitOutput((string) ($run['stdout'] ?? ''));
        $stderr = $this->limitOutput((string) ($run['stderr'] ?? ''));

        $compileFailed = isset($compile['code']) && (int) $compile['code'] !== 0;
        $runFailed = isset($run['code']) && (int) $run['code'] !== 0;

        $parts = array_values(array_filter([
            $compileOut !== '' ? "Fordító:\n".$compileOut : '',
            $stderr !== '' ? "Hiba:\n".$stderr : '',
            $stdout,
            ! empty($run['message']) ? "Üzenet:\n".$this->limitOutput((string) $run['message']) : '',
        ]));

        return [
            'language' => $language,
            'provider' => 'piston',
            'runtime' => ucfirst($runtime['language']).' '.$runtime['version'].' · Piston sandbox',
            'status' => $compileFailed ? 'Fordítási hiba' : ($runFailed ? 'Futási hiba' : 'Sikeres'),
            'output' => $parts !== [] ? implode("\n\n", $parts) : 'A program lefutott, de nem adott kimenetet.',
            'stdout' => $stdout,
            'stderr' => $stderr,
            'compile_output' => $compileOut,
            'time' => null,
            'memory' => null,
            'sql_dialect' => $language === 'sql' ? 'SQLite' : null,
            'warning' => null,
        ];
    }

    private function runJudge0(string $language, string $code, string $stdin): array
    {
        $baseUrl = rtrim((string) config('services.judge0.url'), '/');
        if ($baseUrl === '') {
            throw new RuntimeException('A Judge0 nincs konfigurálva.');
        }

        $languageInfo = $this->judge0Language($baseUrl, $language);
        if (! $languageInfo) {
            throw new RuntimeException('A kiválasztott nyelv nem érhető el a Judge0 sandboxban.');
        }

        $source = $language === 'sql'
            ? $this->sqlPrelude('sqlite')."\n\n".$code
            : $code;

        $response = $this->judge0Client()
            ->timeout(20)
            ->post($baseUrl.'/submissions?base64_encoded=false&wait=true', [
                'language_id' => $languageInfo['id'],
                'source_code' => $source,
                'stdin' => $stdin,
                'cpu_time_limit' => 5,
                'wall_time_limit' => 10,
                'memory_limit' => 262144,
            ]);

        if ($response->failed()) {
            throw new RuntimeException('A Judge0 HTTP hibát adott.');
        }

        $payload = $response->json();
        if (! is_array($payload)) {
            throw new RuntimeException('Érvénytelen Judge0 válasz.');
        }

        $stdout = $this->limitOutput((string) ($payload['stdout'] ?? ''));
        $stderr = $this->limitOutput((string) ($payload['stderr'] ?? ''));
        $compileOutput = $this->limitOutput((string) ($payload['compile_output'] ?? ''));
        $message = $this->limitOutput((string) ($payload['message'] ?? ''));

        $parts = array_values(array_filter([
            $compileOutput !== '' ? "Fordító:\n".$compileOutput : '',
            $stderr !== '' ? "Hiba:\n".$stderr : '',
            $stdout,
            $message !== '' ? "Üzenet:\n".$message : '',
        ]));

        $warning = null;
        if ($language === 'csharp' && stripos($languageInfo['name'], 'Mono') !== false) {
            $warning = 'Ez a tartalék Judge0 C# runtime Mono alapú. Újabb C#/.NET nyelvi elemekhez állíts be OneCompiler vagy saját modern Piston futtatót.';
        }
        if ($language === 'sql') {
            $warning = 'A tartalék SQL futtató SQLite-ot használ; néhány MySQL/MariaDB-specifikus utasítás eltérhet.';
        }

        return [
            'language' => $language,
            'provider' => 'judge0',
            'runtime' => $languageInfo['name'].' · Judge0 sandbox',
            'status' => (string) data_get($payload, 'status.description', 'Ismeretlen'),
            'output' => $parts !== [] ? implode("\n\n", $parts) : 'A program lefutott, de nem adott kimenetet.',
            'stdout' => $stdout,
            'stderr' => $stderr,
            'compile_output' => $compileOutput,
            'time' => isset($payload['time']) ? (string) $payload['time'] : null,
            'memory' => isset($payload['memory']) ? (int) $payload['memory'] : null,
            'sql_dialect' => $language === 'sql' ? 'SQLite' : null,
            'warning' => $warning,
        ];
    }

    private function primaryProvider(string $language): string
    {
        $provider = strtolower(trim((string) config('services.code_runner.providers.'.$language)));

        return in_array($provider, ['judge0', 'onecompiler', 'piston'], true)
            ? $provider
            : 'judge0';
    }

    private function fallbackProvider(): string
    {
        $provider = strtolower(trim((string) config('services.code_runner.fallback_provider', 'judge0')));

        return in_array($provider, ['judge0', 'onecompiler', 'piston'], true)
            ? $provider
            : 'judge0';
    }

    private function providerConfigured(string $provider): bool
    {
        return match ($provider) {
            'onecompiler' => trim((string) config('services.onecompiler.url')) !== ''
                && trim((string) config('services.onecompiler.api_key')) !== '',
            'piston' => trim((string) config('services.piston.url')) !== '',
            'judge0' => trim((string) config('services.judge0.url')) !== '',
            default => false,
        };
    }

    private function judge0Language(string $baseUrl, string $language): ?array
    {
        $languages = Cache::remember('judge0:languages:'.sha1($baseUrl), now()->addHour(), function () use ($baseUrl) {
            $response = $this->judge0Client()->timeout(10)->get($baseUrl.'/languages');
            if ($response->failed()) {
                throw new RuntimeException('Nem sikerült lekérni a Judge0 nyelveit.');
            }

            return $response->json();
        });

        $items = is_array($languages) ? $languages : [];

        if ($language === 'csharp') {
            $dotnet = array_values(array_filter($items, fn ($item) => preg_match('/^C# .*\.NET/i', (string) ($item['name'] ?? ''))));
            if ($dotnet !== []) {
                usort($dotnet, fn ($a, $b) => ((int) $b['id']) <=> ((int) $a['id']));
                return ['id' => (int) $dotnet[0]['id'], 'name' => (string) $dotnet[0]['name']];
            }
        }

        $patterns = [
            'python' => '/^Python \(3/i',
            'csharp' => '/^C# \(/i',
            'sql' => '/^SQL \(SQLite/i',
        ];

        $matches = array_values(array_filter($items, fn ($item) => preg_match($patterns[$language], (string) ($item['name'] ?? ''))));
        if ($matches === []) {
            return null;
        }

        usort($matches, fn ($a, $b) => ((int) $b['id']) <=> ((int) $a['id']));

        return ['id' => (int) $matches[0]['id'], 'name' => (string) $matches[0]['name']];
    }

    private function pistonRuntime(string $baseUrl, string $language): ?array
    {
        $runtimes = Cache::remember('piston:runtimes:'.sha1($baseUrl), now()->addHour(), function () use ($baseUrl) {
            $response = $this->pistonClient()->timeout(10)->get($baseUrl.'/runtimes');
            if ($response->failed()) {
                throw new RuntimeException('Nem sikerült lekérni a Piston runtime-okat.');
            }

            return $response->json();
        });

        $items = is_array($runtimes) ? $runtimes : [];
        $wanted = match ($language) {
            'python' => ['python', 'python3', 'py'],
            'csharp' => ['csharp', 'c#', 'cs', 'dotnet'],
            'sql' => ['sqlite', 'sqlite3', 'sql'],
        };

        $matches = array_values(array_filter($items, function ($item) use ($wanted) {
            $names = array_map('strtolower', array_filter(array_merge([
                (string) ($item['language'] ?? ''),
            ], is_array($item['aliases'] ?? null) ? $item['aliases'] : [])));

            return array_intersect($wanted, $names) !== [];
        }));

        if ($matches === []) {
            return null;
        }

        usort($matches, fn ($a, $b) => version_compare((string) ($b['version'] ?? '0'), (string) ($a['version'] ?? '0')));

        return [
            'language' => (string) $matches[0]['language'],
            'version' => (string) $matches[0]['version'],
        ];
    }

    private function judge0Client()
    {
        $headers = [];
        $token = trim((string) config('services.judge0.auth_token'));
        if ($token !== '') {
            $headers['X-Auth-Token'] = $token;
        }

        return Http::acceptJson()->asJson()->withHeaders($headers);
    }

    private function pistonClient()
    {
        $headers = [];
        $token = trim((string) config('services.piston.auth_token'));
        $header = trim((string) config('services.piston.auth_header', 'Authorization'));

        if ($token !== '' && $header !== '') {
            $headers[$header] = $token;
        }

        return Http::acceptJson()->asJson()->withHeaders($headers);
    }

    private function limitOutput(string $value): string
    {
        $value = trim($value);
        if (mb_strlen($value) <= 30000) {
            return $value;
        }

        return mb_substr($value, 0, 30000)."\n… [a kimenet rövidítve]";
    }

    private function sqlPrelude(string $dialect): string
    {
        return $dialect === 'mysql' ? $this->mysqlPrelude() : $this->sqlitePrelude();
    }

    private function mysqlPrelude(): string
    {
        return <<<'SQL'
CREATE TABLE users (id BIGINT PRIMARY KEY, name VARCHAR(120), email VARCHAR(190) UNIQUE, role VARCHAR(30), is_active TINYINT, xp INT, created_at DATETIME, deleted_at DATETIME NULL, email_verified_at DATETIME NULL, display_name VARCHAR(120) NULL, password VARCHAR(255));
INSERT INTO users VALUES
(1,'Anna','anna@example.com','student',1,1850,'2026-09-01 10:00:00',NULL,'2026-09-01 10:10:00','Anna','hash'),
(2,'Béla','bela@example.com','student',1,720,'2026-09-15 12:00:00',NULL,NULL,NULL,'hash'),
(3,'Admin','admin@example.com','admin',1,6200,'2026-08-01 08:00:00',NULL,'2026-08-01 08:10:00','Admin','hash');
CREATE TABLE categories (id BIGINT PRIMARY KEY, name VARCHAR(120), slug VARCHAR(150) UNIQUE, sort_order INT);
INSERT INTO categories VALUES (1,'HTML','html',10),(2,'CSS','css',20),(6,'JavaScript','javascript',60),(9,'SQL','sql',90);
CREATE TABLE lessons (id BIGINT PRIMARY KEY, category_id BIGINT, title VARCHAR(255), slug VARCHAR(255), sort_order INT, is_published TINYINT DEFAULT 1, updated_at DATETIME, deleted_at DATETIME NULL, FOREIGN KEY(category_id) REFERENCES categories(id));
INSERT INTO lessons VALUES
(1,1,'HTML alapok','html-alapok',10,1,'2026-10-01 10:00:00',NULL),
(2,2,'CSS alapok','css-alapok',10,1,'2026-10-01 10:00:00',NULL),
(37,6,'JavaScript változók','javascript-valtozok',40,1,'2026-10-03 10:00:00',NULL),
(90,9,'SELECT és FROM','sql-select-from',20,1,'2026-10-04 10:00:00',NULL);
CREATE TABLE notes (id BIGINT PRIMARY KEY, user_id BIGINT, lesson_id BIGINT, content TEXT);
INSERT INTO notes VALUES (1,1,37,'Gyakorolni a const és let közti különbséget.');
CREATE TABLE favorites (id BIGINT PRIMARY KEY, user_id BIGINT, lesson_id BIGINT);
INSERT INTO favorites VALUES (1,1,37),(2,1,90),(3,2,1);
CREATE TABLE progress (id BIGINT PRIMARY KEY, user_id BIGINT, lesson_id BIGINT, completed_at DATETIME NULL);
INSERT INTO progress VALUES (1,1,1,'2026-10-01 12:00:00'),(2,1,37,'2026-10-03 13:00:00'),(3,2,1,NULL);
CREATE TABLE payments (id BIGINT PRIMARY KEY, user_id BIGINT, amount DECIMAL(10,2), created_at DATETIME);
INSERT INTO payments VALUES (1,1,2490,'2026-09-01 10:00:00'),(2,1,2490,'2026-10-01 10:00:00'),(3,2,1990,'2026-10-02 10:00:00');
CREATE TABLE newsletter_subscribers (id BIGINT PRIMARY KEY, email VARCHAR(190));
INSERT INTO newsletter_subscribers VALUES (1,'anna@example.com'),(2,'newsletter@example.com');
CREATE TABLE tags (id BIGINT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(120) UNIQUE);
CREATE TABLE settings (`key` VARCHAR(120) PRIMARY KEY, `value` TEXT);
CREATE TABLE accounts (id BIGINT PRIMARY KEY, balance DECIMAL(12,2));
INSERT INTO accounts VALUES (1,5000),(2,1500);
SQL;
    }

    private function sqlitePrelude(): string
    {
        return <<<'SQL'
PRAGMA foreign_keys = ON;
CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT UNIQUE, role TEXT, is_active INTEGER, xp INTEGER, created_at TEXT, deleted_at TEXT, email_verified_at TEXT, display_name TEXT, password TEXT);
INSERT INTO users VALUES
(1,'Anna','anna@example.com','student',1,1850,'2026-09-01 10:00:00',NULL,'2026-09-01 10:10:00','Anna','hash'),
(2,'Béla','bela@example.com','student',1,720,'2026-09-15 12:00:00',NULL,NULL,NULL,'hash'),
(3,'Admin','admin@example.com','admin',1,6200,'2026-08-01 08:00:00',NULL,'2026-08-01 08:10:00','Admin','hash');
CREATE TABLE categories (id INTEGER PRIMARY KEY, name TEXT, slug TEXT UNIQUE, sort_order INTEGER);
INSERT INTO categories VALUES (1,'HTML','html',10),(2,'CSS','css',20),(6,'JavaScript','javascript',60),(9,'SQL','sql',90);
CREATE TABLE lessons (id INTEGER PRIMARY KEY, category_id INTEGER, title TEXT, slug TEXT, sort_order INTEGER, is_published INTEGER DEFAULT 1, updated_at TEXT, deleted_at TEXT, FOREIGN KEY(category_id) REFERENCES categories(id));
INSERT INTO lessons VALUES
(1,1,'HTML alapok','html-alapok',10,1,'2026-10-01 10:00:00',NULL),
(2,2,'CSS alapok','css-alapok',10,1,'2026-10-01 10:00:00',NULL),
(37,6,'JavaScript változók','javascript-valtozok',40,1,'2026-10-03 10:00:00',NULL),
(90,9,'SELECT és FROM','sql-select-from',20,1,'2026-10-04 10:00:00',NULL);
CREATE TABLE notes (id INTEGER PRIMARY KEY, user_id INTEGER, lesson_id INTEGER, content TEXT);
INSERT INTO notes VALUES (1,1,37,'Gyakorolni a const és let közti különbséget.');
CREATE TABLE favorites (id INTEGER PRIMARY KEY, user_id INTEGER, lesson_id INTEGER);
INSERT INTO favorites VALUES (1,1,37),(2,1,90),(3,2,1);
CREATE TABLE progress (id INTEGER PRIMARY KEY, user_id INTEGER, lesson_id INTEGER, completed_at TEXT);
INSERT INTO progress VALUES (1,1,1,'2026-10-01 12:00:00'),(2,1,37,'2026-10-03 13:00:00'),(3,2,1,NULL);
CREATE TABLE payments (id INTEGER PRIMARY KEY, user_id INTEGER, amount REAL, created_at TEXT);
INSERT INTO payments VALUES (1,1,2490,'2026-09-01 10:00:00'),(2,1,2490,'2026-10-01 10:00:00'),(3,2,1990,'2026-10-02 10:00:00');
CREATE TABLE newsletter_subscribers (id INTEGER PRIMARY KEY, email TEXT);
INSERT INTO newsletter_subscribers VALUES (1,'anna@example.com'),(2,'newsletter@example.com');
CREATE TABLE tags (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE);
CREATE TABLE settings (`key` TEXT PRIMARY KEY, `value` TEXT);
CREATE TABLE accounts (id INTEGER PRIMARY KEY, balance REAL);
INSERT INTO accounts VALUES (1,5000),(2,1500);
SQL;
    }
}
