-- Supabase SQL Schema for Live Quiz
-- Execute these statements in your Supabase SQL editor (Admin panel)

-- 1. Sessions table
create table sessions (
  id uuid primary key default gen_random_uuid(),
  teacher_id text not null,
  session_code text unique not null,
  current_question_index int default 0,
  status text default 'waiting', -- waiting, active, ended
  question_ids text[] not null, -- array of question IDs
  created_at timestamp default now(),
  updated_at timestamp default now()
);

-- 2. Participants table
create table participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  participant_id text not null,
  name text,
  joined_at timestamp default now()
);

-- 3. Responses table
create table responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references sessions(id) on delete cascade,
  question_id text not null,
  participant_id text not null,
  option_index int not null,
  submitted_at timestamp default now()
);

-- Create indices for performance
create index idx_sessions_code on sessions(session_code);
create index idx_participants_session on participants(session_id);
create index idx_responses_session on responses(session_id);
create index idx_responses_question on responses(question_id);

-- Enable Row Level Security
alter table sessions enable row level security;
alter table participants enable row level security;
alter table responses enable row level security;

-- RLS Policies (allow read-only for public, write-limited by participant)
create policy "sessions readable for all" on sessions for select to authenticated, anon using (true);
create policy "participants insertable" on participants for insert to authenticated, anon with check (true);
create policy "participants readable for all" on participants for select to authenticated, anon using (true);
create policy "responses insertable" on responses for insert to authenticated, anon with check (true);
create policy "responses readable for all" on responses for select to authenticated, anon using (true);

-- Enable Realtime
alter publication supabase_realtime add table sessions;
alter publication supabase_realtime add table participants;
alter publication supabase_realtime add table responses;
