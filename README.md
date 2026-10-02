# Getingo API

A Getingo Laravel 13 REST API-ja. Az Angular kliens külön projektben (`getingo_ang`) található; ez a repository kizárólag a backendhez tartozó Laravel kódot tartalmazza.

## Követelmények

- PHP 8.3+
- Composer
- a választott adatbázis (az alap `.env.example` SQLite-tal indul)
- Node.js + npm csak akkor szükséges, ha a Laravel Vite asseteket is buildelni szeretnéd

## Helyi indítás

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan serve
```

Az Angular fejlesztői kliens alapértelmezett címe `http://localhost:4200`, a Laravel API-é `http://localhost:8000`. A Sanctum/CORS beállításokat az `.env.example` tartalmazza.

## Tesztek

```bash
php artisan test
```

## Laravel Vite assetek

```bash
npm install
npm run build
```

## Fontos

- Valódi titkokat ne commitolj; az `.env` fájl gitignore alatt van.
- A `public/storage` symlinket ne másold másik gépről: minden környezetben a `php artisan storage:link` hozza létre.
- Éles telepítés előtt nézd át az `.env.production.example` és `SECURITY_SETUP.md` fájlokat.
