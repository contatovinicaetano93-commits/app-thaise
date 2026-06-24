-- Resiliência + Memória — rodar após schema.sql (idempotente)

-- Histórico de status de pedidos (memória)
create table if not exists order_status_log (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  from_status text,
  to_status text not null,
  changed_by uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz default now()
);

-- Eventos de atividade (memória / timeline)
create table if not exists activity_events (
  id uuid primary key default uuid_generate_v4(),
  entity_type text not null check (entity_type in ('project','order','supplier','client','product')),
  entity_id uuid not null,
  event_type text not null,
  title text not null,
  detail text,
  metadata jsonb default '{}',
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- Idempotência de jobs (evita processar 2x)
create table if not exists processed_jobs (
  id uuid primary key default uuid_generate_v4(),
  job_key text not null unique,
  job_type text not null,
  order_id uuid references orders(id) on delete set null,
  result jsonb,
  created_at timestamptz default now()
);

-- Índices de performance
create index if not exists idx_orders_status on orders(status);
create index if not exists idx_orders_created_at on orders(created_at desc);
create index if not exists idx_orders_supplier on orders(supplier_id);
create index if not exists idx_orders_client on orders(client_id);
create index if not exists idx_projects_phase on projects(phase);
create index if not exists idx_projects_status on projects(status);
create index if not exists idx_activity_entity on activity_events(entity_type, entity_id, created_at desc);
create index if not exists idx_order_status_log_order on order_status_log(order_id, created_at desc);
create index if not exists idx_job_logs_status on job_logs(status, created_at desc);

alter table order_status_log enable row level security;
alter table activity_events enable row level security;
alter table processed_jobs enable row level security;

create policy "allow all order_status_log" on order_status_log for all using (true);
create policy "allow all activity_events" on activity_events for all using (true);
create policy "allow all processed_jobs" on processed_jobs for all using (true);
