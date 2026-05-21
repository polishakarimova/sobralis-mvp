# Sobralis MVP Architecture

This project is a typed frontend-only Next.js MVP prototype.

## `/data`

Static demo data for the prototype:

- `scenarios.ts` contains event scenarios.
- `places.ts` contains demo places, pricing rules, add-ons, and availability metadata.
- `demoParticipants.ts` contains demo participants and waitlist entries.

## `/lib`

Pure helper functions and shared constants:

- `pricing.ts` calculates event pricing and exports the money formatter.
- `dates.ts` handles time, duration, and deadline checks.
- `addons.ts` resolves add-on titles and totals.
- `availability.ts` contains booking mode labels, availability labels, booking steps, and slot availability logic.
- `eventStage.ts` derives the current event lifecycle stage.

## `/components`

Reusable UI blocks for the MVP screens. Components receive data and callbacks from `app/page.tsx` and do not own backend state.

## `/types`

Shared TypeScript types for the main MVP entities: places, scenarios, events, participants, payments, users, roles, and statuses.

## `app/page.tsx`

Client-side page orchestrator. It owns demo UI state, composes screens from components, and connects data, lib helpers, and typed entities.
