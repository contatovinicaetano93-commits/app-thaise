# Fluxo SIPOC — Estlar Hub

| Papel | Entidade | Descrição |
|-------|----------|-----------|
| **S** — Supplier | `suppliers` | Fornecedores curados; homologação em `/pending-suppliers` |
| **I** — Input | `clients`, `products`, `projects` | Cliente + catálogo + empreendimento |
| **P** — Process | Fases A–F, `orders`, QCPS | Jornada guiada e pedidos |
| **O** — Output | Pedidos entregues, scores | Entrega + retroalimentação QCPS |
| **C** — Customer | `clients` | Cliente final valida valor |

## Gates implementados

- Empreendimento **exige cliente** (POST `/api/projects`)
- Produto **exige fornecedor ativo** (POST `/api/products`)
- Pedido **exige fornecedor ativo + produto válido** (POST `/api/orders`)

## Visualização

- Mapa completo: `/sipoc`
- Badge `I→P→O` nos cards de pedidos

Código fonte: `src/lib/sipoc.ts`
