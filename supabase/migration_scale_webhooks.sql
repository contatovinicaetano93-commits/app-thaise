-- Webhooks + notificações (passos 52–93)

create table if not exists webhooks (
  id uuid primary key default uuid_generate_v4(),
  url text not null,
  events text[] not null default '{}',
  secret text not null,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text,
  href text,
  read boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_notifications_user on notifications(user_id, read, created_at desc);

alter table webhooks enable row level security;
alter table notifications enable row level security;

create policy "allow all webhooks" on webhooks for all using (true);
create policy "notifications own" on notifications for all using (auth.uid() = user_id);
