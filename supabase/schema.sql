-- SDQ Online System - Database Schema
-- Run this in your Supabase SQL Editor

-- Enable RLS
alter database postgres set timezone to 'Asia/Bangkok';

-- =====================
-- SCHOOLS
-- =====================
create table if not exists schools (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  district text,
  province text,
  affiliation text,
  phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- =====================
-- TEACHERS / USERS
-- =====================
create table if not exists teachers (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  employee_code text,
  email text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- =====================
-- CLASSROOMS
-- =====================
create table if not exists classrooms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) on delete cascade,
  grade int not null check (grade between 1 and 6),
  section text not null,
  teacher_id uuid references teachers(id) on delete set null,
  created_at timestamptz default now(),
  unique(school_id, grade, section)
);

-- =====================
-- STUDENTS
-- =====================
create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) on delete cascade,
  classroom_id uuid references classrooms(id) on delete set null,
  student_code text not null,
  first_name text not null,
  last_name text not null,
  gender text check (gender in ('M', 'F')),
  birth_date date,
  parent_contact text,
  is_active boolean default true,
  created_at timestamptz default now(),
  unique(school_id, student_code)
);

-- =====================
-- ASSESSMENT PERIODS
-- =====================
create table if not exists assessment_periods (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) on delete cascade,
  name text not null,
  academic_year int,
  semester int check (semester in (1, 2)),
  start_date date,
  end_date date,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- =====================
-- ASSESSMENTS
-- =====================
create table if not exists assessments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  period_id uuid references assessment_periods(id) on delete cascade,
  assessor_type text not null check (assessor_type in ('teacher', 'parent', 'student')),
  assessor_teacher_id uuid references teachers(id) on delete set null,
  assessor_name text,

  -- Raw answers Q1-Q25 (0=ไม่จริง, 1=จริงบ้าง, 2=จริงมาก)
  q1 int check (q1 between 0 and 2),
  q2 int check (q2 between 0 and 2),
  q3 int check (q3 between 0 and 2),
  q4 int check (q4 between 0 and 2),
  q5 int check (q5 between 0 and 2),
  q6 int check (q6 between 0 and 2),
  q7 int check (q7 between 0 and 2),
  q8 int check (q8 between 0 and 2),
  q9 int check (q9 between 0 and 2),
  q10 int check (q10 between 0 and 2),
  q11 int check (q11 between 0 and 2),
  q12 int check (q12 between 0 and 2),
  q13 int check (q13 between 0 and 2),
  q14 int check (q14 between 0 and 2),
  q15 int check (q15 between 0 and 2),
  q16 int check (q16 between 0 and 2),
  q17 int check (q17 between 0 and 2),
  q18 int check (q18 between 0 and 2),
  q19 int check (q19 between 0 and 2),
  q20 int check (q20 between 0 and 2),
  q21 int check (q21 between 0 and 2),
  q22 int check (q22 between 0 and 2),
  q23 int check (q23 between 0 and 2),
  q24 int check (q24 between 0 and 2),
  q25 int check (q25 between 0 and 2),

  -- Computed scores
  emotional_score int,
  conduct_score int,
  hyperactivity_score int,
  peer_score int,
  prosocial_score int,
  total_difficulties int,

  -- Status: normal=ปกติ, borderline=เสี่ยง, abnormal=มีปัญหา
  status text check (status in ('normal', 'borderline', 'abnormal')),

  submitted_at timestamptz default now(),
  ip_address text,

  -- One assessment per student per period per assessor type
  unique(student_id, period_id, assessor_type)
);

-- =====================
-- NOTIFICATIONS
-- =====================
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) on delete cascade,
  teacher_id uuid references teachers(id) on delete cascade,
  student_id uuid references students(id) on delete cascade,
  period_id uuid references assessment_periods(id) on delete cascade,
  message text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- =====================
-- ROW LEVEL SECURITY
-- =====================
alter table schools enable row level security;
alter table teachers enable row level security;
alter table classrooms enable row level security;
alter table students enable row level security;
alter table assessment_periods enable row level security;
alter table assessments enable row level security;
alter table notifications enable row level security;

-- Allow all authenticated users to read their school's data
-- (simplified RLS for school deployment - one school per deployment)
create policy "Allow all for authenticated" on schools
  for all using (auth.role() = 'authenticated');

create policy "Allow all for authenticated" on teachers
  for all using (auth.role() = 'authenticated');

create policy "Allow all for authenticated" on classrooms
  for all using (auth.role() = 'authenticated');

create policy "Allow all for authenticated" on students
  for all using (auth.role() = 'authenticated');

create policy "Allow all for authenticated" on assessment_periods
  for all using (auth.role() = 'authenticated');

-- Assessments: authenticated can read/write, anon can insert (for parent/student forms)
create policy "Authenticated can manage assessments" on assessments
  for all using (auth.role() = 'authenticated');

create policy "Anon can insert assessments" on assessments
  for insert with check (
    assessor_type in ('parent', 'student')
  );

-- Allow anon to read students (for validation in parent/student forms)
create policy "Anon can read students" on students
  for select using (true);

create policy "Anon can read periods" on assessment_periods
  for select using (true);

create policy "Anon can read assessments" on assessments
  for select using (true);

create policy "Allow all for authenticated" on notifications
  for all using (auth.role() = 'authenticated');

-- =====================
-- FUNCTIONS
-- =====================

-- Auto-generate student code based on grade, section, number
create or replace function generate_student_code(p_grade int, p_section text, p_number int)
returns text as $$
begin
  return 'P' || p_grade || lpad(p_section, 2, '0') || lpad(p_number::text, 3, '0');
end;
$$ language plpgsql;

-- Example: grade=1, section='1', number=1 → P101001
