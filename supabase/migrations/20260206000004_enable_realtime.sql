-- Enable Realtime for specific tables
begin;
  -- Remove them first to avoid errors if they exist (clean slate logic)
  drop publication if exists supabase_realtime;
  create publication supabase_realtime for table meals, classes, skills, profiles;
commit;
