# TBOP V10 Installation

## 1. Run the SQL migration

In Supabase:

SQL Editor > New query

Open:
`supabase/migrations/v10_secretary_workspace.sql`

Paste the full SQL contents and Run.

Expected result:
Success. No rows returned.

## 2. Upload V10 to GitHub

Upload the extracted contents over the current
`tbop-club-site1` repository.

## 3. Test the Secretary workspace

Sign in as:
- Administrator
- Secretary
- President
- Vice President

Open:
Officer Portal > Secretary

Create a test meeting:
- Meeting title/date/time/location
- Attendance
- Agenda
- Motion
- Treasurer report
- Old/new business
- Generate Minutes
- Save Draft

Refresh the browser or use another computer.
The meeting should still appear in the archive.

Open it again and confirm all saved fields return.

## Status workflow

Supported meeting statuses:
- Draft
- Pending Approval
- Approved
- Published

V10 stores the meeting records in Supabase.
