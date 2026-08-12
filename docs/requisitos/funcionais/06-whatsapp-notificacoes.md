# RF — WhatsApp e Notificações (E6)

**Módulo:** `messaging` · **Detalhe:** [modulos/06-whatsapp-notificacoes.md](../../modulos/06-whatsapp-notificacoes.md) · Pesquisa: [pesquisa/whatsapp-notificacoes.md](../../pesquisa/whatsapp-notificacoes.md)

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E6-01 | Toda notificação passa por interface `WhatsAppProvider` + canal e-mail; troca de provedor sem mudar casos de uso | Must | ADR futuro, pesquisa WhatsApp |
| RF-E6-02 | Em dev/teste/piloto: WhatsApp via Evolution API **ou** WAHA (decisão pendente entre os dois); produção paga migra para API oficial | Must | Decisão D |
| RF-E6-03 | E-mail é **fallback obrigatório**: se WhatsApp falhar, o lembrete/confirmação sai por e-mail | Must | E5 escopo, RNF-AVL |
| RF-E6-04 | Templates com variáveis nomeadas desde o dia 1 (`appointment_confirmation`, `reminder_24h`, `reminder_2h`, cancelamento, remarcação) | Must | pesquisa WhatsApp |
| RF-E6-05 | Sistema envia confirmação ao criar agendamento e lembretes 24h e 2h antes, via fila (BullMQ) com retry | Must | E5, J2 |
| RF-E6-06 | Cancelar/mover agendamento cancela notificações pendentes do horário antigo | Must | doc 07 |
| RF-E6-07 | Cada envio é gravado em `notifications` com `provider`, `provider_message_id`, `status`, `channel` | Must | doc 07 |
| RF-E6-08 | Telefone sempre E.164; rate limit e retentativa na fila | Must | doc 05/14 |
| RF-E6-09 | Enquanto Evolution/WAHA estiver em uso: chip dedicado; só mensagens transacionais; monitor de sessão com alerta | Must | pesquisa WhatsApp, RNF-OBS |
| RF-E6-10 | Piloto com canal não oficial exige ciência registrada da barbearia | Must | doc 10 |
| RF-E6-11 | Webhook de status de entrega normalizado pelo adapter (Evolution/WAHA/oficial) | Must | doc 08 |
| RF-E6-12 | Marketing exige `marketing_opt_in`; bloqueio explícito (não silencioso) | Must | RF-E3-08, doc 10 |
| RF-E6-13 | Templates de lembrete/confirmação são categoria *utility* (nunca marketing) na API oficial | Must | pesquisa WhatsApp |
| RF-E6-14 | `OWNER` vê status de falhas de envio relevantes no painel (banner/alerta) | Should | RNF-UX |
| RF-E6-15 | Limite mensal de mensagens WhatsApp por plano (excedente degrada para e-mail ou é cobrado) | Should | doc pesquisa billing/WhatsApp |

## Critérios de aceite transversais (E6)

- WhatsApp indisponível **não** impede agendar; UI avisa e e-mail cobre.
- Mesmo evento de webhook processado duas vezes → um efeito (idempotência).
- Taxa de entrega de lembretes ≥ 95% (meta de qualidade — doc 14).

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E6-16 | Inbox compartilhada / conversas bidirecionais ricas | Could (fase 2) |
| RF-E6-17 | Campanhas de marketing em massa | Won't (MVP) |
| RF-E6-18 | SMS como canal principal | Could (fase 2) |
