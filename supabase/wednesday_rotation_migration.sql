-- Wednesday Rotation Migration (complete fix)
-- Sets ALL 16 members on every Wednesday: 4 WFH (rotating), 12 WFO
-- This fully overrides the 4-week rotation cycle for Wednesday.
--
-- Group 1 WFH: Anne, Aoi, Beam, Som-O       → Jul 8, Aug 5, Sep 2, Sep 30, Oct 28, Nov 25, Dec 23
-- Group 2 WFH: Rynn, Palm, Sai, Chanika     → Jul 15, Aug 12, Sep 9, Oct 7, Nov 4, Dec 2, Dec 30
-- Group 3 WFH: Beam JR, Bank, Apinya, Pang  → Jul 22, Aug 19, Sep 16, Oct 14, Nov 11, Dec 9
-- Group 4 WFH: Yada, Mix, Nan, Yot          → Jul 29, Aug 26, Sep 23, Oct 21, Nov 18, Dec 16

-- Step 1: Remove fixed Wednesday from Bank & Yot
UPDATE members
SET fixed_days = array_remove(fixed_days, 'wed')
WHERE name IN ('Bank', 'Yot');

-- Step 2: Clear existing Wednesday rotation overrides (idempotent)
DELETE FROM attendance_overrides
WHERE note IN ('Wednesday rotation', 'Wednesday rotation - WFH week')
  AND EXTRACT(DOW FROM date) = 3
  AND date >= '2026-07-08';

-- Step 3: Insert WFH + WFO overrides for ALL members every Wednesday
WITH all_members AS (
  SELECT id, name FROM members
),
-- Define which group is WFH on which Wednesday
wfh_schedule (wed_date, member_name) AS (
  VALUES
  -- Group 1 WFH
  ('2026-07-08'::date,'Anne'),('2026-07-08'::date,'Aoi'),('2026-07-08'::date,'Beam'),('2026-07-08'::date,'Som-O'),
  ('2026-08-05'::date,'Anne'),('2026-08-05'::date,'Aoi'),('2026-08-05'::date,'Beam'),('2026-08-05'::date,'Som-O'),
  ('2026-09-02'::date,'Anne'),('2026-09-02'::date,'Aoi'),('2026-09-02'::date,'Beam'),('2026-09-02'::date,'Som-O'),
  ('2026-09-30'::date,'Anne'),('2026-09-30'::date,'Aoi'),('2026-09-30'::date,'Beam'),('2026-09-30'::date,'Som-O'),
  ('2026-10-28'::date,'Anne'),('2026-10-28'::date,'Aoi'),('2026-10-28'::date,'Beam'),('2026-10-28'::date,'Som-O'),
  ('2026-11-25'::date,'Anne'),('2026-11-25'::date,'Aoi'),('2026-11-25'::date,'Beam'),('2026-11-25'::date,'Som-O'),
  ('2026-12-23'::date,'Anne'),('2026-12-23'::date,'Aoi'),('2026-12-23'::date,'Beam'),('2026-12-23'::date,'Som-O'),
  -- Group 2 WFH
  ('2026-07-15'::date,'Rynn'),('2026-07-15'::date,'Palm'),('2026-07-15'::date,'Sai'),('2026-07-15'::date,'Chanika'),
  ('2026-08-12'::date,'Rynn'),('2026-08-12'::date,'Palm'),('2026-08-12'::date,'Sai'),('2026-08-12'::date,'Chanika'),
  ('2026-09-09'::date,'Rynn'),('2026-09-09'::date,'Palm'),('2026-09-09'::date,'Sai'),('2026-09-09'::date,'Chanika'),
  ('2026-10-07'::date,'Rynn'),('2026-10-07'::date,'Palm'),('2026-10-07'::date,'Sai'),('2026-10-07'::date,'Chanika'),
  ('2026-11-04'::date,'Rynn'),('2026-11-04'::date,'Palm'),('2026-11-04'::date,'Sai'),('2026-11-04'::date,'Chanika'),
  ('2026-12-02'::date,'Rynn'),('2026-12-02'::date,'Palm'),('2026-12-02'::date,'Sai'),('2026-12-02'::date,'Chanika'),
  ('2026-12-30'::date,'Rynn'),('2026-12-30'::date,'Palm'),('2026-12-30'::date,'Sai'),('2026-12-30'::date,'Chanika'),
  -- Group 3 WFH
  ('2026-07-22'::date,'Beam JR'),('2026-07-22'::date,'Bank'),('2026-07-22'::date,'Apinya'),('2026-07-22'::date,'Pang'),
  ('2026-08-19'::date,'Beam JR'),('2026-08-19'::date,'Bank'),('2026-08-19'::date,'Apinya'),('2026-08-19'::date,'Pang'),
  ('2026-09-16'::date,'Beam JR'),('2026-09-16'::date,'Bank'),('2026-09-16'::date,'Apinya'),('2026-09-16'::date,'Pang'),
  ('2026-10-14'::date,'Beam JR'),('2026-10-14'::date,'Bank'),('2026-10-14'::date,'Apinya'),('2026-10-14'::date,'Pang'),
  ('2026-11-11'::date,'Beam JR'),('2026-11-11'::date,'Bank'),('2026-11-11'::date,'Apinya'),('2026-11-11'::date,'Pang'),
  ('2026-12-09'::date,'Beam JR'),('2026-12-09'::date,'Bank'),('2026-12-09'::date,'Apinya'),('2026-12-09'::date,'Pang'),
  -- Group 4 WFH
  ('2026-07-29'::date,'Yada'),('2026-07-29'::date,'Mix'),('2026-07-29'::date,'Nan'),('2026-07-29'::date,'Yot'),
  ('2026-08-26'::date,'Yada'),('2026-08-26'::date,'Mix'),('2026-08-26'::date,'Nan'),('2026-08-26'::date,'Yot'),
  ('2026-09-23'::date,'Yada'),('2026-09-23'::date,'Mix'),('2026-09-23'::date,'Nan'),('2026-09-23'::date,'Yot'),
  ('2026-10-21'::date,'Yada'),('2026-10-21'::date,'Mix'),('2026-10-21'::date,'Nan'),('2026-10-21'::date,'Yot'),
  ('2026-11-18'::date,'Yada'),('2026-11-18'::date,'Mix'),('2026-11-18'::date,'Nan'),('2026-11-18'::date,'Yot'),
  ('2026-12-16'::date,'Yada'),('2026-12-16'::date,'Mix'),('2026-12-16'::date,'Nan'),('2026-12-16'::date,'Yot')
),
all_wednesdays AS (
  SELECT DISTINCT wed_date FROM wfh_schedule
),
-- Every member × every Wednesday → determine WFO or WFH
full_schedule AS (
  SELECT
    m.id AS member_id,
    w.wed_date AS date,
    CASE WHEN wfh.member_name IS NOT NULL THEN 'wfh' ELSE 'wfo' END AS status
  FROM all_members m
  CROSS JOIN all_wednesdays w
  LEFT JOIN wfh_schedule wfh ON wfh.wed_date = w.wed_date AND wfh.member_name = m.name
)
INSERT INTO attendance_overrides (member_id, date, status, note)
SELECT member_id, date, status, 'Wednesday rotation'
FROM full_schedule
ON CONFLICT (member_id, date) DO UPDATE
  SET status = EXCLUDED.status, note = 'Wednesday rotation';
