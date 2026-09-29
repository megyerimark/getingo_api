# Getingo API – Buddy + Security patch

Ez a csomag az alábbi fő bővítéseket tartalmazza:

- **Email megerősítés backend oldalon**
  - regisztráció után automatikus megerősítő email küldés
  - újraküldési végpont: `POST /api/email/verification-notification`
  - megerősítő végpont: `GET /api/email/verify/{id}/{hash}`
- **Getingo Buddy backend**
  - `user_companions` tábla
  - XP → gondozási pontok
  - állapot, növekedés, hangulat, akciók
- **GDPR / biztonság**
  - saját fiók törlése megmaradt
  - email módosítás után új megerősítés szükséges
  - meglévő throttle / auth réteg megtartva

## Teendők telepítés után

```bash
php artisan migrate
php artisan config:clear
php artisan cache:clear
```

## Fontos `.env` mezők

```env
APP_URL=https://getingo.hu
FRONTEND_URL=https://getingo.hu
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SESSION_DOMAIN=.getingo.hu
SANCTUM_STATEFUL_DOMAINS=getingo.hu,www.getingo.hu
```

Mail példa:

```env
MAIL_MAILER=smtp
MAIL_HOST=mail.getingo.hu
MAIL_PORT=465
MAIL_ENCRYPTION=ssl
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM_ADDRESS=...
MAIL_FROM_NAME="Getingo"
```
