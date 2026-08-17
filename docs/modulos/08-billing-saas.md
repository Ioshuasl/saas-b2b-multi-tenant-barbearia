# Módulo — Assinatura SaaS (`subscription`)

## 1. Responsabilidade

Contrato **plataforma → barbearia**: trial, planos, limites, estados, `grace_until`, fila de cobrança. Não confundir com [`billing`](./05-financeiro.md).

## 2. Planos (hipótese — [benchmark](../02-benchmark-mercado.md) + pesquisa billing)

| Recurso | Solo | Barbearia | Pro | Rede |
| --- | --- | --- | --- | --- |
| Preço/mês (referência) | R$ 49 | R$ 99 | R$ 179 | R$ 349 |
| Profissionais ativos | 1 | até 5 | até 12 | até 30 |
| Unidades inclusas | 1 | 1 | até 3 | até 10 |
| Agenda + página pública + e-mail | ✔ | ✔ | ✔ | ✔ |
| WhatsApp (WAHA) | Should | ✔ | ✔ | ✔ |
| Comissão + CSV | básico | ✔ | ✔ | ✔ |
| Relatório consolidado | — | — | ✔ | ✔ |

Unidade extra além do incluído: **+R$ 39/mês** (hipótese). Preço **não** vai hardcoded em `if plan ==`; `plan` + `plan_feature` + `limits` jsonb. Validar com piloto.

Posicionamento vs mercado: entrada abaixo de Trinks/Booksy/AppBarber na faixa Solo; **sem** fidelidade anual com multa; **sem** implantação obrigatória; WhatsApp no caminho feliz (não pacote à parte).

## 3. Ciclo de vida

```
TRIALING (14 d, sem cartão)
  ├─ operação ativa ──► ACTIVE
  └─ expira ──────────► PAST_DUE ──► NEGOTIATING (grace_until) ──► SUSPENDED ──► CANCELED
```

| Estado | Página pública | Painel | Notificações |
| --- | --- | --- | --- |
| `TRIALING` / `ACTIVE` | on | completo | on |
| `PAST_DUE` / `NEGOTIATING` (`now < grace_until`) | on | banner | on |
| `SUSPENDED` | off | instruções + exportação | off |
| `CANCELED` | off | exportação 90 d | off |

**Nada desliga sozinho por inadimplência.** `platform_admin` define `grace_until` com motivo em `audit_log` / `platform_audit_log`.

## 4. Cobrança no MVP

**Manual** ([ADR-0010](../adr/0010-billing-saas-manual-mvp.md)): operação altera status; `GET /subscription` para o OWNER; **sem checkout**. Port `SubscriptionBillingPort` existe; adapter = manual. Colunas `provider_*` reservadas.

Candidatos futuros (um ADR): Stripe, Mercado Pago, Asaas. Webhook será a fonte da verdade; o browser nunca ativa assinatura.

## 5. Limites

`PlanLimitGuard` em create de staff ativo e location. Estouro → `402 PLAN_LIMIT_EXCEEDED` com texto para falar com a operação. Downgrade bloqueado se uso &gt; novo limite.

## 6. Casos de uso

`GetSubscriptionService`, `ChangeStatusService` (só platform), `ExtendGraceService`, `AssertPlanLimitService`. Job diário: trial → `PAST_DUE`; **não** suspende sem `grace_until` vencido + ação humana (ou job após aviso de 3 dias documentado na operação).
