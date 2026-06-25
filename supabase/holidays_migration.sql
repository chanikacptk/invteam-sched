-- Thai public holidays feature
-- Run this whole file once in Supabase Dashboard → SQL Editor

create table if not exists holidays (
  id          uuid primary key default gen_random_uuid(),
  date        date not null unique,
  name_th     text not null,
  name_en     text not null,
  is_observed boolean not null default true,
  created_at  timestamptz default now()
);

alter table holidays enable row level security;

create policy "public read holidays" on holidays for select using (true);
create policy "admin write holidays" on holidays for all using (auth.role() = 'authenticated');

alter publication supabase_realtime add table holidays;

-- Seed: fixed-date (solar) national holidays only — same date every year.
-- Lunar/Buddhist holidays (Makha Bucha, Visakha Bucha, Asahna Bucha, Buddhist Lent,
-- substitution/in-lieu days) shift every year and are NOT included here —
-- add them from the Admin → Holidays tab once the Cabinet announces each year's dates.
insert into holidays (date, name_th, name_en, is_observed) values
  ('2026-01-01', 'วันขึ้นปีใหม่', 'New Year''s Day', true),
  ('2026-04-06', 'วันจักรี', 'Chakri Memorial Day', true),
  ('2026-04-13', 'วันสงกรานต์', 'Songkran Festival', true),
  ('2026-04-14', 'วันสงกรานต์', 'Songkran Festival', true),
  ('2026-04-15', 'วันสงกรานต์', 'Songkran Festival', true),
  ('2026-05-01', 'วันแรงงานแห่งชาติ', 'National Labour Day', true),
  ('2026-05-04', 'วันฉัตรมงคล', 'Coronation Day', true),
  ('2026-06-03', 'วันเฉลิมพระชนมพรรษาสมเด็จพระราชินี', 'Queen Suthida''s Birthday', true),
  ('2026-07-28', 'วันเฉลิมพระชนมพรรษา ร.10', 'King Vajiralongkorn''s Birthday', true),
  ('2026-08-12', 'วันแม่แห่งชาติ', 'Queen Mother''s Birthday / Mother''s Day', true),
  ('2026-10-13', 'วันคล้ายวันสวรรคต ร.9', 'King Bhumibol Memorial Day', true),
  ('2026-10-23', 'วันปิยมหาราช', 'Chulalongkorn Day', true),
  ('2026-12-05', 'วันพ่อแห่งชาติ', 'King Bhumibol''s Birthday / Father''s Day', true),
  ('2026-12-10', 'วันรัฐธรรมนูญ', 'Constitution Day', true),
  ('2026-12-31', 'วันสิ้นปี', 'New Year''s Eve', true),

  ('2027-01-01', 'วันขึ้นปีใหม่', 'New Year''s Day', true),
  ('2027-04-06', 'วันจักรี', 'Chakri Memorial Day', true),
  ('2027-04-13', 'วันสงกรานต์', 'Songkran Festival', true),
  ('2027-04-14', 'วันสงกรานต์', 'Songkran Festival', true),
  ('2027-04-15', 'วันสงกรานต์', 'Songkran Festival', true),
  ('2027-05-01', 'วันแรงงานแห่งชาติ', 'National Labour Day', true),
  ('2027-05-04', 'วันฉัตรมงคล', 'Coronation Day', true),
  ('2027-06-03', 'วันเฉลิมพระชนมพรรษาสมเด็จพระราชินี', 'Queen Suthida''s Birthday', true),
  ('2027-07-28', 'วันเฉลิมพระชนมพรรษา ร.10', 'King Vajiralongkorn''s Birthday', true),
  ('2027-08-12', 'วันแม่แห่งชาติ', 'Queen Mother''s Birthday / Mother''s Day', true),
  ('2027-10-13', 'วันคล้ายวันสวรรคต ร.9', 'King Bhumibol Memorial Day', true),
  ('2027-10-23', 'วันปิยมหาราช', 'Chulalongkorn Day', true),
  ('2027-12-05', 'วันพ่อแห่งชาติ', 'King Bhumibol''s Birthday / Father''s Day', true),
  ('2027-12-10', 'วันรัฐธรรมนูญ', 'Constitution Day', true),
  ('2027-12-31', 'วันสิ้นปี', 'New Year''s Eve', true),

  ('2028-01-01', 'วันขึ้นปีใหม่', 'New Year''s Day', true),
  ('2028-04-06', 'วันจักรี', 'Chakri Memorial Day', true),
  ('2028-04-13', 'วันสงกรานต์', 'Songkran Festival', true),
  ('2028-04-14', 'วันสงกรานต์', 'Songkran Festival', true),
  ('2028-04-15', 'วันสงกรานต์', 'Songkran Festival', true),
  ('2028-05-01', 'วันแรงงานแห่งชาติ', 'National Labour Day', true),
  ('2028-05-04', 'วันฉัตรมงคล', 'Coronation Day', true),
  ('2028-06-03', 'วันเฉลิมพระชนมพรรษาสมเด็จพระราชินี', 'Queen Suthida''s Birthday', true),
  ('2028-07-28', 'วันเฉลิมพระชนมพรรษา ร.10', 'King Vajiralongkorn''s Birthday', true),
  ('2028-08-12', 'วันแม่แห่งชาติ', 'Queen Mother''s Birthday / Mother''s Day', true),
  ('2028-10-13', 'วันคล้ายวันสวรรคต ร.9', 'King Bhumibol Memorial Day', true),
  ('2028-10-23', 'วันปิยมหาราช', 'Chulalongkorn Day', true),
  ('2028-12-05', 'วันพ่อแห่งชาติ', 'King Bhumibol''s Birthday / Father''s Day', true),
  ('2028-12-10', 'วันรัฐธรรมนูญ', 'Constitution Day', true),
  ('2028-12-31', 'วันสิ้นปี', 'New Year''s Eve', true)
on conflict (date) do nothing;
