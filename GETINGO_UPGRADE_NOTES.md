# Getingo stabilizáló frissítés – 2026-10-03

Ez a csomag a 2026-10-03-án átadott Angular és Laravel forrásokra épül. A cél a meglévő termék stabilizálása és egységesítése volt, nem újabb nagy funkcióhalmaz hozzáadása.

## Elkészült

### 1. Design system és dark mode
- Új szemantikus téma-tokenek: felületek, szövegek, borderek, accent és státuszszínek.
- A login/regisztráció közös auth-stílust kapott.
- A privacy, cookie, email-verifikációs és több kulcsoldal komponensszintű fix világos színei tokenekre lettek átvezetve.
- A cookie beállító modal dark módban is a közös tokeneket használja.
- A téma választásához használt `getingo_theme` localStorage bejegyzés bekerült a tájékoztatóba.
- A régi globális dark-mode override-ok egy része kompatibilitási rétegként megmaradt, hogy a még nem teljesen tokenizált régebbi komponensek ne regresszáljanak. Új stílusban már ne adj hozzá új V7/V8 jellegű globális override-blokkot: a `src/styles/_theme-tokens.scss` változóit használd.

### 2. Elfelejtett jelszó / jelszó-visszaállítás
Backend:
- `POST /api/password/forgot`
- `POST /api/password/reset`
- Laravel Password Broker alapú tokenek.
- 12 karakteres, kis- és nagybetűt, valamint számot megkövetelő új jelszó.
- Sikeres reset után remember token forgatás és database sessionök törlése.
- Külön password-reset rate limiter.
- Az email-fiók létezése nem derül ki a válaszból.
- Magyar reset email és frontend reset URL.
- Feature tesztek a kérésre, sikeres resetre és hibás tokenre.

Frontend:
- `/forgot-password`
- `/reset-password`
- Login oldalon „Elfelejtetted a jelszavad?” link.
- Kliensoldali jelszóvalidáció és rate-limit/lejárt-link hibakezelés.
- Auth service tesztek + oldal-logika tesztek.

### 3. Frontend tesztelés és típusosság
- Auth service viselkedési HTTP tesztek.
- Auth guard tesztek.
- Login viselkedési tesztek.
- Forgot/reset password tesztek.
- Project Runner tesztek.
- Buddy Scene Factory tesztek.
- Az `AdminService` válaszai típusosak.
- Közös, `unknown`-biztos API hibakezelő utility készült.
- A `src/app` alatt az explicit `any` használatok száma 0-ra csökkent.

### 4. Project Lab hardening
- A konzol-alapú JavaScript feladatok külön Web Workerben futnak.
- 1500 ms futási limit, utána a Worker leáll.
- Konzolkimenet méret- és sorszámkorlát.
- Workerben hálózati API-k tiltása (`fetch`, `WebSocket`, `EventSource`, `importScripts`).
- Nyilvánvaló végtelen ciklusok felismerése (`while(true)`, `while(1)`, `for(;;)`).
- Preview CSP tiltja a hálózatot, frame-eket, objektumokat, form submitot és base URL-t.
- A futtató script nonce-alapú CSP-t kapott, így a HTML mezőbe tett saját `<script>` nem fut automatikusan.
- A statikus preview teljesen `script-src 'none'` módban készül.
- A `postMessage` továbbra is token + `event.source` + project ID ellenőrzést használ.

Megjegyzés: DOM-ot használó tetszőleges JavaScriptet böngészőn belül nem lehet ugyanúgy megszakítható Workerbe tenni, mert a Workernek nincs DOM-hozzáférése. A nyilvánvaló végtelen ciklusok ezért blokkolva vannak, de egy későbbi, teljesen izolált távoli runner ennél is erősebb védelmet adhat.

### 5. Nagy frontend fájlok szétválasztása
- A Project Lab futtató logika külön `ProjectRunnerService`-be került.
- A Buddy procedurális modell-, szoba- és prop-építése külön `BuddySceneFactory` service-be került.
- A `buddy-3d.ts` mérete kb. 860 sorról kb. 680 sorra csökkent.
- A közös auth UI stílus külön SCSS modulba került.

