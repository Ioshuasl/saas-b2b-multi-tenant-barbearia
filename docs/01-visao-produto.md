# 01 — Visão de Produto

## Problema

Barbearias pequenas e médias (1 a 10 cadeiras) operam a agenda por WhatsApp e caderno. Consequências:

- **Tempo perdido:** o barbeiro interrompe o corte para responder mensagem e marcar horário.
- **No-show:** sem lembrete automático, 15–30% dos horários marcados por WhatsApp furam.
- **Buracos na agenda:** horários vagos não são preenchidos porque ninguém sabe que estão vagos.
- **Zero histórico:** o dono não sabe quanto cada barbeiro produziu, quais serviços vendem mais, nem quem são os clientes recorrentes.
- **Comissão manual:** cálculo de comissão no fim do mês em planilha ou de cabeça.

## Proposta de valor

> "Sua barbearia recebe agendamentos 24h por dia, sem você parar de cortar."

Para o **dono**: uma página de agendamento própria (`barbearia.app/nome-da-barbearia`), agenda unificada de todos os barbeiros, e relatório simples de faturamento e comissão.

Para o **barbeiro**: agenda do dia no celular, sem instalar app.

Para o **cliente final**: marcar horário em 30 segundos, sem baixar nada e sem conversar com ninguém.

## Por que agora / por que multi-tenant B2B

- Barbearia é um nicho com alta densidade e boca a boca forte — CAC baixo via indicação.
- Ticket médio de software para o segmento: R$ 50–200/mês. Volume compensa.
- Multi-tenant com infraestrutura compartilhada é o único modelo com margem viável nesse ticket.

## Concorrência (Brasil)

| Concorrente | Força | Brecha que exploramos |
|---|---|---|
| Trinks | Marca forte, marketplace | Caro e complexo para barbearia pequena |
| Booksy | App de consumidor com base grande | Cobra por profissional; onboarding lento |
| Agendor/planilhas/WhatsApp | Grátis | Sem automação, sem lembrete, sem relatório |
| Belasis / AppBarber | Focado no nicho | UX datada; setup exige suporte humano |

**Posicionamento:** o mais simples de configurar. Meta: barbearia cria conta e publica a página de agendamento em **menos de 10 minutos, sozinha, sem falar com vendedor** (self-service puro).

## Anti-objetivos (o que o produto NÃO é)

- Não é marketplace de descoberta de barbearias (não competimos com Booksy no B2C).
- Não é ERP/contabilidade.
- Não é app nativo no MVP — é web responsivo (PWA opcional depois).
- Não é solução para salões de beleza grandes com estoque e múltiplas unidades (fase 2+).

## Modelo de negócio

Assinatura mensal por barbearia (tenant), com faixa de preço por número de profissionais. Trial de 14 dias sem cartão. Detalhe em [08 — Billing e Planos](08-billing-planos.md).
