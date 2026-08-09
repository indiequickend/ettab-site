@AGENTS.md

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project state

ETTAB (Excellence Towards Tourism Associates of Bengal) needs a **members area** as the first build target — the public marketing site's scope is not yet decided. This repository is currently empty of code — there is no application, build system, package manifest, or test suite yet, and it is not a git repository (`git init` is needed before Phase 0 work starts). The only content today is two reference data files that are the *current, manual* way members get added to the directory — the members area's job is to replace this process:

- `docs/ETTAB- HOTELS & HOMESTAY - Sheet1.csv` — a member directory export for ETTAB (a tour and travel association) hoteliers with listing of hotels and homestays and their details.
- `docs/ETTAB- TOUR OPERATORS - Sheet1.csv` - a member directory for the tour operators and travel agents

See "Members area — architecture & roadmap" below for the planned system and build order.

## Source data schema

`docs/ETTAB- HOTELS & HOMESTAY - Sheet1.csv` is a raw spreadsheet export (row 1-2 are a two-level header) with one row per property:

- **Member details**: Sl. No., Member ID, Member Name, Contact Number, Agency Name, TL/MSME No. (trade licence / MSME registration, sometimes multiple per cell)
- **Property details**: Hotel/Homestay Name, Location, Category (e.g. Standard/Deluxe/Semi Deluxe), Total Rooms, Capacity
- **Rate (Rs.)**: B2B, B2C (often ranges, e.g. `1200-1400`)
- **Links**: Property Picture Link (Google Photos/Maps), Google Business Page, Facebook Page, Website

`docs/ETTAB- TOUR OPERATORS - Sheet1.csv` is a raw spreadsheet export (row 1 is a title row, row 2 is the header) with one row per operator/vendor:

