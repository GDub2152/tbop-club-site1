# TBOP 15.0.0 RC2 — News Cleanup Hotfix

News & Announcements now supports permanent cleanup.

To remove a test block:
1. Open Officer Portal > News.
2. If the post is live, Archive it first.
3. Click Delete Permanently.
4. Confirm both prompts.

Draft/test posts can also be deleted directly.

No new Supabase schema migration is required. The signed-in account must have
DELETE RLS permission on `news_posts`. If Supabase returns an RLS error, the
news delete policy needs to be enabled for executive roles.

Keep the existing live config.js; it is intentionally excluded.
