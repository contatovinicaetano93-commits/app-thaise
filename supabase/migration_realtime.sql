-- Habilita Supabase Realtime nas tabelas principais do painel
-- Rode no SQL Editor se ainda não estiver na publication

do $$
begin
  alter publication supabase_realtime add table clients;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table products;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table orders;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table suppliers;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table projects;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table activity_events;
exception when duplicate_object then null;
end $$;
