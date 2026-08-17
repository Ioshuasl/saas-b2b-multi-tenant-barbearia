# 14 — Métricas e KPIs

Estrutura **idêntica** ao prontuário odontológico de referência (8 seções). North star e eventos de produto são do domínio da barbearia; metas SaaS e operacionais são as mesmas.

## 1. North star metric

> **Agendamentos confirmados por unidade ativa por semana.**

(Medir por unidade, não só por tenant — senão uma rede de 5 lojas mascara 4 lojas inativas.)

Racional: essa métrica só cresce se a barbearia realmente publica a página, recebe marcações e opera a agenda. Captura adoção e valor entregue — diferente de "contas criadas", que cresce com marketing sem provar uso. Meta pós-MVP: ≥ 40/semana por unidade.

**Definição de unidade ativa:** ≥ 5 agendamentos criados nos últimos 7 dias. **Tenant ativo:** ao menos uma unidade ativa.

## 2. Métricas de produto (por tenant / unidade)

| Categoria | Métrica | Definição | Meta piloto |
| --- | --- | --- | --- |
| Ativação | Tempo até publicar a página | signup → onboarding `Publicar` | < 10 min (p90 < 20 min); medir loja única vs rede |
| Ativação | Tenants que completam o onboarding | % que finaliza o wizard | ≥ 60% (J1) |
| Ativação | Tempo até o 1º agendamento | signup → primeiro agendamento criado | < 15 min após publicar |
| Ativação | Primeiro agendamento pela página pública | % dos ativados com `source = PUBLIC_PAGE` | ≥ 50% — momento "aha" |
| Adoção | DAU/MAU por tenant | usuários ativos diários / mensais | ≥ 0,6 (uso diário) |
| Adoção | % de agendamentos criados no sistema (não caderno) | origem auditada | 100% no piloto |
| Adoção | % de unidades com WhatsApp conectado | sessão WAHA `CONNECTED` | ≥ 70% |
| Valor | Taxa de no-show | `NO_SHOW / (COMPLETED + NO_SHOW)` | queda ≥ 20% pós-lembretes |
| Valor | Taxa de confirmação | confirmados / notificados | ≥ 60% |
| Valor | % da agenda vinda da página pública | `PUBLIC_PAGE / total` | acompanhar tendência |
| Eficiência | Telas para agendar (público) | telemetria de UI | ≤ 4 telas |
| Retenção | Retenção de tenant mês a mês | tenants ativos que seguem ativos | ≥ 95% |
| Qualidade | Erros por sessão | erros 5xx + exceções de UI | < 0,01 |

## 3. Métricas de negócio SaaS

| Métrica | Definição | Meta ano 1 |
| --- | --- | --- |
| MRR | Receita recorrente mensal | crescimento composto ≥ 10%/mês na fase inicial |
| ARPA | MRR / tenants pagantes | ≥ R$ 130 |
| Conversão trial → pago | pagantes / trials iniciados | ≥ 25% |
| CAC | custo de aquisição por cliente | ≤ 3× ARPA |
| LTV/CAC | — | ≥ 3 |
| Churn de receita | receita perdida / MRR inicial | ≤ 3%/mês |
| Payback de CAC | meses para recuperar o CAC | ≤ 6 meses |
| Margem bruta | (receita − custo de infra − custo de mensagem) / receita | ≥ 80% |
| Custo variável por tenant | infra + mensagens + storage | ≤ R$ 25/mês |
| NPS | pesquisa trimestral (dono) | ≥ 50 |
| CSAT do suporte | pós-atendimento | ≥ 90% |
| MRR de expansão | unidades extras / upgrade de plano | principal alavanca na base |
| Inadimplência negociada | % em `PAST_DUE` + `NEGOTIATING` e taxa de recuperação | valida a política de não suspender automaticamente |

### Unit economics de referência (hipótese a validar)

```
Preço médio (ARPA)                 R$ 130/mês
Custo de infra por tenant          R$   6/mês
Custo de storage por tenant        R$   3/mês
Mensagens (WAHA self-hosted)       R$   0       (sem tarifa Meta; custo na VPS/sessão)
Suporte (rateio)                   R$  12/mês
──────────────────────────────────────────────
Margem de contribuição             R$ 109/mês   (~84%)
```

Se o CAC ficar em R$ 390 (3× ARPA), o payback é de ~3,6 meses — saudável para SMB, desde que o churn fique abaixo de 3%/mês.

## 4. Métricas operacionais e de saúde técnica