### 6. SEO és 404
- Valódi 404 oldal készült; a wildcard route már nem dob vissza automatikusan a főoldalra.
- Saját `SeoTitleStrategy` kezeli a title, description, robots és Open Graph tageket.
- A publikus fő oldalak saját title/description adatot kaptak.
- A fiók-, admin-, reset- és más privát útvonalak kliensoldali `noindex` jelölést kapnak.
- Az `index.html` kapott alap SEO/meta/OG adatokat.

Megjegyzés: teljes SSR/prerender nem került bekapcsolásra, mert az `@angular/ssr` új dependency és deployment-változás lenne, a jelenlegi környezet pedig nem tudta elérni az npm registryt. A mostani frissítés nem módosította kockázatosan a package-lockot.

### 7. Adatkezelés és sütik
- Az adatkezelési tájékoztató a projekt tényleges adatfolyamaihoz lett igazítva: fiók, tanulási adatok, projektek, Buddy, Stripe/Premium, audit/biztonság, export és törlés.
- Érintetti jogok és NAIH panaszlehetőség bekerült.
- A süti tájékoztató a Laravel session, XSRF, cookie preference és a téma localStorage használatát is leírja.
- A publikus jogi oldalak dark-mode kompatibilisek.

## Közzététel előtt kötelezően kitöltendő jogi adatok
A forráskódból nem lehet hitelesen megállapítani, ezért nem lett kitalálva:
1. az adatkezelő/üzemeltető pontos jogi neve,
2. postai címe,
3. adatvédelmi kapcsolati email címe.

Ezeket a `src/app/pages/privacy/privacy.html` 1. pontjában a valós adatokkal kell megadni, majd érdemes a végleges szöveget adatvédelmi/jogi szempontból is ellenőriztetni.

## Buddy 3D asset
A ZIP-ben továbbra sincs végleges riggelt `getingo-buddy.glb`. A komponens most nem próbál meg egy nem létező fájlt letölteni: alapból a saját procedurális 3D Buddy töltődik be. Ha később elkészül a végleges GLB, állítsd a `modelUrl` inputot például erre:

`/models/getingo-buddy/getingo-buddy.glb`

A komponens már képes animáció-clipek automatikus keresésére többek között idle/happy/eat/drink/play/sleep jellegű nevekkel.

## Élesítés előtt

### Laravel API
1. Ellenőrizd az éles `.env` értékeket: `APP_URL`, `FRONTEND_URL`, session/cookie domain és HTTPS beállítások.
2. A password reset emailhez valós SMTP/levelező beállítás kell (`MAIL_MAILER`, `MAIL_HOST`, `MAIL_PORT`, `MAIL_USERNAME`, `MAIL_PASSWORD`, `MAIL_FROM_ADDRESS`).
3. Futtasd az éles szerveren:
   - `composer install --no-dev --optimize-autoloader --no-interaction`
   - `php artisan migrate --force`
   - `php artisan optimize:clear`
   - `php artisan config:cache`
   - `php artisan route:cache`
4. Ellenőrizd, hogy a queue/mail stratégia megfelel az éles környezetnek.

A `password_reset_tokens` tábla már szerepel az alap Laravel users migrationben, ezért ehhez a frissítéshez külön új migration nem kellett.

### Angular
1. `npm ci`
2. `npm test -- --watch=false`
3. `npm run build`
4. A production build kimenetét töltsd fel a frontend tárhelyre.
5. Élesben teszteld: light/dark váltás, login, regisztráció, email verification, forgot/reset password, dashboard, Project Lab, Premium, cookie modal, privacy/cookies és 404.

## Ellenőrzések ebben a munkakörnyezetben
- PHP lint: 132 PHP fájl, 0 szintaktikai hiba.
- TypeScript parser scan: 126 TS fájl, 0 szintaktikai hiba.
- Explicit `any` a `src/app` alatt: 0.
- A teljes Angular build/test nem futott végig, mert az npm registry DNS-elérése `EAI_AGAIN` hibával meghiúsult, és a csomagok nem voltak előre telepítve.
- A Laravel PHPUnit suite nem futott, mert a csomagban nincs `vendor/`, és ebben a környezetben nincs Composer executable. A PHP forrás teljes lintje ettől függetlenül sikeres.
