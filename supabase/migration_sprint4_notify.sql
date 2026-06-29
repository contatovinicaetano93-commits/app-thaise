-- Sprint 4: log de notificações de pedido (WhatsApp / e-mail)

create table if not exists order_notifications (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete cascade,
  channel text not null check (channel in ('whatsapp', 'email', 'in_app')),
  status text not null check (status in ('sent', 'failed', 'stub')),
  recipient text,
  message text,
  error text,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_order_notifications_order on order_notifications(order_id, created_at desc);

alter table order_notifications enable row level security;

create policy "gestor order_notifications all" on order_notifications for all
  using (current_user_role() = 'gestor');
