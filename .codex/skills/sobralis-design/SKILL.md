---
name: sobralis-design
description: Use for Sobralis UI design, brand-preview, event-card-preview, public guest invitation cards, landing page, event creation flow, organizer cabinet, dashboard redesign, buttons, chips, cards, icons, typography, mobile polish, and applying the Sobralis visual identity.
---

# Sobralis Design Skill

## When to use this skill

Use this skill for any task related to:
- Собрались UI design
- brand-preview
- event-card-preview
- public guest invitation card
- landing page
- event creation flow
- organizer cabinet
- dashboard redesign
- buttons, chips, cards, icons, typography
- mobile visual polish
- applying Sobralis visual identity

## Brand essence

«Собрались» is not a CRM and not a booking table.

It is an aesthetic event-tech service for beautiful group meetings.

For guests:
- a beautiful invitation card;
- clear date, time, place;
- simple action: “Я иду”.

For organizers:
- calm control layer;
- guests, spots, payments, waitlist, reminders;
- no visual chaos.

## Main visual direction

Premium botanical social club / ritual & rest / elegant invitation UI.

The interface must feel:
- warm;
- calm;
- premium;
- tactile;
- invitation-first;
- feminine but not sweet;
- modern but not cold;
- organized but not CRM.

## Primary reference

Always use:

`docs/design/references/sobralis-brand-reference.png`

as the visual source of truth.

If a design solution conflicts with this reference, do not implement it without explicit confirmation.

## Required design docs

Before any design task, read:

- `AGENTS.md`
- `docs/design/SOBRALIS_BRAND_GUIDE.md`
- `docs/design/SOBRALIS_UI_RULES.md`
- `docs/design/SOBRALIS_REFERENCE_ANALYSIS.md`
- `docs/design/SOBRALIS_VISUAL_CHECKLIST.md`
- `docs/design/SOBRALIS_DESIGN_QUALITY_RUBRIC.md`
- `docs/design/SOBRALIS_COMPONENT_MAP.md`

## Design rules

### 1. Invitation first

The public-facing screen must feel like an invitation card, not a dashboard.

Main hero component:
- invitation card;
- event visual;
- date/time/place;
- spots;
- guests;
- CTA.

Organizer data is secondary.

### 2. No CRM look

Avoid:
- tables;
- hard dashboard panels;
- cold SaaS grids;
- dense admin blocks;
- too many metrics on guest-facing screens.

### 3. Typography

Use:
- elegant serif for event titles and emotional headings;
- clean sans-serif for UI;
- generous line-height;
- refined spacing.

Avoid:
- heavy bold headlines;
- generic default font stacks;
- cartoon fonts;
- fashion font that kills readability.

### 4. Color

Use the Sobralis palette:

- background: `#F5EFE6`
- surface: `#FFFDF8`
- surface-soft: `#EFE7DA`
- text: `#2B2A27`
- muted: `#7C746A`
- sage: `#7E8466`
- sage-dark: `#596047`
- clay: `#B88768`
- caramel: `#B78346`
- gold: `#C59A55`
- border: `rgba(43,42,39,0.12)`
- shadow: `rgba(43,42,39,0.14)`

### 5. Components

Prefer reusable components:

- BrandLogoApproved
- BrandSymbolApproved
- InvitationGuestCard
- PublicEventInvitationCard
- EventVisualFrame
- GuestAvatarStack
- SeatsProgress
- SoftStatusChip
- FloatingEventInfoCard
- SoftButton
- OrganizerChip
- SectionCard
- EventListCard
- BuilderPreviewPanel
- AuthCard

Do not hardcode the same visual blocks repeatedly.

### 6. Mobile first

Most guests will open event links on mobile.

Always check:
- no horizontal scroll;
- CTA is visible;
- event card is readable;
- side chips move under the card;
- crop/visual frame does not break layout.

### 7. Approved logo

If available, use only:

- `public/brand/sobralis_approved_symbol_exact.svg`
- `public/brand/sobralis_approved_symbol_vector_clean.svg`

Do not redraw the logo.
Do not create CSS circles manually.
Do not make a new symbol.

## Quality gate

After any design task, score the result:

1. Brand mood — /20
2. Invitation/card quality — /20
3. UI consistency — /20
4. Mobile/adaptive — /20
5. Functional safety — /20

If below 85/100, improve before finishing.
Target: 90+/100.

## Do not repeat

Do not:
- redesign only a small component and leave it inside an old shell;
- make preview pages beautiful while real pages stay old;
- add fake working buttons;
- hide old MVP UI behind one pretty card;
- turn Sobralis into a CRM;
- turn Sobralis into a flower shop, SPA, wedding site, or Canva template.

## Current priority order

1. Real guest card and event shell.
2. Main app shell and landing.
3. Event creation flow.
4. Organizer cabinet.
5. Profile events list.
6. Admin last.
