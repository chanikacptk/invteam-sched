-- Admin draft/publish mode
-- Run this whole file once in Supabase Dashboard → SQL Editor

create table if not exists draft_changes (
  id          uuid primary key default gen_random_uuid(),
  table_name  text not null check (table_name in ('members','pairs','holidays','attendance_overrides')),
  row_key     text not null,   -- members/pairs/holidays: row id. attendance_overrides: `${member_id}|${date}`
  action      text not null check (action in ('insert','update','delete')),
  payload     jsonb,           -- full row data for insert/update, null for delete
  created_at  timestamptz default now(),
  created_by  uuid references auth.users(id),
  unique (table_name, row_key)
);

alter table draft_changes enable row level security;

-- No public read policy — Viewer must never see pending drafts.
create policy "admin read drafts" on draft_changes for select using (auth.role() = 'authenticated');
create policy "admin write drafts" on draft_changes for all using (auth.role() = 'authenticated');

alter publication supabase_realtime add table draft_changes;
