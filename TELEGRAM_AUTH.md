# Telegram Auth For Sobralis

В «Собрались» Telegram используется без паролей, SMS и отдельных логинов. Есть два входа:

- Telegram Mini App: приложение открыто внутри Telegram и сервер проверяет `window.Telegram.WebApp.initData`.
- Telegram bot login token: сайт создаёт одноразовый token, пользователь подтверждает вход кнопкой в боте, сайт получает HMAC session cookie.

## Env

Локально и на сервере нужны переменные:

```env
TELEGRAM_BOT_TOKEN="123456:telegram-bot-token"
TELEGRAM_WEBHOOK_SECRET="long-random-secret"
TELEGRAM_BOT_USERNAME="sobraliss_bot"
TELEGRAM_API_TIMEOUT_MS="1500"
TELEGRAM_API_BASE="https://api.telegram.org"
APP_URL="https://sobralisy.ru"
ADMIN_TELEGRAM_IDS=""
```

`TELEGRAM_WEBHOOK_SECRET` должен быть длинной случайной строкой. Он передаётся Telegram при `setWebhook`, а webhook route проверяет его через заголовок `x-telegram-bot-api-secret-token`.

`TELEGRAM_API_BASE` можно заменить на proxy/base URL, если VPS не может напрямую подключаться к `api.telegram.org`. `TELEGRAM_API_TIMEOUT_MS` держит исходящие Telegram-запросы короткими, чтобы приложение не зависало при сетевых проблемах.

## Prisma Models

Авторизация использует модели:

- `User`
- `AuthIdentity`
- `TelegramAccount`
- `TelegramLoginRequest`

`User.telegramId` уникальный. При первом входе пользователь создаётся, при следующих входах Telegram-данные обновляются без дублей.

## Mini App Auth

Frontend внутри Telegram вызывает:

```ts
window.Telegram.WebApp.ready();
window.Telegram.WebApp.expand();
window.Telegram.WebApp.initData;
```

Затем отправляет:

```http
POST /api/auth/telegram-mini-app
Content-Type: application/json

{ "initData": "..." }
```

Сервер проверяет подпись Telegram `initData`, создаёт/обновляет пользователя и ставит HMAC session cookie.

## Bot Login Token Auth

Для входа из браузера:

```http
POST /api/auth/telegram-login/start
Content-Type: application/json

{ "returnTo": "/profile/events" }
```

Сервер создаёт `TelegramLoginRequest` и возвращает:

```json
{
  "token": "...",
  "botUrl": "https://t.me/sobraliss_bot?start=login_..."
}
```

Пользователь открывает бота, нажимает «Авторизоваться». Webhook связывает token с Telegram-пользователем. Браузер опрашивает:

```http
GET /api/auth/telegram-login/status?token=...
```

После подтверждения сервер ставит HMAC session cookie и протухляет token, чтобы им нельзя было войти повторно.

## Session

Cookie:

- `sobralis_session`
- httpOnly
- HMAC-подпись через серверный secret
- срок 30 дней

Проверка текущего пользователя:

```http
GET /api/auth/me
```

Выход:

```http
POST /api/auth/logout
```

## Webhook

Route:

```http
POST /api/telegram/webhook
```

Webhook принимает:

- `/start`
- `/help`
- `/events`
- `callback_query`
- login confirmation callbacks
- waitlist accept/skip callbacks

## BotFather

В BotFather нужно:

1. `/setdomain`
2. выбрать бота
3. указать домен без протокола:

```text
sobralisy.ru
```

## setWebhook

Самый простой вариант из проекта:

```bash
npm run telegram:webhook
```

Скрипт читает `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET` и `APP_URL` из `.env`, ставит webhook на `APP_URL/api/telegram/webhook` и не выводит секреты.

Проверить, что route принимает webhook с правильным secret:

```bash
npm run telegram:webhook:check
```

Ручной вариант PowerShell:

PowerShell:

```powershell
$env:TELEGRAM_BOT_TOKEN="123456:telegram-bot-token"
$env:TELEGRAM_WEBHOOK_SECRET="long-random-secret"

$body = @{
  url = "https://sobralisy.ru/api/telegram/webhook"
  secret_token = $env:TELEGRAM_WEBHOOK_SECRET
  allowed_updates = @("message", "callback_query")
} | ConvertTo-Json

Invoke-RestMethod `
  -Method Post `
  -Uri "https://api.telegram.org/bot$env:TELEGRAM_BOT_TOKEN/setWebhook" `
  -ContentType "application/json" `
  -Body $body
```

Проверка:

```powershell
Invoke-RestMethod "https://api.telegram.org/bot$env:TELEGRAM_BOT_TOKEN/getWebhookInfo"
```

## Menu Button

После env можно настроить голубую кнопку меню бота:

```bash
npm run telegram:menu
```

Она открывает `APP_URL/app`.
