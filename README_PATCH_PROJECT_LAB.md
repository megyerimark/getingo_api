# Getingo Project Lab

A tanulói projekt oldal most HTML/CSS/JavaScript szerkesztőt, sandboxolt böngészős futtatást, konzolkimenetet, szerveroldali mentést és automatikus kimenet-ellenőrzést kapott.

## Admin projekt mezők

- `starter_html`, `starter_css`, `starter_javascript`: kezdőkódok.
- `validation_type`: `console_exact` vagy `console_contains`.
- `expected_output`: a várt konzolkimenet, soronként egy érték. Tanulói API nem küldi le.
- `xp_reward`: egyszeri XP jutalom sikeres teljesítésért.
- `solution`: továbbra is csak admin oldalon látható mintamegoldás.

A Laravel szerver nem futtat felhasználói JavaScriptet. A kód kizárólag sandboxolt iframe-ben fut a böngészőben; a szerver csak a visszaküldött konzolkimenetet hasonlítja össze az admin által megadott elvárással.
