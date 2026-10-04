# Getingo password reset javítás

Új publikus API endpointok:

- `POST /api/password/forgot`
- `POST /api/password/reset`

A jelszó-visszaállító email az Angular `FRONTEND_URL/reset-password` oldalára mutat.
A forgot endpoint ugyanazt a választ adja létező és nem létező emailre is.

Frontend Auth service endpointok:

- `${apiUrl}/password/forgot`
- `${apiUrl}/password/reset`

Ellenőrzés:

```bash
php artisan optimize:clear
php artisan route:list --path=password
php artisan test --filter=PasswordResetTest
php artisan test
```
