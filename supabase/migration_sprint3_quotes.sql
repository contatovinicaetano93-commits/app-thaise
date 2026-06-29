-- Sprint 3: orçamentos da obra (versões + aprovação do cliente)

create table if not exists project_quotes (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid not null references projects(id) on delete cascade,
  client_id uuid not null references clients(id) on delete cascade,
  version integer not null default 1 check (version >= 1),
  title text not null default 'Orçamento',
  status text not null default 'draft'
    check (status in ('draft', 'sent', 'approved', 'rejected', 'cancelled')),
  notes text,
  total_price numeric(14,2) not null default 0,
  sent_at timestamptz,
  decided_at timestamptz,
  decided_by uuid references auth.users(id) on delete set null,
  rejection_note text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists project_quote_lines (
  id uuid primary key default uuid_generate_v4(),
  quote_id uuid not null references project_quotes(id) on delete cascade,
  product_id uuid not null references products(id) on delete restrict,
  supplier_id uuid not null references suppliers(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12,2) not null check (unit_price > 0),
  line_total numeric(14,2) generated always as (quantity * unit_price) stored,
  notes text,
  sort_order integer not null default 0,
  created_at timestamptz default now()
);

create index if not exists idx_project_quotes_project on project_quotes(project_id, version desc);
create index if not exists idx_project_quotes_client on project_quotes(client_id, status);
create index if not exists idx_project_quote_lines_quote on project_quote_lines(quote_id, sort_order);

create trigger project_quotes_updated_at
  before update on project_quotes
  for each row execute function update_updated_at();

alter table project_quotes enable row level security;
alter table project_quote_lines enable row level security;

create policy "gestor project_quotes all" on project_quotes for all
  using (current_user_role() = 'gestor');

create policy "cliente read project_quotes" on project_quotes for select
  using (
    current_user_role() = 'cliente'
    and client_id = current_client_id()
    and status in ('sent', 'approved', 'rejected')
  );

create policy "cliente decide project_quotes" on project_quotes for update
  using (
    current_user_role() = 'cliente'
    and client_id = current_client_id()
    and status = 'sent'
  );

create policy "gestor project_quote_lines all" on project_quote_lines for all
  using (current_user_role() = 'gestor');

create policy "cliente read project_quote_lines" on project_quote_lines for select
  using (
    current_user_role() = 'cliente'
    and exists (
      select 1 from project_quotes q
      where q.id = project_quote_lines.quote_id
        and q.client_id = current_client_id()
        and q.status in ('sent', 'approved', 'rejected')
    )
  );
