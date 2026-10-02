# Getingo – biztonsági, Premium és süti módosítások

Dátum: 2026-10-01

## Mi változott?

## Stabilizálás, toastok és tananyag-kezelés

- Globális `ToastService` + toast konténer készült siker, hiba, figyelmeztetés és információ visszajelzésekhez.
- Az admin CRUD műveletek, fiókkezelés, tananyag-műveletek, email-megerősítés, kijelentkezés, Buddy műveletek és Stripe indítási hibák egységes toast visszajelzést használnak.
- A tananyag JavaScript futtatójának `console.log/error/warn` kimenete szándékosan megmaradt, mert ez a tanulási funkció része.
- Email cím módosításakor a backend most valóban ellenőrzi a jelenlegi jelszót, és erre feature tesztek is készültek.
- Jelszóváltás után az aktuális böngésző-session megmarad; a frontend nem jelentkezteti ki tévesen a felhasználót.
- Az auth session-visszaállítás közös, deduplikált kérést használ, így a navbar és a route guardok nem indítanak párhuzamos, azonos `/api/user` kéréseket.
- A Project Lab `postMessage` fogadása az iframe `event.source` értékét is ellenőrzi.
- Az admin tananyagoldalon gyorsfelviteli munkafolyamat készült: kategória és fejezet megtartása, automatikus következő sorrend, címmező fókusz, új fejezet automatikus kiválasztása, keresés és szűrés a meglévő tananyagok között.
- A hibás service teszt-osztálynevek javítva, a komponens tesztekhez szükséges HTTP/router teszt providerek bekerültek.
- A Laravel API gyökeréből eltávolításra került a tévesen bemásolt Angular projekt, Angular VS Code konfiguráció és a gépspecifikus `public/storage` symlink. A Laravel `.gitignore`, `.editorconfig` és `package.json` vissza lett igazítva a Laravel 13 projektszerkezetéhez.
- A byte-ra pontos, nem használt `* 2.*` másolatok eltávolításra kerültek.


### Laravel API
- A projektellenőrzés többé nem ad XP-t pusztán a böngésző által beküldött `console_output` alapján.
- Új szerveroldali forrásellenőrzések: `html_contains`, `css_contains`, `javascript_contains`, `source_contains`.
- A régi `console_exact` / `console_contains` ellenőrzések megmaradtak tanulói visszajelzésnek, de nem igazolnak teljesítést és nem adnak XP-t.
- Az autentikált API-k megkapták a `user-api` rate limitet és a `no-store` cache-védelmet.
- Jelszócsere után adatbázis-session használatakor minden más aktív session törlődik, az aktuális session és CSRF token rotálódik.
- Tiltáskor a felhasználó tokenjei és adatbázis-sessionjei visszavonásra kerülnek; a tiltott aktív session is invalidálódik.
- Trusted Host / Trusted Proxy konfiguráció bekerült a Laravel middleware-be.
- A CORS eredetlista környezeti változóból állítható, az engedélyezett request headerek szűkítve lettek.
- Új, biztonságos `.env.production.example` minta került a projektbe.
- A Stripe Checkout nem indít új előfizetést, ha a fiókhoz már aktív vagy folyamatban lévő subscription tartozik.
- A Buddy Premium jogosultság szerveroldali: az új `Aurora Lounge` és `Cyber Deck` szobát Free fiók nem választhatja ki API-hívással sem.

### Angular
- A régi tokenes / bearer-tokenes kommentelt kód maradványai eltávolítva; az aktív auth Sanctum cookie + CSRF.
- Új süti banner és részletes süti-beállítási párbeszédablak:
  - Összes elfogadása
  - Csak szükséges
  - egyedi Analitika / Marketing választás
  - későbbi módosítás a footerből
