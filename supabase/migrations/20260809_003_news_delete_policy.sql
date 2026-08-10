-- TBOP 15.0.0 RC3 - News permanent-delete policy
begin;

alter table public.news_posts enable row level security;

drop policy if exists "executives can delete news" on public.news_posts;
drop policy if exists "officers can delete news" on public.news_posts;
drop policy if exists "admins can delete news" on public.news_posts;

create policy "executives can delete news"
on public.news_posts
for delete
to authenticated
using (
  public.tbop_is_executive()
);

commit;
