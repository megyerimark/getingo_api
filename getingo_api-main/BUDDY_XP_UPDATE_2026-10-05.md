# Getingo Buddy + XP frissítés – 2026-10-05

Ez a csomag a felhasználó által feltöltött aktuális `getingo_ang-main (5)` projektre épül.

## Új Buddy modellek

A régi cica / kiskutya képi Buddy-k helyett 5 valódi helyi GLB modell került a projektbe:

- Getingo Egér – ingyenes
- Getingo Lajhár – Premium
- Noel Rénszarvas – Premium
- Getingo Cápa – Premium
- Kis Sárkány – Premium

A GLB fájlok a `public/models/getingo-buddies/` mappában vannak. A Buddy-választóhoz saját, a GLB-kből renderelt PNG előnézetek készültek a `public/mascots/` mappába.

A 3D nézet mindig a kiválasztott Buddy saját GLB fájlját tölti be. A dashboard gyors nézete ugyanennek a Buddynak a renderelt előnézetét használja.

## XP és Buddy szintezés

A tananyag jelenlegi mérete:

- 451 lecke
- 1353 kvízkérdés
- 10 XP / újonnan teljesített lecke
- 5 XP / első helyes kvízteljesítés

A teljes törzstananyag XP-je:

`451 × 10 + 1353 × 5 = 11275 XP`

A Buddy 1–100 szintű görbéje most ehhez a 11275 tanulási XP-hez igazodik. A 100. szint a teljes 451 lecke + 1353 kvíz teljesítésével érhető el. A görbe az elején gyorsabb visszajelzést ad, később fokozatosan nehezedik.

A Buddy szintjét csak a lecke- és kvízteljesítésekből származó tanulási XP növeli. Projektjutalom és gondozási pont nem tudja idő előtt kimaxolni a Buddy szintjét.

## Konfiguráció

A backend új `config/gamification.php` fájlt kapott. Az alapértékek szükség esetén `.env`-ből felülírhatók:

```env
GAMIFICATION_TOTAL_LESSONS=451
GAMIFICATION_TOTAL_QUIZZES=1353
GAMIFICATION_LESSON_XP=10
GAMIFICATION_QUIZ_XP=5
```

## Régi Buddy választások

A régi skin kulcsok automatikusan átfordulnak az új rendszerre, ezért külön adatbázis-migráció nem szükséges.
