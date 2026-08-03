# 08 — Billing e Planos

## Modelo de cobrança

Assinatura mensal **por barbearia**, com faixa de preço conforme número de profissionais ativos. Evita cobrar por assento (que faz o dono "esconder" barbeiros) e ainda escala com o tamanho do cliente.

| Plano | Profissionais | Preço/mês (hipótese) | Inclui |
|---|---|---|---|
| **Solo** | 1 | R$ 49 | Agenda, página pública, lembrete por e-mail, relatório básico |
| **Barbearia** | até 5 | R$ 99 | Tudo do Solo + WhatsApp, múltiplos profissionais, comissões |
| **Pro** | até 12 | R$ 179 | Tudo + relatórios avançados, exportação, prioridade no suporte |

Anual com 2 meses grátis (−17%). Preços são hipótese a validar com os 3 pilotos; não travar no código (planos vêm de configuração/provedor).

**Trial:** 14 dias, sem cartão, plano Barbearia completo. Sem cartão aumenta o topo do funil; a conversão se ganha com valor entregue no onboarding (J1).

## Estados da assinatura

```
TRIALING ──(pagamento ok)──► ACTIVE ──(falha)──► PAST_DUE ──(15d)──► SUSPENDED ──(90d)──► purge
    │                           ▲                    │
    └──(trial expira sem cartão)┘                    └──(pagamento ok)──► ACTIVE
```

Comportamento por estado:

| Estado | Página pública | Painel | Notificações |
|---|---|---|---|
| TRIALING | ativa | completo | ativas |
| ACTIVE | ativa | completo | ativas |
| PAST_DUE | **desativada** (exibe "agende pelo WhatsApp") | somente leitura + banner de pagamento | só lembretes já agendados |
| SUSPENDED | desativada | só tela de pagamento e exportação de dados | desativadas |
| CANCELED | desativada | exportação por 90 dias | desativadas |

Nunca apagar dados por inadimplência antes de 90 dias — o dono precisa poder voltar.

## Régua de cobrança

- D-2 do fim do trial: e-mail + banner.
- D0: fim do trial.
- Falha de pagamento: retentativas em D+1, D+3, D+5, D+7 (dunning do provedor), com e-mail a cada tentativa.
- D+15 sem sucesso: `SUSPENDED`.

## Provedor de pagamento

Requisitos: cartão recorrente **e Pix recorrente/boleto** (parte relevante do público-alvo não usa cartão de crédito para assinatura), split não necessário no MVP, webhooks confiáveis, portal do cliente pronto.

| Opção | Prós | Contras |
|---|---|---|
| Stripe | DX excelente, portal e dunning prontos | Pix recorrente limitado no BR; taxas em USD-like |
| Asaas | Pix/boleto/cartão nativo BR, barato | DX inferior, portal fraco |
| Pagar.me / Iugu | BR completo, recorrência nativa | Integração mais trabalhosa |

**Recomendação:** começar com **um provedor BR (Asaas ou Pagar.me)** por causa de Pix/boleto, atrás de uma interface `PaymentProvider` no código para permitir troca. Decisão pendente em [12](12-riscos-decisoes.md).

## Regras de implementação

1. **Webhook é a fonte da verdade.** O retorno do browser só mostra "processando".
2. **Idempotência:** `webhook_events.provider_event_id UNIQUE`; reprocessamento não duplica efeito.
3. **Reconciliação diária:** job compara o estado local das assinaturas com o provedor e alerta divergências.
4. Nenhum dado de cartão trafega ou é armazenado por nós (checkout hospedado / tokenização).
5. Mudança de plano: upgrade imediato com pró-rata; downgrade no fim do ciclo. Bloquear downgrade se o número de profissionais ativos exceder o limite do plano — com mensagem explicando quantos desativar.
6. Feature flags por plano lidas de uma tabela `plan_features`, nunca hardcoded em `if plan == 'pro'` espalhado.

## Métricas de billing a instrumentar desde o dia 1
MRR, novos MRR/churn/expansão, conversão trial→pago, tempo até primeira cobrança, inadimplência (% PAST_DUE), LTV estimado. Ver [11](11-metricas.md).
