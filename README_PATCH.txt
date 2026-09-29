GETINGO - EMAIL MEGEROSITES + GDPR FIOK TORLES PATCH

A patchot a jelenlegi getingo_api projekt gyokerebe kell ramásolni.
A production .env fajlt NEM tartalmazza es NEM szabad felulirni.

Helyi teszteleshez:
FRONTEND_URL=http://localhost:4200
MAIL_MAILER=log

Elesben:
FRONTEND_URL=https://getingo.hu
MAIL_MAILER=smtp
MAIL_* ertekeket a valasztott levelezesi szolgaltato adatai szerint kell beallitani.
MAIL_FROM_ADDRESS peldaul noreply@getingo.hu lehet, ha ez a postalada/cim engedelyezett a szolgaltatonal.

Az email_verified_at oszlop mar a projekt eredeti users migraciojaban benne van, ezert ehhez nincs uj adatbazis-migracio.
A regi, meg nem megerositett fiokok megerositetlenek maradnak, es a kovetkezo belepes utan meg kell erositeniuk az email cimuket.
