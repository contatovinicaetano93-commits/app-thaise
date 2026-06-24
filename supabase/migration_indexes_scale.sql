-- Passos 91–92: índices para listagens e filtros em escala

create index if not exists idx_orders_created_at on orders (created_at desc);
create index if not exists idx_orders_status on orders (status);
create index if not exists idx_orders_supplier_id on orders (supplier_id);
create index if not exists idx_orders_client_id on orders (client_id);
create index if not exists idx_orders_project_id on orders (project_id);

create index if not exists idx_projects_updated_at on projects (updated_at desc);
create index if not exists idx_projects_client_id on projects (client_id);
create index if not exists idx_projects_phase on projects (phase);
create index if not exists idx_projects_status on projects (status);

create index if not exists idx_suppliers_created_at on suppliers (created_at desc);
create index if not exists idx_suppliers_status on suppliers (status);
create index if not exists idx_suppliers_name on suppliers (name);

create index if not exists idx_clients_created_at on clients (created_at desc);
create index if not exists idx_clients_name on clients (name);

create index if not exists idx_products_supplier_id on products (supplier_id);
create index if not exists idx_products_created_at on products (created_at desc);
create index if not exists idx_products_active on products (active) where active = true;

create index if not exists idx_activity_events_entity on activity_events (entity_type, entity_id, created_at desc);
create index if not exists idx_job_logs_status on job_logs (status, created_at desc);