- Sl. No., Operator ID (e.g. `ETTAB/TO/`, inconsistently formatted like the hotels file's Member ID), Operator Name, Contact Number (often multiple, `/`-separated, sometimes annotated e.g. "(Owner)"/"(Manager)")
- Company Name, CAR DETAILS (free text, mostly blank), TL/MSME No. (trade licence / MSME registration, formats vary widely)
- Service Area (free text region list, e.g. "North Bengal, Sikkim")
- RATE (present in header, blank in all sampled rows)
- FB/Google Page Link

Shares the same data-quality issues as the hotels file: inconsistent Operator ID formatting, blank/placeholder rows, free-text fields with inconsistent delimiters and capitalization.

Data-quality notes to keep in mind if this file is parsed or imported:
- Free-text, inconsistently formatted fields (phone numbers with `/` separators, multi-line cells, inconsistent capitalization like "Standerd"/"Standard", trailing spaces).
- Some rows are sparse/incomplete or placeholder (e.g. `NA` location/category, blank member rows).
- Member ID values are inconsistently formatted (`ETTAB/`, `ETTAB`, `*ETABB*`, `ETABB`) — likely data-entry variants of the same association name, not meaningfully distinct values.

## Members area — architecture & roadmap

### Core requirements

- Self-service registration (email + password + company/member details) with email verification, followed by manual admin approval before login is allowed. A superadmin-controlled `autoVerification` setting can bypass the *admin* approval step (email verification is always required regardless).
- RBAC: superadmin can create, edit, and assign roles with granular permissions; default role for new members is `member`.
- A member (person) can be a hotelier and/or tour operator and/or car vendor at once (multi-select), can own/partner in multiple companies, and a company can have multiple partners. A hotelier can manage multiple properties across multiple locations dynamically.
- The primary member-facing feature is **search**: find who in the association has a property at, or a service area covering, a given place — surfacing both properties and tour operators/car vendors, with direct-call contact cards, in random order, mobile-first.
- Locations/service areas are entered through a shared, centralized, de-duplicated typeahead (state names or widely-recognized place names) — reuse existing entries, only insert a new one on submit if genuinely not found.

### Decisions on record

- **Partner linking**: an existing company partner invites a new partner by email; the invitee links/creates their account against that company. No join-requests, no admin step for this.
- **Photos**: external links only for now (Google Photos/Maps links), matching current CSV data. No file upload/storage provider yet.
- **Location search matching**: flat tags with an optional State marker — a search for a town also matches service areas tagged with that town's state. No full geo hierarchy (yet).
- **Email delivery**: Resend.

### Chosen stack

- **Framework**: Next.js (App Router, TypeScript), mobile-first.
- **UI**: Tailwind CSS + shadcn/ui; visual/UX design pass via the `frontend-design` skill.
- **Database**: MongoDB Atlas, official driver (or Mongoose) via a singleton connection helper for serverless.
- **Auth**: Auth.js (NextAuth v5), Credentials provider, JWT session strategy. `authorize()` rejects sign-in unless the user's `status === 'approved'`. Session/JWT carries role + permission + company-membership claims for RBAC checks in middleware and server actions.
- **Email**: Resend — verification emails, admin new-registration notifications, approval notifications, partner invites.
- **Hosting**: Vercel (implied by Next.js; not a blocking decision).

### Data model (MongoDB collections)

- **users** — name, email (unique), passwordHash, phone, emailVerified (date/null), status (`pending_email` → `pending_approval` → `approved`, or `rejected`/`suspended`), roleIds[], createdAt.
- **roles** — name, permissions[] (e.g. `roles.manage`, `members.approve`, `settings.manage`, `company.manage_own`, `property.manage_own`, `serviceArea.manage_own`), isSystem (protects the three defaults: `superadmin`, `admin`, `member`). Superadmin implicitly has all permissions and can create/edit/delete custom roles and assign any role to any user.
- **companies** — name, memberTypes[] (`hotelier` / `tour_operator` / `car_vendor`, multi-select — lets one company be a hotelier *and* a car vendor), licence numbers[] (TL/MSME, etc.), createdBy.
- **companyPartners** — junction (companyId, userId), personName + personPhone *for that company context* (the same person can show a different contact number per company), roleInCompany (`owner`/`partner`), status (`active`/`invited`). This backs multi-company-per-person and multi-partner-per-company, and is what search-result cards read to show "all the numbers with person name."
- **invites** — companyId, email, token, expiresAt, status — backs the email-invite partner-linking flow.
- **places** — centralized, de-duplicated, searchable tag list (name, normalizedName for case/whitespace-insensitive matching, `isState` + `stateName` when applicable, usageCount). Shared by both property locations and service areas.
- **properties** — companyId, name, placeId, category, totalRooms, capacity, rateB2B, rateB2C, photo links[], Google Business/Facebook/website links, createdBy.
- **serviceAreas** — junction (companyId, placeId) for tour operators/car vendors, backed by the same `places` typeahead.
- **settings** — singleton doc; `autoVerification` boolean.

**Search resolution**: given a typed place, resolve matching `places`; pull `properties` at those places and `serviceAreas` at those places OR at a state-level place matching the searched place's state; union the resulting companies; attach each company's active `companyPartners` (name+phone); shuffle result order per-request; render as mobile-first cards with click-to-call `tel:` links.

### Build phases

0. **Foundations** — Next.js + TS + Tailwind/shadcn scaffold, MongoDB Atlas connection helper, base mobile-first layout, env/config setup.
1. **Auth & Registration Core** — `users`/`roles`/`settings` models, registration form (email/password + company basics), bcrypt hashing, Resend email verification, NextAuth Credentials login gated on `status`, seed script for default roles + initial superadmin.
2. **Admin Approval & RBAC** — admin notification email on new pending registrations, admin approve/reject dashboard, superadmin role management UI (create/edit/assign roles, permission sets), autoVerification toggle, permission-based route guards.
3. **Company & Partner Management** — company creation (at registration), email-based partner invite + accept/link flow, company management UI, multi-company support for a single person (company switcher).
4. **Properties & Service Areas** — shared `places` typeahead component (search-or-insert-on-submit), property CRUD (hotel/homestay, rates, links), service-area CRUD for operators/car vendors, and a one-time migration script importing both existing CSVs into seed companies/properties/serviceAreas/places (with an invite/claim flow so real members take ownership of their pre-seeded rows).
5. **Member Search** — search UI and backend resolution logic described above; mobile-first card results, click-to-call, random ordering, indexes on `places.normalizedName` / `properties.placeId` / `serviceAreas.placeId`.
6. **Polish & Hardening** — full responsive/accessibility pass (frontend-design skill), auth rate-limiting, loading/empty/error states, end-to-end manual walkthrough of the full lifecycle (register → verify → approve → login → create company → invite partner → add property/service area → search finds it).

No application code exists yet — Phase 0 is the next actionable step.
