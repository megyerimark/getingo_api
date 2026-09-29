# Getingo – 100 szintes Buddy + tanulói Projektek API

Ez a verzió a feltöltött aktuális Laravel projektre épül.

## Változások

- A Buddy fejlődése 5 helyett 100 szintes.
- 10 vizuális korszakot ad vissza az API (`era-1` ... `era-10`).
- Minden szinthez progress, következő szinthez szükséges pont és méretérték tartozik.
- Az XP továbbra is tudásnövekedést ad, a gondozás külön growth pontot ad.
- Új tanulói projekt API:
  - `GET /api/projects`
  - `GET /api/projects/{project}`
- A tanulói projekt API szándékosan nem adja vissza az admin `solution` mezőt.
- Új `ProjectTest` védi ezt a viselkedést.

## Fontos

A csomag nem tartalmaz `.env` vagy `vendor` mappát. A meglévő éles `.env` fájlt ne írd felül.

Telepítés után:

```bash
composer install
php artisan optimize:clear
php artisan test
```

Ehhez a frissítéshez új adatbázis-migráció nem szükséges.
