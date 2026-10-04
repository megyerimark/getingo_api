# Getingo – Python / C# / SQL futtató + jelszó-visszaállítás

## Mi készült el?

- HTML/CSS/JavaScript: továbbra is kliensoldali, sandboxolt iframe-ben fut.
- Python: távoli sandboxban fut.
- C#: távoli sandboxban fut; elsődlegesen OneCompilerre állítható, opcionálisan saját Pistonra. A pontos C#/.NET verziót mindig a választott futtató határozza meg.
- SQL: izolált gyakorló adatbázison fut; OneCompiler használatakor MySQL, Judge0 tartaléknál SQLite.
- A távoli futtató soha nem kap hozzáférést a Getingo éles `c106467getingo` adatbázisához.
- `stdin` támogatás Python és C# programokhoz.
- Futási státusz, runtime, idő, memória és hibaüzenet megjelenítés.
- Saját kód mentése Python/C#/SQL leckékhez is.
- Bejelentkezésnél „Elfelejtetted a jelszavad?” link, reset email és új jelszó beállítása.

## Ajánlott production beállítás

A Rackhost Laravel `.env` fájlban:

```env
FRONTEND_URL=https://getingo.hu

CODE_RUNNER_PYTHON_PROVIDER=judge0
CODE_RUNNER_CSHARP_PROVIDER=onecompiler
CODE_RUNNER_SQL_PROVIDER=onecompiler
CODE_RUNNER_FALLBACK_PROVIDER=judge0

JUDGE0_URL=https://ce.judge0.com
JUDGE0_AUTH_TOKEN=

ONECOMPILER_URL=https://api.onecompiler.com/v1
ONECOMPILER_API_KEY=IDE_KERUL_A_KULCS
```

Ha nincs OneCompiler API kulcs, a rendszer automatikusan a Judge0 tartalékra esik vissza. Ekkor C# alatt régebbi Mono runtime, SQL alatt SQLite futhat.

## Saját Piston használata

Ha később VPS-en saját Piston sandboxot futtatsz és telepítesz modern C#/.NET runtime-ot:

```env
CODE_RUNNER_CSHARP_PROVIDER=piston
PISTON_URL=https://runner.sajatdomain.hu/api/v2
PISTON_AUTH_HEADER=Authorization
PISTON_AUTH_TOKEN=
```

A Laravel a Piston `/runtimes` végpontjából automatikusan megkeresi a legújabb telepített kompatibilis runtime-ot.

## Jelszó-visszaállítás

Backend végpontok:

- `POST /api/password/forgot`
- `POST /api/password/reset`

Frontend:

- `/forgot-password`
- `/reset-password`

A reset levél működéséhez production SMTP szükséges. `MAIL_MAILER=log` esetén a levél nem kerül valódi postaládába.

## Telepítés után

Backend:

```bash
php artisan optimize:clear
php artisan migrate --force
php artisan route:list --path=code
php artisan route:list --path=password
php artisan test
```

Frontend:

```bash
npm install
npm run build
```

Helyi indítás:

```bash
ng serve --proxy-config proxy.conf.json
```

## Biztonság

A felhasználói Python/C#/SQL kód nem a Laravel/Rackhost szerveren fut közvetlenül. A `/api/code/run` rate limitált. A bemenet és a kód mérete korlátozott, a kimenet rövidítve van. SQL esetén minden futtatás izolált gyakorló adatokkal történik.
