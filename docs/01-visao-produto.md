# 01 — Visão de Produto

## 1. Problema

Barbearias pequenas e médias (1 a 10 cadeiras), **de uma ou várias unidades**, operam a agenda por WhatsApp e caderno. Consequências:

- **Tempo perdido:** o barbeiro interrompe o corte para responder mensagem e marcar horário.
- **No-show:** sem lembrete automático, estimativas do setor apontam **15–35%** de faltas quando não há confirmação ativa ([02 — Benchmark](./02-benchmark-mercado.md)).
- **Buracos na agenda:** horários vagos não são preenchidos porque ninguém sabe que estão livres.
- **Zero histórico:** o dono não sabe quanto cada barbeiro produziu, quais serviços vendem mais, nem quem são os clientes recorrentes.
- **Comissão manual:** cálculo no fim do mês em planilha ou de cabeça.
- **Rede sem visão consolidada:** quem tem duas ou três lojas junta números à mão e não compara unidades.

## 2. Proposta de valor

> "Sua barbearia recebe agendamentos 24h por dia, sem você parar de cortar."

| Para quem | O que ganha |
| --- | --- |
| **Dono (`OWNER`)** | Página de agendamento própria (`/{tenant}` ou `/{tenant}/{unidade}`), agenda unificada, relatório de faturamento e comissão; com rede, consolidado por unidade |
| **Barbeiro (`STAFF`)** | Agenda do dia no celular, sem instalar app |
| **Cliente final** | Marcar em ≤ 4 telas, sem login e sem baixar nada |

Promessas mensuráveis que orientam o MVP:

| Promessa | Como entrega | Métrica |
| --- | --- | --- |
| **Menos furos** | Confirmação + lembretes 24 h e 2 h (WhatsApp + e-mail fallback) | Taxa de no-show |
| **Agenda como fonte única** | Link público integrado à grade real; overbooking impedido no banco | `first_public_booking`, uso diário da agenda |
| **Clareza para o dono** | Relatório do período + comissão por profissional | Retenção do tenant, NPS do piloto |

## 3. Diferenciais de posicionamento

Comparativo completo: [02 — Benchmark](./02-benchmark-mercado.md). Resumo:

1. **Link da marca, sem marketplace** — não competimos com Trinks/Booksy na descoberta B2C; o fluxo é Instagram → link.
2. **WhatsApp no servidor (WAHA GOWS)**, com e-mail fallback e ciência de risco — não upsell de pacote como Trinks ([ADR-0016](./adr/0016-waha-default-messaging.md)).
3. **Rede no MVP, UI de loja única** — `location_id` desde a S0; seletor oculto com uma unidade.
4. **Self-service ≤ 10 min**, trial 14 dias sem cartão, sem implantação obrigatória.
5. **Exportação self-service** — reduz medo de lock-in.
6. **Preço público e previsível** — hipótese em [pesquisa/billing-planos.md](./pesquisa/billing-planos.md); validar no piloto.

**Posicionamento:** o mais simples de configurar entre os concorrentes pagos do nicho.

## 4. Público-alvo

| Segmento | Perfil | MVP |
| --- | --- | --- |
| **Alvo primário** | 1–5 cadeiras, 1 unidade, dono decide sozinho | Onboarding oculto de rede; wizard ≤ 10 min |
| **Alvo secundário** | Rede 2–5 unidades, mesmo dono | Seletor, consolidado, escopo por `user_locations` |
| Fora do escopo inicial | Franquias 10+ unidades, salão com estoque/NFS-e | Roadmap pós-MVP |

## 5. Concorrência (Brasil)

| Concorrente | Força | Brecha |
| --- | --- | --- |
| Trinks | Marca, marketplace, rede/franquia | Caro; WhatsApp à parte; complexo para loja pequena |
| Booksy | App consumidor, preço único | +R$ 20/agenda; marketplace |
| AppBarber | Nicho barbearia, trial longo | Cliente precisa do app; lembrete push/SMS |
| Belasis | IA, sinal, clube | Demo/vendas; rede no plano alto |
| Caderno + WhatsApp | Grátis | Sem automação, sem relatório |

Os que atendem **rede** cobram como produto enterprise; os baratos assumem **uma loja**. Nossa brecha: rede **sem** complicar quem tem uma loja só.

## 6. Modelo de negócio

- Assinatura mensal por **rede (tenant)**, faixa por profissionais ativos + adicional por unidade extra.
- **Trial 14 dias sem cartão**; plano completo para testar multi-unidade.
- **Cobrança manual no MVP** ([ADR-0010](./adr/0010-billing-saas-manual-mvp.md)); gateway na fase 2 ([pesquisa/provedores-pagamento.md](./pesquisa/provedores-pagamento.md)).
- Hipótese de planos: Solo R$ 49 · Barbearia R$ 99 · Pro R$ 179 · Rede R$ 349 — **não travar no código**.

## 7. Escopo funcional macro

```
MVP (fase 1)                 MVP+ (fase 2)              Pós-MVP
─────────────────            ─────────────────            ─────────────
Identidade + rede            Inbox WhatsApp               App nativo
Cadastros + agenda           Sinal / pagamento antecipado   Estoque / comanda
Página pública               Google Calendar              NFS-e / maquininha
Clientes + notificações      Fila de espera               Marketplace (anti-objetivo)
Financeiro básico            Clube / fidelidade           Whitelabel
Relatórios                   Caixa do dia                 API pública
Billing manual               Gateway automático           SSO
Plataforma + LGPD            Domínio próprio
```

Detalhe: [04 — Escopo do MVP](./04-escopo-mvp.md), [requisitos/](./requisitos/), [modulos/](./modulos/).

## 8. Anti-objetivos

- Não é marketplace de descoberta de barbearias.
- Não é ERP/contabilidade/estoque no MVP.
- Não é app nativo no MVP — web responsivo (PWA opcional depois).
- Não é salão de beleza grande com comanda, estoque e fiscal — **redes de barbearia** entram no MVP; estoque e DRE por unidade ficam fora.

## 9. Princípios de produto

1. **O fluxo do barbeiro manda.** Se agendar ou mudar status exige mais cliques do que o caderno, perdemos.
2. **Loja única não paga taxa de complexidade** — rede é opt-in invisível até precisar.
3. **WhatsApp cai, agenda não.** Fallback por e-mail; nunca bloquear agendamento por sessão caída.
4. **Dado do tenant é do tenant** — exportação e DPA; plataforma é operadora LGPD.
5. **Decisões fechadas viram ADR** — não reabrir WAHA/billing/hosting na implementação.

## Referências

- [02 — Benchmark](./02-benchmark-mercado.md)
- [03 — Personas e Jornadas](./03-personas-jornadas.md)
- [04 — Escopo do MVP](./04-escopo-mvp.md)
- [14 — Métricas](./14-metricas-kpis.md)
