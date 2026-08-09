# TBOP V13 Installation

## 1. Run Supabase migration

Supabase > SQL Editor > New query

Open:
`supabase/migrations/v13_operations_suite.sql`

Paste the entire file and Run.

Expected:
Success. No rows returned.

## 2. Upload V13 to GitHub

Upload the extracted V13 files over the existing repository.

## 3. New modules

Officer Portal now includes:
- Repeater Management Center
- Equipment Inventory
- News / Announcements
- Analytics
- Document Approvals
- Backup / Export

Member Portal now includes:
- Digital membership-card display placeholder backed by membership_cards

Public website:
- News automatically reads published public Supabase posts

PWA:
- manifest.webmanifest
- service-worker.js
- installable browser experience on supported platforms

## 4. Important staged features

Push notifications:
The notifications table is included, but browser push delivery is NOT yet enabled.
That requires a push provider/service worker subscription flow.

Full automated restore:
Backup export is enabled.
Automated restore remains disabled until validation and conflict handling are built.

QR code:
Membership-card token display is included.
A true scannable QR renderer/check-in workflow will be added in a later release.
