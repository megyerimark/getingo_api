# Getingo backend – security / GDPR setup

A projektben az alkalmazás-szintű biztonsági javítások már benne vannak. A fájlok bemásolása után az alábbi lépések szükségesek.

## 1. Fejlesztői adatbázis

A korábbi migrationök között hibás sémák voltak, ezért ha még nincs megőrzendő adatod, a legegyszerűbb:

```bash
php artisan migrate:fresh --seed
```

**Ez minden jelenlegi adatot töröl.** Ha már van megőrzendő production adatbázisod, ne használd a `migrate:fresh` parancsot; készíts mentést és külön adat-migrációval vezesd át a sémát.

## 2. Admin létrehozása

Nincs többé hardcode-olt admin jelszó. Admin létrehozása:

```bash
php artisan getingo:create-admin admin@example.com --name="Administrator"
```

A parancs rejtve kéri be a jelszót. Minimum 12 karakter, kis- és nagybetű, valamint szám szükséges.

## 3. Production környezet

A `.env.production.example` csak minta. Másold `.env`-be és cseréld ki az összes `CHANGE_ME` és `example.com` értéket.

Kötelező production alapok:

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.sajatdomain.hu

CACHE_STORE=redis
RATE_LIMITER_STORE=redis
SESSION_DRIVER=redis
SESSION_ENCRYPT=true
SESSION_SECURE_COOKIE=true

DB_CONNECTION=pgsql
SANCTUM_EXPIRATION=1440
```

A Redishez Redis szerver és a PHP Redis extension szükséges. Ha nincs Redis, a backend működik database cache-sel is, de nagy terhelés elleni védelemhez Redis ajánlott.

## 4. Reverse proxy / DDoS

Laravel önmagában nem képes volumetrikus DDoS támadást megállítani. Productionben ajánlott:

```text
Internet
  -> CDN / WAF / DDoS védelem
  -> Nginx
  -> Laravel / PHP-FPM
  -> Redis
  -> PostgreSQL vagy MySQL
```

A `deploy/` mappában Nginx minta található. A CDN/WAF oldalon külön rate limit javasolt legalább:

- `/api/bejelentkezes`
- `/api/regisztracio`
- `/api/search`
- `/api/quizzes/*`

Az origin szervert lehetőleg csak a CDN/reverse proxy felől engedd elérni. Ne állítsd a `TRUSTED_PROXIES=*` értéket olyan szerveren, amely közvetlenül is elérhető az internetről.

## 5. Laravel scheduler

A lejárt Sanctum tokenek és a régi admin audit logok automatikus törléséhez a schedulernek futnia kell. Cron példa:

```cron
* * * * * cd /var/www/getingo && php artisan schedule:run >> /dev/null 2>&1
```

Az audit log alapértelmezett retention ideje 90 nap:

```env
AUDIT_LOG_RETENTION_DAYS=90
```

## 6. GDPR végpontok

Bejelentkezett felhasználónak:

```text
GET    /api/gdpr/export
DELETE /api/gdpr/delete-account
PATCH  /api/account
PUT    /api/account/password
```

A fióktörléshez a request body:

```json
{
  "password": "a-jelenlegi-jelszo"
}
```

Az export JSON formátumban adja vissza a felhasználó account-, note-, favorite-, lesson progress- és quiz completion adatait.

A GDPR megfelelőséghez a kódon kívül továbbra is szükséges adatkezelési tájékoztató, jogalapok meghatározása, adatmegőrzési szabályzat, adatfeldolgozói szerződések, backup-retention és incidenskezelési folyamat.

## 7. Angular / bearer token

A jelenlegi backend kompatibilis a már használt `Authorization: Bearer <token>` megoldással. A tokenek 24 óra után lejárnak, és új login esetén a régi bearer tokenek visszavonásra kerülnek.

A frontendnek minden védett kérésnél ezt kell küldenie:

```http
Authorization: Bearer <access_token>
Accept: application/json
```

Hosszabb távon first-party Angular SPA esetén érdemes Sanctum HttpOnly session-cookie authra átállni; ehhez a frontend CSRF/login folyamatát is együtt kell módosítani. A mostani backend ezt nem kényszeríti ki, így a jelenlegi Angular kód nem törik el.

## 8. Tesztelés

```bash
php artisan test
php artisan route:list
```

A `tests/Feature/SecurityHardeningTest.php` ellenőrzi többek között:

- tiltott user nem léphet be;
- student nem érheti el az admin API-t;
- más felhasználó jegyzete nem olvasható;
- publikus keresés nem szivárogtat projektmegoldást;
- GDPR fióktörlés törli a kapcsolódó jegyzetet is.

## 9. Még infrastruktúra / termék szinten szükséges

A következőket nem lehet kizárólag ezzel a backend ZIP-pel teljesen megoldani:

- CDN/WAF/DDoS szolgáltatás beállítása;
- TLS tanúsítvány és webszerver konfiguráció;
- admin MFA / passkey UI és enrollment folyamat;
- email verificationhez működő mail provider és frontend flow;
- titokkezelés (hosting secret manager / environment variables);
- monitoring és riasztások;
- rendszeres backup + restore próba;
- adatkezelési dokumentáció és szervezeti GDPR folyamatok.
