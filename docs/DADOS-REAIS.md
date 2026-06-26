# Dados reais — Guia rápido (Thaise)

**Site:** https://app-thaise.vercel.app/login  
**Gestor:** `thaise@plataforma.com`

---

## Fluxo diário

1. **Pipeline** → lead comercial  
2. **Converter** → cliente + empreendimento  
3. **Homologação** → aprovar fornecedor  
4. **Catálogo** → produtos do fornecedor  
5. **Pedidos** → criar e acompanhar até entregue  
6. **Convidar usuário** → login fornecedor/cliente  

---

## Criar login (sem Supabase manual)

**Sistema → Convidar usuário** ou menu ⋮ em Clientes/Fornecedores → **Criar login**

Enviar à pessoa:
```
Site: https://app-thaise.vercel.app/login
E-mail: [cadastrado]
Senha: [senha inicial]
```

---

## Migrations (rodar uma vez no Supabase SQL Editor)

Ordem recomendada:

1. `migration_realtime.sql`
2. `migration_rls_by_role.sql`
3. `migration_storage_checklist.sql`
4. `migration_pipeline.sql`
5. `migration_estlar_eos.sql` (relatório 360, intake, diário)

Verificar: `npm run setup:migrations`

---

## Limpar dados demo (opcional)

```bash
npm run cleanup:demo                    # dry-run
CONFIRM_CLEANUP=1 npm run cleanup:demo -- --apply
```

Não remove usuários Auth — só registros com e-mail demo.

---

## Esqueci minha senha

Na tela de login → **Esqueci minha senha** (requer SMTP configurado no Supabase Auth).
