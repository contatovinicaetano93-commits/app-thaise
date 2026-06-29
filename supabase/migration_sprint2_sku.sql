-- Sprint 2: pedido de SKU (Thaise → fornecedor cadastra → Thaise aprova)

create table if not exists sku_requests (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  supplier_id uuid not null references suppliers(id) on delete cascade,
  name text not null,
  category text not null default 'Outro',
  unit text not null default 'un',
  quantity_estimated integer check (quantity_estimated is null or quantity_estimated > 0),
  due_date date,
  notes text,
  status text not null default 'open'
    check (status in ('open', 'submitted', 'approved', 'rejected', 'cancelled')),
  product_id uuid references products(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_sku_requests_project on sku_requests(project_id, status);
create index if not exists idx_sku_requests_supplier on sku_requests(supplier_id, status);

create trigger sku_requests_updated_at
  before update on sku_requests
  for each row execute function update_updated_at();

alter table products
  add column if not exists sku_request_id uuid references sku_requests(id) on delete set null,
  add column if not exists project_id uuid references projects(id) on delete set null,
  add column if not exists catalog_status text not null default 'approved'
    check (catalog_status in ('pending', 'approved', 'rejected'));

create index if not exists idx_products_sku_request on products(sku_request_id);
create index if not exists idx_products_project on products(project_id);

-- Produtos legados permanecem aprovados
update products set catalog_status = 'approved' where catalog_status is null;

alter table sku_requests enable row level security;

create policy "gestor sku_requests all" on sku_requests for all
  using (current_user_role() = 'gestor');

create policy "fornecedor sku_requests read" on sku_requests for select
  using (
    current_user_role() = 'fornecedor'
    and supplier_id = current_supplier_id()
  );

create policy "fornecedor sku_requests update open" on sku_requests for update
  using (
    current_user_role() = 'fornecedor'
    and supplier_id = current_supplier_id()
    and status = 'open'
  );
