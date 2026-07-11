-- Sprint 6: pagamentos em escrow condicionados à auditoria visual (Fase C)
-- Rode após migration_sprint5_polish.sql (idempotente)

create table if not exists order_payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null unique references orders(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  supplier_id uuid not null references suppliers(id) on delete restrict,
  amount numeric(14,2) not null check (amount > 0),
  status text not null default 'held'
    check (status in ('held', 'released', 'blocked', 'cancelled')),
  checklist_phase text check (checklist_phase in ('A','B','C','D','E','F')),
  checklist_item_id text,
  audit_status text check (audit_status in ('pending','passed','failed','override')),
  audit_score numeric(4,1),
  held_at timestamptz not null default now(),
  released_at timestamptz,
  released_by uuid references auth.users(id) on delete set null,
  release_notes text,
  pix_reference text,
  payment_method text not null default 'escrow'
    check (payment_method in ('escrow', 'manual_pix')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_order_payments_status on order_payments(status, held_at desc);
create index if not exists idx_order_payments_supplier on order_payments(supplier_id, status);
create index if not exists idx_order_payments_project on order_payments(project_id, status);

create trigger order_payments_updated_at
  before update on order_payments
  for each row execute function update_updated_at();

alter table order_payments enable row level security;

drop policy if exists "gestor order_payments all" on order_payments;
create policy "gestor order_payments all" on order_payments
  for all using (current_user_role() = 'gestor');

drop policy if exists "fornecedor read own payments" on order_payments;
create policy "fornecedor read own payments" on order_payments
  for select using (
    current_user_role() = 'fornecedor'
    and supplier_id = current_supplier_id()
  );