| Métrica | Alvo | Alerta |
| --- | --- | --- |
| Disponibilidade mensal | ≥ 99,5% | < 99,5% |
| p95 de latência da API | < 300 ms (availability < 500 ms) | > 1 s por 10 min |
| Taxa de erro 5xx | < 0,1% | > 1% em 5 min |
| Idade máxima de job na fila | < 2 min | > 10 min |
| Taxa de falha de envio WhatsApp | < 2% | > 10% |
| Taxa de entrega de lembretes | ≥ 95% | < 90% |
| Sessão WAHA desconectada | 0 sem alerta | qualquer queda sem aviso |
| Jobs em DLQ | 0 | > 0 |
| Lag de processamento do outbox | < 10 s | > 60 s |
| Overbookings em produção | 0 | qualquer |
| Incidentes S1/S2 (vazamento tenant/unidade) | 0 por trimestre | qualquer |
| Tempo de restauração de backup (ensaio) | < 4 h | > 4 h |
| Falhas de build no CI | < 10% dos PRs | tendência crescente |
| Vulnerabilidades altas em dependências | 0 | qualquer |

## 5. Instrumentação — o que registrar

**Eventos de produto** (nome + propriedades, sem PII):

```
tenant_created            { plan, source }
location_created          { isDefault }
onboarding_step_completed { step, durationMs }
onboarding_completed      { durationMs, locationCount }
service_created           { visibleOnline }
staff_invited             { role }
appointment_created       { origin, leadTimeHours, locationId }
appointment_status_changed{ from, to, actorType }
public_page_viewed        { tenantSlug, locationSlug }
location_selector_viewed  { locationCount }
availability_viewed       { days }
booking_abandoned         { step }
notification_sent         { channel, provider, templateKey }
notification_failed       { channel, provider, errorCode }
report_exported           { report, format }
subscription_status_changed { from, to }
plan_limit_hit            { metric }
```

Todo evento carrega `tenant_id`, `location_id` (quando houver), `user_id`/`role` (quando houver), `plan` e `source`.

Regras: **nunca** enviar nome de cliente, telefone, notas ou tokens para ferramenta de analytics. Valores monetários vão em faixas (`bucket`) quando enviados a terceiros.

**Fonte da verdade:** para métricas de negócio críticas (no-show, receita, retenção, north star), o cálculo é feito por **SQL sobre o nosso banco** (views — detalhe no [doc 07](./07-modelo-de-dados.md) quando reescrito), não por ferramenta de analytics.

## 6. Painéis

### 6.1 Painel do cliente (dentro do produto)

- Hoje: agendamentos do dia por status, faturamento aproximado da unidade.
- Mês: faturamento `COMPLETED`, no-show, top serviços, comissão por profissional — por unidade e consolidado da rede (`OWNER`).
- Comparativo com o mês anterior.

### 6.2 Painel interno (plataforma)

- Crescimento: novos tenants, trials, conversão, MRR, churn, expansão por unidade.
- Saúde de uso: tenants/unidades por faixa de atividade (ativo diário / semanal / inativo 14 d = risco de churn).
- Funil de ativação por etapa do onboarding (onde a barbearia desiste).
- Custo por tenant (infra + sessões WAHA + storage) e margem por plano.
- Saúde técnica: latência, erros, filas, envios de WhatsApp, sessões desconectadas.
- Sinais de risco de privacidade: exportações em massa, acessos de suporte, rajada de 404 cross-tenant.

## 7. Alertas de negócio (não só técnicos)

| Sinal | Ação |
| --- | --- |
| Tenant sem login há 7 dias | Contato proativo do sucesso do cliente |
| Tenant com 0 agendamento na semana após onboarding | Ligação de ativação |
| Unidade inativa em rede com outras ativas | Investigar (churn anunciado) |
| Queda > 30% em agendamentos de um tenant | Investigar (churn iminente) |
| Trial em D-2 / D-0 | E-mail + banner; operação na fila de cobrança (billing manual) |
| Taxa de confirmação < 30% em um tenant | Revisar template/horário de envio / sessão WAHA |
| Sessão WAHA desconectada | Alerta na UI + e-mail; fallback de lembrete |
| Cota de storage > 90% | Aviso e oferta de upgrade |

## 8. Cadência de revisão

| Frequência | O que |
| --- | --- |
| Diária | Saúde técnica (erros, filas, latência, sessão WAHA) |
| Semanal | North star, ativação, uso por tenant/unidade, bugs abertos, fila de cobrança |
| Mensal | MRR, churn, conversão, margem, custo por tenant, no-show agregado |
| Trimestral | NPS, roadmap x realidade, unit economics, revisão de preço |
