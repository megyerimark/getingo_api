# Getingo API stabilizálás – 2026-10-04

## Elkészült
- A kódfuttató provider-logika kikerült a controllerből `App\Services\CodeExecutionService` szolgáltatásba.
- A `/api/code/run` vendég és bejelentkezett kvótákat, valamint napi limitet kapott.
- Új `/api/health` végpont ellenőrzi az API + adatbázis alapműködését.
- Új `php artisan app:doctor` parancs ellenőrzi a projekt- és tananyagstruktúra kritikus migrációit.
- Új `deploy/production-update.sh` segít elkerülni a route/config cache és migráció eltéréseket.
- GitHub Actions CI futtatja a migrációkat, teszteket és Pint ellenőrzést.

## Éles frissítés
A backend gyökeréből:

```bash
bash deploy/production-update.sh
```

Ha a tárhelyen más PHP bináris kell:

```bash
PHP_BIN=php83 bash deploy/production-update.sh
```

Ezután ellenőrizd:
- `GET /api/health`
- `GET /api/code/capabilities`
- `php artisan route:list --path=api/code`
- A kódfuttatás provider-specifikus osztályokra vált szét (`Judge0CodeRunner`, `OneCompilerCodeRunner`, `PistonCodeRunner`), a controller csak HTTP validációt és válaszképzést végez.
- Külön SQL sandbox prelude és kimenetkorlátozás került a provider-rétegbe.

## Ellenőrzés
- 146 PHP forrás `php -l` ellenőrzése: 0 szintaktikai hiba.
- A teljes PHPUnit/Laravel suite ezen a munkakörnyezeten nem futott, mert Composer/vendor nincs telepítve; a hozzáadott CI ezt automatizálja.
