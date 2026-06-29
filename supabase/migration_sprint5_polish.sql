-- Sprint 5: bloquear re-fulfill + status fulfilled

alter table project_quotes drop constraint if exists project_quotes_status_check;
alter table project_quotes add constraint project_quotes_status_check
  check (status in ('draft', 'sent', 'approved', 'rejected', 'cancelled', 'fulfilled'));

alter table project_quotes add column if not exists fulfilled_at timestamptz;

-- Cliente pode ver orçamentos já convertidos em pedidos
drop policy if exists "cliente read project_quotes" on project_quotes;
create policy "cliente read project_quotes" on project_quotes for select
  using (
    current_user_role() = 'cliente'
    and client_id = current_client_id()
    and status in ('sent', 'approved', 'rejected', 'fulfilled')
  );
