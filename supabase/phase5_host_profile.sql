-- =====================================================================
-- Phase 5: Host profile
-- Run in Supabase → SQL Editor.
-- =====================================================================

-- Hosts can show a website / LinkTree on their profile. profiles had no column
-- for it, so the Edit Host Profile screen had nowhere to save it.
alter table public.profiles
  add column if not exists website text;
