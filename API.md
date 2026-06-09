# Sobralis MVP API

All API responses use this shape:

```json
{ "ok": true, "data": {} }
```

Errors use `ok: false` with status `400`, `401`, `403`, `404`, `409`, or `500`.

## Places

`GET /api/places`

Returns all places with `includes`, pre-event `addOns`, and `onSiteAddOns`.

`GET /api/places/{id}`

Returns one place with the same related data.

## Events

`GET /api/events`

Returns events. If the user has a session cookie, returns that user's organized events. `organizerId` is still accepted for compatibility with the current frontend.

`GET /api/events/{id}`

Returns an event with place, participants, waitlist, charges, booking requests, and selected add-ons.

`POST /api/events`

Creates an event and an initial pending booking request.

```json
{
  "title": "Breakfast club",
  "placeId": "custom-place",
  "date": "2026-06-14",
  "startTime": "10:00",
  "endTime": "12:00",
  "guestsLimit": 10,
  "minGuests": 1,
  "targetBudget": 0,
  "joinDeadline": "2026-06-14",
  "paymentDeadline": "2026-06-14",
  "paymentMode": "none",
  "coverImageUrl": "https://cdn.example.com/event-images/u1/image.webp",
  "coverImageKey": "event-images/u1/image.webp",
  "coverImageSource": "upload",
  "coverImagePositionX": 50,
  "coverImagePositionY": 50
}
```

`PUT /api/events/{id}`

Updates an event. Requires the event organizer session or `ADMIN_TOKEN`.

```json
{
  "title": "Женский завтрак",
  "venue": "Кафе у моря",
  "date": "2026-06-14",
  "startTime": "10:00",
  "guestsLimit": 12
}
```

`DELETE /api/events/{id}`

Deletes an event. Requires the event organizer session or `ADMIN_TOKEN`.

`POST /api/events/{id}/join`

Adds a participant. If the event is full or an active waitlist has priority, creates a waitlist entry instead.

```json
{ "name": "Anna", "status": "joined", "comment": "Window seat, please" }
```

`POST /api/events/{id}/waitlist`

Adds a person to the waitlist.

```json
{ "name": "Nika" }
```

`POST /api/events/{id}/fix-composition`

Sets event status to `composition_fixed` after the minimum participant target is reached.

`POST /api/events/{id}/open-payments`

Opens payments only when the place is confirmed, minimum participants are reached, and composition is fixed.

```json
{ "ok": true, "data": { "event": {}, "simulatedNotifications": true } }
```

`POST /api/events/{id}/participants/{participantId}/cancel`

Cancels a participant and invites the next waitlist entry when a place becomes available.

## Waitlist

`POST /api/waitlist/{id}/accept`

Accepts an invited waitlist entry for the matching Telegram user and creates a participant.

`POST /api/waitlist/{id}/skip`

Skips an invited waitlist entry and invites the next person.

## Uploads

`POST /api/uploads/event-image`

Uploads an event cover image to S3-compatible storage. Requires Telegram session cookie.

Request type: `multipart/form-data`

Field: `file`

Allowed types: `image/jpeg`, `image/png`, `image/webp`

Maximum size: 8 MB

```json
{ "ok": true, "data": { "url": "https://cdn.example.com/event-images/u1/image.webp", "key": "event-images/u1/image.webp" } }
```

## Charges

`POST /api/charges/{id}/mark-paid`

Marks a charge as paid by participant. No real payment is processed.

## Owner Actions

`POST /api/owner/booking-requests/{id}/reply`

Owner replies to a booking request.

```json
{ "status": "confirmed" }
```

Allowed statuses: `confirmed`, `busy`, `another_time`.

`POST /api/owner/charges/{id}/confirm`

Owner confirms or rejects a marked payment.

```json
{ "result": "seen" }
```

Allowed results: `seen`, `not_seen`.

## Telegram

Full setup notes: `TELEGRAM_AUTH.md`.

`POST /api/telegram/webhook`

Receives Telegram bot messages, commands, and callback buttons.

`POST /api/auth/telegram-mini-app`

Verifies Telegram Mini App `initData`, creates or updates the user, and sets the app session cookie.

## Auth

`GET /api/auth/me`

Returns the current user from the signed session cookie.

`POST /api/auth/logout`

Clears the signed session cookie.

## Admin

Admin endpoints require `ADMIN_TOKEN` in one of these ways:

- `x-admin-token: ADMIN_TOKEN`
- `Authorization: Bearer ADMIN_TOKEN`
- `/admin?token=ADMIN_TOKEN`

`GET /api/admin/users`

Returns users with Telegram data and participation counters.

`GET /api/admin/events`

Returns events with organizer, place, and counters.

`GET /api/admin/reservations`

Returns participants, waitlist entries, and booking requests.

`GET /api/admin/broadcasts`

Returns saved broadcast drafts/simulations.

`POST /api/admin/broadcasts`

Creates a broadcast draft or simulated send. Real Telegram messages are not sent yet.

```json
{
  "title": "Напоминание",
  "message": "Завтра встреча, проверьте время.",
  "target": "all_users",
  "simulateSend": true
}
```

`DELETE /api/admin/broadcasts/{id}`

Deletes a broadcast and writes an admin action.

`/admin`

Browser admin panel. Open it as `/admin?token=ADMIN_TOKEN`; the token is stored locally in the browser after first login.
