-- RLS restritivo em tabelas sensíveis (rodar após migration_rls_by_role.sql)
-- Idempotente.

-- ── activity_events: gestor vê tudo; demais só via API com checagem de entidade
drop policy if exists "allow all activity" on activity_events;
drop policy if exists "allow all activity_events" on activity_events;
drop policy if exists "authenticated read activity" on activity_events;
drop policy if exists "gestor activity all" on activity_events;

drop policy if exists "entity owner read activity" on activity_events;

create policy "gestor activity all" on activity_events
  for all using (current_user_role() = 'gestor');

create policy "entity owner read activity" on activity_events
  for select using (
    (entity_type = 'order' and exists (
      select 1 from orders o
      where o.id = activity_events.entity_id
      and (
        (current_user_role() = 'fornecedor' and o.supplier_id = current_supplier_id())
        or (current_user_role() = 'cliente' and o.client_id = current_client_id())
      )
    ))
    or (entity_type = 'project' and exists (
      select 1 from projects p
      where p.id = activity_events.entity_id
      and current_user_role() = 'cliente'
      and p.client_id = current_client_id()
    ))
    or (entity_type = 'supplier'
      and current_user_role() = 'fornecedor'
      and entity_id = current_supplier_id())
    or (entity_type = 'client'
      and current_user_role() = 'cliente'
      and entity_id = current_client_id())
  );

-- ── order_status_log: gestor + donos do pedido (via join implícito na API)
drop policy if exists "allow all order_status_log" on order_status_log;
drop policy if exists "gestor order_status_log all" on order_status_log;

create policy "gestor order_status_log all" on order_status_log
  for all using (current_user_role() = 'gestor');

create policy "order owner read status log" on order_status_log
  for select using (
    exists (
      select 1 from orders o
      where o.id = order_status_log.order_id
      and (
        (current_user_role() = 'fornecedor' and o.supplier_id = current_supplier_id())
        or (current_user_role() = 'cliente' and o.client_id = current_client_id())
      )
    )
  );

-- ── job_logs: só gestor
drop policy if exists "allow all job_logs" on job_logs;
drop policy if exists "gestor job_logs all" on job_logs;

create policy "gestor job_logs all" on job_logs
  for all using (current_user_role() = 'gestor');

-- ── agent_insights: só gestor
drop policy if exists "allow all agent_insights" on agent_insights;
drop policy if exists "gestor agent_insights all" on agent_insights;

create policy "gestor agent_insights all" on agent_insights
  for all using (current_user_role() = 'gestor');

-- ── webhooks: só gestor
drop policy if exists "allow all webhooks" on webhooks;
drop policy if exists "gestor webhooks all" on webhooks;

create policy "gestor webhooks all" on webhooks
  for all using (current_user_role() = 'gestor');

-- ── processed_jobs: só gestor (interno)
drop policy if exists "allow all processed_jobs" on processed_jobs;
drop policy if exists "gestor processed_jobs all" on processed_jobs;

create policy "gestor processed_jobs all" on processed_jobs
  for all using (current_user_role() = 'gestor');
