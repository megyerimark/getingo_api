# Getingo Angular – 3D Buddy + Projektek + dashboard fióktörlés

Ez a verzió a feltöltött aktuális Angular projektre épül.

## Változások

- Új 3D Pixel cica asset: `public/buddy-cat-3d.png`.
- Pixel 1–100 szint között fokozatosan nagyobb lesz.
- 10 vizuális korszak: magasabb szinteken több glow/holografikus elem jelenik meg.
- A cica nem folyamatosan lebeg: a 3D képen saját talapzata van, csak gondozáskor kap rövid animációt.
- Új `/projects` tanulói projektlista.
- Új `/projects/:id` projekt részletező.
- Saját projektvázlat helyi böngészős mentéssel; nem kerül a szerverre.
- A keresési projekt-találatok megnyithatók.
- A dashboardon külön Projektek CTA.
- A dashboardon közvetlen fióktörlési panel jelszó + visszavonhatatlanság megerősítéssel.

## Helyi ellenőrzés

```bash
npm install
npm run build
ng serve --proxy-config proxy.conf.json
```
