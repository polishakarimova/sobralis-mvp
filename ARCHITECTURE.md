# Sobralis MVP Architecture

Sobralis is a Next.js MVP with a typed frontend, Prisma models, PostgreSQL storage, Telegram auth, and S3-compatible storage for uploaded event images.

## `/data`

Static seed/demo data used by the UI and Prisma seed:

- `scenarios.ts` contains event scenarios.
- `places.ts` contains demo places, pricing rules, add-ons, and availability metadata.
- `demoParticipants.ts` contains demo participants and waitlist examples.

## `/lib`

Shared runtime logic:

- `pricing.ts`, `dates.ts`, `addons.ts`, `availability.ts`, and `eventStage.ts` contain pure product helpers.
- `prisma.ts` exposes the Prisma client.
- `session.ts` signs and verifies the app session cookie.
- `telegram.ts` handles Telegram API calls and Mini App signature checks.
- `waitlist.ts` owns waitlist invite, accept, and skip logic.
- `storage.ts` uploads event images to S3-compatible object storage.

## `/components`

Reusable UI blocks for the MVP screens. The current main experience is assembled from `app/page.tsx`; older component files remain as frontend building blocks.

## `/types`

Shared TypeScript types for places, scenarios, events, participants, payments, users, roles, and statuses.

## `/prisma`

Database schema, migrations, and seed script for PostgreSQL. Event cover images are stored as URL/key metadata on `Event`; the binary files live in object storage.

## `/app/api`

Backend routes for places, events, participants, waitlist, charges, owner actions, Telegram webhook/auth, user profile, and event image upload.

## `/public/event-images`

Bundled fallback/preset images that ship with the app. User-uploaded images should not be stored here in production; they go to S3-compatible storage.
