-- PLATAFORMA THAISE - Schema

create extension if not exists "uuid-ossp";

-- Fornecedores (QCPS)
create table suppliers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null,
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  website text,
  score_q numeric(3,1) not null default 5.0 check (score_q between 0 and 10),
  score_c numeric(3,1) not null default 5.0 check (score_c between 0 and 10),
  score_p numeric(3,1) not null default 5.0 check (score_p between 0 and 10),
  score_s numeric(3,1) not null default 5.0 check (score_s between 0 and 10),
  score numeric(3,1) generated always as ((score_q + score_c + score_p + score_s) / 4.0) stored,
  status text check (status in ('active', 'inactive', 'pending')) default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Clientes
create table clients (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  email text not null unique,
  phone text not null,
  company text,
  segment text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Empreendimentos (Fases A–F + QCPS)
create table projects (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  client_id uuid references clients(id) on delete set null,
  location text,
  description text,
  phase text not null check (phase in ('A','B','C','D','E','F')) default 'A',
  status text not null check (status in ('active','paused','completed','cancelled')) default 'active',
  score_q numeric(3,1) not null default 5.0 check (score_q between 0 and 10),
  score_c numeric(3,1) not null default 5.0 check (score_c between 0 and 10),
  score_p numeric(3,1) not null default 5.0 check (score_p between 0 and 10),
  score_s numeric(3,1) not null default 5.0 check (score_s between 0 and 10),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Produtos do catálogo (por fornecedor)
create table products (
  id uuid primary key default uuid_generate_v4(),
  supplier_id uuid references suppliers(id) on delete cascade,
  name text not null,
  description text,
  category text not null,
  price numeric(12,2) not null,
  unit text not null default 'un',
  min_order integer default 1,
  lead_time_days integer,
  active boolean default true,
  created_at timestamptz default now()
);

-- Pedidos
create table orders (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete set null,
  client_id uuid references clients(id),
  supplier_id uuid references suppliers(id),
  product_id uuid references products(id),
  quantity integer not null,
  unit_price numeric(12,2) not null,
  total_price numeric(12,2) generated always as (quantity * unit_price) stored,
  status text check (status in ('pending','approved','processing','delivered','cancelled')) default 'pending',
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Trigger updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger suppliers_updated_at before update on suppliers for each row execute function update_updated_at();
create trigger clients_updated_at before update on clients for each row execute function update_updated_at();
create trigger projects_updated_at before update on projects for each row execute function update_updated_at();
create trigger orders_updated_at before update on orders for each row execute function update_updated_at();

-- RLS
alter table suppliers enable row level security;
alter table clients enable row level security;
alter table projects enable row level security;
alter table products enable row level security;
alter table orders enable row level security;

create policy "allow all" on suppliers for all using (true);
create policy "allow all" on clients for all using (true);
create policy "allow all" on projects for all using (true);
create policy "allow all" on products for all using (true);
create policy "allow all" on orders for all using (true);
