-- RLS por role (gestor / fornecedor / cliente)
-- Rode no SQL Editor após migration_realtime.sql
-- Idempotente: pode rodar mais de uma vez sem erro.
-- Service role bypassa RLS; rotas da API usam sessão do usuário.

create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function public.current_supplier_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select supplier_id from profiles where id = auth.uid()
$$;

create or replace function public.current_client_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select client_id from profiles where id = auth.uid()
$$;

-- ── Suppliers ──
drop policy if exists "allow all" on suppliers;
drop policy if exists "gestor suppliers all" on suppliers;
drop policy if exists "fornecedor read own supplier" on suppliers;
drop policy if exists "fornecedor update own supplier" on suppliers;

create policy "gestor suppliers all" on suppliers
  for all using (current_user_role() = 'gestor');

create policy "fornecedor read own supplier" on suppliers
  for select using (
    current_user_role() = 'fornecedor'
    and id = current_supplier_id()
  );

create policy "fornecedor update own supplier" on suppliers
  for update using (
    current_user_role() = 'fornecedor'
    and id = current_supplier_id()
  );

-- ── Clients ──
drop policy if exists "allow all" on clients;
drop policy if exists "gestor clients all" on clients;
drop policy if exists "cliente read own client" on clients;

create policy "gestor clients all" on clients
  for all using (current_user_role() = 'gestor');

create policy "cliente read own client" on clients
  for select using (
    current_user_role() = 'cliente'
    and id = current_client_id()
  );

-- ── Projects ──
drop policy if exists "allow all" on projects;
drop policy if exists "gestor projects all" on projects;
drop policy if exists "cliente read own projects" on projects;

create policy "gestor projects all" on projects
  for all using (current_user_role() = 'gestor');

create policy "cliente read own projects" on projects
  for select using (
    current_user_role() = 'cliente'
    and client_id = current_client_id()
  );

-- ── Products ──
drop policy if exists "allow all" on products;
drop policy if exists "gestor products all" on products;
drop policy if exists "fornecedor products own" on products;
drop policy if exists "cliente read active products" on products;

create policy "gestor products all" on products
  for all using (current_user_role() = 'gestor');

create policy "fornecedor products own" on products
  for all using (
    current_user_role() = 'fornecedor'
    and supplier_id = current_supplier_id()
  );

create policy "cliente read active products" on products
  for select using (
    current_user_role() = 'cliente'
    and active = true
  );

-- ── Orders ──
drop policy if exists "allow all" on orders;
drop policy if exists "gestor orders all" on orders;
drop policy if exists "fornecedor orders own" on orders;
drop policy if exists "fornecedor update own orders" on orders;
drop policy if exists "cliente orders own" on orders;

create policy "gestor orders all" on orders
  for all using (current_user_role() = 'gestor');

create policy "fornecedor orders own" on orders
  for select using (
    current_user_role() = 'fornecedor'
    and supplier_id = current_supplier_id()
  );

create policy "fornecedor update own orders" on orders
  for update using (
    current_user_role() = 'fornecedor'
    and supplier_id = current_supplier_id()
  );

create policy "cliente orders own" on orders
  for select using (
    current_user_role() = 'cliente'
    and client_id = current_client_id()
  );

-- ── Activity events (leitura filtrada) ──
drop policy if exists "allow all activity_events" on activity_events;
drop policy if exists "gestor activity all" on activity_events;
drop policy if exists "authenticated read activity" on activity_events;

create policy "gestor activity all" on activity_events
  for all using (current_user_role() = 'gestor');

create policy "authenticated read activity" on activity_events
  for select using (auth.uid() is not null);
