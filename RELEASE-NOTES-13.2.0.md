# TBOP Club Site 13.2.0 — News & Announcements CMS

Officers can now manage homepage announcements entirely from:
Officer Portal > News

Workflow:
1. Create or edit a post.
2. Save Draft.
3. Preview.
4. Publish Now or select a future date/time and Schedule.
5. Published posts can be Unpublished, Pinned, or Archived.
6. Archived posts can be restored to Draft.

No Supabase SQL migration is required for this release. The existing
`news_posts` table and RLS policies already support the workflow.

Scheduling implementation:
A scheduled public post is stored as `published` with a future `publish_at`.
The existing public RLS policy prevents it from being visible until that time.

Keep the existing live `config.js`; this ZIP intentionally does not contain it.
