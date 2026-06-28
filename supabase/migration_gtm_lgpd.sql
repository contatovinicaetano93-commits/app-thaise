-- GTM Dia 1: consentimento LGPD no intake público
alter table opportunities add column if not exists intake_consent_at timestamptz;
alter table opportunities add column if not exists intake_consent_version text;
alter table opportunities add column if not exists intake_consent_ip text;

comment on column opportunities.intake_consent_at is 'Timestamp do aceite LGPD no formulário público /intake';
comment on column opportunities.intake_consent_version is 'Versão do texto de privacidade aceito (ex. 2026-07-01)';
comment on column opportunities.intake_consent_ip is 'IP de origem no momento do consentimento (auditoria)';
