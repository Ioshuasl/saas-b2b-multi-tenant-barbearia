# Pesquisa — Billing e Planos (hipótese)

> Hipótese de empacotamento. Comparativo de mercado atualizado em [02 — Benchmark](../02-benchmark-mercado.md). Cobrança **manual no MVP**: [ADR-0010](../adr/0010-billing-saas-manual-mvp.md). Candidatos de gateway: [pesquisa/provedores-pagamento.md](./provedores-pagamento.md).

## Modelo de cobrança

Assinatura mensal **por rede (tenant)**, com faixa de preço conforme número de profissionais ativos, mais um adicional por unidade extra. Evita cobrar por assento (que faz o dono "esconder" barbeiros) e escala com o tamanho do cliente.

| Plano | Profissionais | Unidades inclusas | Preço/mês (hipótese) | Inclui |
|---|---|---|---|---|
| **Solo** | 1 | 1 | R$ 49 | Agenda, página pública, lembrete por e-mail, relatório básico |
| **Barbearia** | até 5 | 1 | R$ 99 | Tudo do Solo + WhatsApp, múltiplos profissionais, comissões |
| **Pro** | até 12 | até 3 | R$ 179 | Tudo + relatórios avançados, exportação, prioridade no suporte |
| **Rede** | até 30 | até 10 | R$ 349 | Tudo + consolidado da rede, gerentes por unidade |

Unidade adicional além do incluído no plano: **+R$ 39/mês** (hipótese). Motivo de cobrar por unidade e não só por profissional: a unidade extra gera página pública, agenda e suporte próprios — é custo real nosso e valor claro para o cliente.

Anual com 2 meses grátis (−17%). Preços são hipótese a validar com os 3 pilotos; não travar no código (planos vêm de configuração/provedor).

**Trial:** 14 dias, sem cartão, plano Pro completo (permite testar 2–3 unidades). Sem cartão aumenta o topo do funil; a conversão se ganha com valor entregue no onboarding (J1).

## Estados da assinatura

```
TRIALING ──(pagamento ok)──► ACTIVE
TRIALING ──(trial expira sem cartão)──► PAST_DUE
ACTIVE   ──(falha de pagamento)──► PAST_DUE
PAST_DUE ──(contato humano, prazo acordado)──► NEGOTIATING
PAST_DUE | NEGOTIATING ──(pagamento ok)──► ACTIVE
NEGOTIATING ──(grace_until vencido, aviso de 3 dias)──► SUSPENDED
SUSPENDED ──(90 dias)──► purge dos dados
qualquer ──(cancelamento pelo dono)──► CANCELED
```

**Decisão de negócio: nada é desativado automaticamente por inadimplência.** Antes de qualquer corte, a plataforma entra em contato e **negocia um prazo** com a barbearia. Derrubar a página pública de quem está devendo prejudica o cliente final (que perde o horário) e destrói a relação comercial — o custo de manter um tenant no ar por mais algumas semanas é baixo perto disso.

Comportamento por estado:

| Estado | Página pública | Painel | Notificações |
|---|---|---|---|
| TRIALING | ativa | completo | ativas |
| ACTIVE | ativa | completo | ativas |
| PAST_DUE | **ativa** | completo + banner discreto de pendência | ativas |
| NEGOTIATING | **ativa** até `grace_until` | completo + banner com a data acordada | ativas |
| SUSPENDED | desativada (exibe "agende pelo WhatsApp" com o telefone da unidade) | só tela de pagamento e exportação de dados | desativadas |
| CANCELED | desativada | exportação por 90 dias | desativadas |

Campo `subscriptions.grace_until`: prazo acordado, definido **manualmente** pelo `platform_admin` no back-office, com motivo obrigatório e registro em `audit_logs`. Enquanto `now() < grace_until`, nenhum job pode suspender o tenant.

Nunca apagar dados por inadimplência antes de 90 dias de `SUSPENDED` — o dono precisa poder voltar.

## Régua de cobrança

- D-2 do fim do trial: e-mail + banner.
- D0: fim do trial.
- Falha de pagamento: retentativas em D+1, D+3, D+5, D+7 (dunning do provedor), com e-mail a cada tentativa.
- **D+8: tarefa de contato humano** no back-office (não é e-mail automático) — ligar/WhatsApp, entender e acordar prazo → `NEGOTIATING` com `grace_until`.
- Prazo acordado vencido sem pagamento e sem nova negociação: aviso com 3 dias de antecedência e então `SUSPENDED`.

O back-office precisa de uma fila "tenants a cobrar" com dias em atraso, valor, histórico de contato e botão de estender prazo. Sem isso a política de negociação vira esquecimento.

## Provedor de pagamento

Ainda **não escolhido** para a fase 2. Comparativo legado: [provedores-pagamento.md](./provedores-pagamento.md). MVP: adapter manual ([ADR-0010](../adr/0010-billing-saas-manual-mvp.md)).

## Regras de implementação

1. **Webhook é a fonte da verdade.** O retorno do browser só mostra "processando".
2. **Idempotência:** `webhook_events.provider_event_id UNIQUE`; reprocessamento não duplica efeito.
3. **Reconciliação diária:** job compara o estado local das assinaturas com o provedor e alerta divergências.
4. Nenhum dado de cartão trafega ou é armazenado por nós (checkout hospedado / tokenização).
5. Mudança de plano: upgrade imediato com pró-rata; downgrade no fim do ciclo. Bloquear downgrade se o número de profissionais **ou de unidades** ativas exceder o limite do plano — com mensagem explicando quantos desativar.
6. Criar unidade acima do incluído no plano dispara upgrade/adesão do adicional, com confirmação explícita de preço antes de salvar. Nunca cobrar a mais sem o dono ver o novo valor.
6. Feature flags por plano lidas de uma tabela `plan_features`, nunca hardcoded em `if plan == 'pro'` espalhado.

## Métricas de billing a instrumentar desde o dia 1
MRR, novos MRR/churn/expansão (unidade extra é a principal alavanca de expansão), conversão trial→pago, tempo até primeira cobrança, inadimplência (% PAST_DUE + NEGOTIATING), tempo médio de recuperação após negociação, LTV estimado. Ver [14 — Métricas](../14-metricas-kpis.md).
