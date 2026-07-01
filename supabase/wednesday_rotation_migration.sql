-- Wednesday Rotation Migration
-- Effective from week of Jul 6-10, 2026
-- Group 1 (WFH): Anne, Aoi, Beam, Som-O
-- Group 2 (WFH): Rynn, Palm, Sai, Chanika
-- Group 3 (WFH): Beam JR, Nan, Apinya, Pang
-- Group 4 (WFH): Yada, Mix, Bank, Yot
-- 12 WFO + 4 WFH rotating every Wednesday

-- Step 1: Remove fixed Wednesday from Bank & Yot
UPDATE members
SET fixed_days = array_remove(fixed_days, 'wed')
WHERE name IN ('Bank', 'Yot');

-- Step 2: Insert WFH overrides for each group's Wednesday
WITH wed_schedule (wed_date, member_name) AS (
  VALUES
  -- Group 1: Anne, Aoi, Beam, Som-O
  ('2026-07-08'::date,'Anne'),('2026-07-08'::date,'Aoi'),('2026-07-08'::date,'Beam'),('2026-07-08'::date,'Som-O'),
  ('2026-08-05'::date,'Anne'),('2026-08-05'::date,'Aoi'),('2026-08-05'::date,'Beam'),('2026-08-05'::date,'Som-O'),
  ('2026-09-02'::date,'Anne'),('2026-09-02'::date,'Aoi'),('2026-09-02'::date,'Beam'),('2026-09-02'::date,'Som-O'),
  ('2026-09-30'::date,'Anne'),('2026-09-30'::date,'Aoi'),('2026-09-30'::date,'Beam'),('2026-09-30'::date,'Som-O'),
  ('2026-10-28'::date,'Anne'),('2026-10-28'::date,'Aoi'),('2026-10-28'::date,'Beam'),('2026-10-28'::date,'Som-O'),
  ('2026-11-25'::date,'Anne'),('2026-11-25'::date,'Aoi'),('2026-11-25'::date,'Beam'),('2026-11-25'::date,'Som-O'),
  ('2026-12-23'::date,'Anne'),('2026-12-23'::date,'Aoi'),('2026-12-23'::date,'Beam'),('2026-12-23'::date,'Som-O'),
  -- Group 2: Rynn, Palm, Sai, Chanika
  ('2026-07-15'::date,'Rynn'),('2026-07-15'::date,'Palm'),('2026-07-15'::date,'Sai'),('2026-07-15'::date,'Chanika'),
  ('2026-08-12'::date,'Rynn'),('2026-08-12'::date,'Palm'),('2026-08-12'::date,'Sai'),('2026-08-12'::date,'Chanika'),
  ('2026-09-09'::date,'Rynn'),('2026-09-09'::date,'Palm'),('2026-09-09'::date,'Sai'),('2026-09-09'::date,'Chanika'),
  ('2026-10-07'::date,'Rynn'),('2026-10-07'::date,'Palm'),('2026-10-07'::date,'Sai'),('2026-10-07'::date,'Chanika'),
  ('2026-11-04'::date,'Rynn'),('2026-11-04'::date,'Palm'),('2026-11-04'::date,'Sai'),('2026-11-04'::date,'Chanika'),
  ('2026-12-02'::date,'Rynn'),('2026-12-02'::date,'Palm'),('2026-12-02'::date,'Sai'),('2026-12-02'::date,'Chanika'),
  ('2026-12-30'::date,'Rynn'),('2026-12-30'::date,'Palm'),('2026-12-30'::date,'Sai'),('2026-12-30'::date,'Chanika'),
  -- Group 3: Beam JR, Nan, Apinya, Pang
  ('2026-07-22'::date,'Beam JR'),('2026-07-22'::date,'Nan'),('2026-07-22'::date,'Apinya'),('2026-07-22'::date,'Pang'),
  ('2026-08-19'::date,'Beam JR'),('2026-08-19'::date,'Nan'),('2026-08-19'::date,'Apinya'),('2026-08-19'::date,'Pang'),
  ('2026-09-16'::date,'Beam JR'),('2026-09-16'::date,'Nan'),('2026-09-16'::date,'Apinya'),('2026-09-16'::date,'Pang'),
  ('2026-10-14'::date,'Beam JR'),('2026-10-14'::date,'Nan'),('2026-10-14'::date,'Apinya'),('2026-10-14'::date,'Pang'),
  ('2026-11-11'::date,'Beam JR'),('2026-11-11'::date,'Nan'),('2026-11-11'::date,'Apinya'),('2026-11-11'::date,'Pang'),
  ('2026-12-09'::date,'Beam JR'),('2026-12-09'::date,'Nan'),('2026-12-09'::date,'Apinya'),('2026-12-09'::date,'Pang'),
  -- Group 4: Yada, Mix, Bank, Yot
  ('2026-07-29'::date,'Yada'),('2026-07-29'::date,'Mix'),('2026-07-29'::date,'Bank'),('2026-07-29'::date,'Yot'),
  ('2026-08-26'::date,'Yada'),('2026-08-26'::date,'Mix'),('2026-08-26'::date,'Bank'),('2026-08-26'::date,'Yot'),
  ('2026-09-23'::date,'Yada'),('2026-09-23'::date,'Mix'),('2026-09-23'::date,'Bank'),('2026-09-23'::date,'Yot'),
  ('2026-10-21'::date,'Yada'),('2026-10-21'::date,'Mix'),('2026-10-21'::date,'Bank'),('2026-10-21'::date,'Yot'),
  ('2026-11-18'::date,'Yada'),('2026-11-18'::date,'Mix'),('2026-11-18'::date,'Bank'),('2026-11-18'::date,'Yot'),
  ('2026-12-16'::date,'Yada'),('2026-12-16'::date,'Mix'),('2026-12-16'::date,'Bank'),('2026-12-16'::date,'Yot')
)
INSERT INTO attendance_overrides (member_id, date, status, note)
SELECT m.id, ws.wed_date, 'wfh', 'Wednesday rotation'
FROM wed_schedule ws
JOIN members m ON m.name = ws.member_name
ON CONFLICT (member_id, date) DO UPDATE
  SET status = 'wfh', note = 'Wednesday rotation';
