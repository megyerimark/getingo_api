# Getingo 37-es lecke tartalmi frissítés – 2026-10-03

A csomag egy új Laravel migrációt tartalmaz:

`database/migrations/2026_10_03_160000_enrich_lesson_37_javascript_variables.php`

A migráció csak akkor módosít adatot, ha létezik a `37` azonosítójú lecke és annak `category_id` értéke `6`.

## Mit frissít?

- részletes, strukturált JavaScript-változók tananyag;
- `let`, `const`, `var` magyarázat;
- deklaráció és értékadás;
- elnevezési szabályok;
- alapvető adattípusok és `typeof`;
- dinamikus típusosság;
- értékmódosítás;
- blokkhatókör;
- gyakori hibák;
- mini feladat és összefoglalás;
- HTML/CSS/JavaScript interaktív mintakód;
- 6 ellenőrző kvízkérdés.

A meglévő kvízrekordok ID-ját az első hat kérdésnél lehetőség szerint megtartja, így a korábbi teljesítések nem vesznek el szükségtelenül.

## Éles szerveren

A normál backend frissítés után futtasd:

```bash
php artisan migrate --force
php artisan optimize:clear
```

A migráció egyszer fut le, ezért nem duplikálja újra a tartalmat minden deploy során.
