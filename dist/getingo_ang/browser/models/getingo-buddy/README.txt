GETINGO BUDDY – VÉGLEGES 3D MODELL HELYE
========================================

A frontend automatikusan ezt a fájlt tölti:

/public/models/getingo-buddy/getingo-buddy.glb

Tedd ide a végleges, riggelt Getingo cicát pontosan ezen a néven:

getingo-buddy.glb

Ha a fájl még nincs itt, a fejlesztői rendszer egy internetes, CC BY 4.0 licencű
riggelt demo macskamodellt próbál betölteni. Ez csak technikai fallback, NEM a
végleges Getingo karakter.

A célkarakter vizuális referenciája:
reference-character-sheet.png

AJÁNLOTT MODELL SPECIFIKÁCIÓ
----------------------------
- GLB / glTF 2.0
- riggelt csontváz
- PBR textúrák
- lehetőleg 5–12 MB alatt optimalizálva
- 20k–80k triangle körül desktop + mobil kompromisszumként
- egyetlen beágyazott GLB a legegyszerűbb deployhoz
- középre igazított pivot
- talp/paw síkja közel Y=0

AJÁNLOTT ANIMÁCIÓNEVEK
----------------------
Idle / Sit / Breathing
Happy / Purr
Eat
Drink
Play / Pounce
Jump
Sleep / Rest
Wave
Walk
Run

A Getingo kód név alapján automatikusan megkeresi ezeket. Ha a 3D modellben más
nevek vannak, a rendszer akkor is elindul, és a hiányzó mozgásokhoz procedurális
reakciókat használ.

MORPH TARGETOK – opcionális, de nagyon ajánlott
----------------------------------------------
Blink / EyeClose
Smile
MouthOpen

A Blink/EyeClose automatikusan felismerhető és valódi pislogást ad.

CSONTNEVEK – ajánlott
--------------------
Head vagy Neck
Tail
Ear_L / LeftEar
Ear_R / RightEar

Ezekkel működik a fej egérkövetése, farokmozgás és fülrezdülés az animációkon felül.