- Új `/sutik` Süti tájékoztató oldal.
- A Premium oldal az implementált kozmetikai előnyöket mutatja: Premium UI, 2 skin, 2 Premium 3D szoba, profil badge, Project Lab megjelenés.
- A Buddy szobaválasztó szerver által küldött `unlocked` jogosultságot használ.
- A külső GitHub 3D modell-fallback eltávolítva. Ha a végleges helyi GLB hiányzik, a frontend hálózati kérés nélkül generál egy egyszerű Three.js tartalék Getingo cicát.
- A production environment `production: true`, a dokumentum nyelve `hu`.

## Fontos a projektellenőrzésről

A `*_contains` ellenőrzések szerveroldalon ellenőrzik a beküldött forráskódot, így a kliens által hamisított konzolkimenet már nem ad XP-t. Ez azonban statikus forrásellenőrzés, nem egy teljes, izolált JavaScript-futtató és nem csalásbiztos programozási bíró.

Önkényes tanulói JavaScriptet ne futtass közvetlenül a Laravel/PHP szerveren. Ha később valódi futási eredményt akarsz biztonságosan értékelni, külön izolált code-runner szolgáltatás (konténer/sandbox, CPU-, memória-, idő- és hálózati limitekkel) javasolt.

## Régi projektek átállítása

Az admin Project oldalon a korábbi `console_exact` / `console_contains` projektekhez válassz egy új ellenőrzést. Például JavaScript feladatnál:

- Típus: `javascript_contains`
- Elvárt részletek: soronként egy kötelező forrásrészlet.

A konzolos típusok továbbra is mutatnak visszajelzést, de szándékosan nem adnak XP-t.

## Production `.env`

A projektbe bekerült `.env.production.example`. Éles környezetben különösen ellenőrizd:

- `APP_ENV=production`
- `APP_DEBUG=false`
- `APP_URL=https://getingo.hu`
- `FRONTEND_URL=https://getingo.hu`
- `SESSION_SECURE_COOKIE=true`
- `SESSION_HTTP_ONLY=true`
- `SESSION_ENCRYPT=true`
- `SESSION_SAME_SITE=lax`
- helyes `SANCTUM_STATEFUL_DOMAINS`
- helyes `CORS_ALLOWED_ORIGINS`
- Stripe secret és webhook secret kizárólag `.env`-ben

A `TRUSTED_PROXIES` értéket csak a tárhelyszolgáltató által dokumentált proxy IP-kre állítsd; ne használj `*` értéket.

## Adatvédelem / sütik

A jelenlegi kódban nincs külső analytics vagy marketing integráció. A hozzájárulási beállítások elő vannak készítve arra az esetre, ha később ilyet hozzáadsz. A szükséges Laravel session, CSRF és cookie-preferencia sütik a működés/biztonság részei.

Az `Adatkezelési tájékoztató` továbbra is technikai vázlat: az adatkezelő neve, címe, kapcsolati emailje, a végleges jogalapok és megőrzési idők kitöltendők. Ezeket élesítés előtt véglegesítsd.

## Ellenőrzési állapot

- 112 Laravel/PHP fájl: `php -l` szintaktikai ellenőrzés sikeres.
- Titok/secret mintákra és aktív veszélyes frontend mintákra (`localStorage`, `eval`, `innerHTML`) újrakeresés történt; nyilvánvaló aktív találat nem maradt.
- Teljes `php artisan test` nem futott, mert a ZIP nem tartalmazott `vendor/` könyvtárat és Composer nem volt elérhető a futtatási környezetben.
- Teljes Angular production build nem futott végig, mert a függőségtelepítés a futtatási környezetben megszakadt; a módosított TypeScript/SCSS fájlokon külön szintaktikai/strukturális ellenőrzések készültek.

## Javasolt telepítés utáni ellenőrzés

Laravel:

```bash
php artisan optimize:clear
php artisan migrate --force
php artisan test
php artisan config:cache
php artisan route:cache
```

Angular:

```bash
npm ci
npm run build
```

A kész Angular `dist` kerüljön az éles frontend dokumentumgyökerébe. A Laravel `.env` fájlt ne írd felül a ZIP-ből; a valódi kulcsokat/secreteket ne tedd Gitbe.
