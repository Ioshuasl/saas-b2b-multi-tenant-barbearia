# RF — WhatsApp e Notificações (E6)

**Módulo:** `messaging` · **Detalhe:** [modulos/06-whatsapp-notificacoes.md](../../modulos/06-whatsapp-notificacoes.md) · Pesquisa vigente: [pesquisa/whatsapp-provedores-self-hosted.md](../../pesquisa/whatsapp-provedores-self-hosted.md) · [ADR-0016](../../adr/0016-waha-default-messaging.md)

| ID | Requisito | Prioridade | Rastreabilidade |
| --- | --- | --- | --- |
| RF-E6-01 | Toda notificação passa por port `MessagingProvider` + canal e-mail (`EmailProvider`); troca de provedor sem mudar casos de uso | Must | ADR-0009, ADR-0016 |
| RF-E6-02 | Default de produção: **WAHA self-hosted, engine GOWS** ([ADR-0016](../../adr/0016-waha-default-messaging.md)). Cloud API só se `MESSAGING_PROVIDER=cloud`. Evolution **não** é o default | Must | ADR-0015, ADR-0016 |
| RF-E6-03 | E-mail (Resend) é **fallback obrigatório**: se WhatsApp falhar ou a sessão cair, o lembrete/confirmação sai por e-mail | Must | ADR-0009, RNF-AVL |
| RF-E6-04 | Textos de automação com variáveis nomeadas desde o dia 1 (`appointment_confirmation`, `reminder_24h`, `reminder_2h`, cancelamento, remarcação) — renderizados pelo adapter (não são templates aprovados da Meta no caminho WAHA) | Must | ADR-0016 |
| RF-E6-05 | Sistema envia confirmação ao criar agendamento e lembretes 24h e 2h antes, via fila (BullMQ) com retry | Must | ADR-0006, J2 |
| RF-E6-06 | Cancelar/mover agendamento cancela notificações pendentes do horário antigo | Must | doc 07 |
| RF-E6-07 | Cada envio é gravado em `notifications` com `provider`, `provider_message_id`, `status`, `channel` | Must | doc 07 |
| RF-E6-08 | Telefone sempre E.164; rate limit, janela de silêncio 21h–8h e retentativa na fila | Must | ADR-0016, doc 05/14 |
| RF-E6-09 | Número **dedicado** (nunca o WhatsApp principal da barbearia); só mensagens transacionais no MVP; monitor de sessão com alerta na UI e operacional | Must | ADR-0016, RNF-OBS |
| RF-E6-10 | Onboarding WhatsApp exige checkbox de ciência persistido (`risk_accepted_at`) — ToS da Meta, risco de ban — antes do QR | Must | ADR-0016, doc 10 |
| RF-E6-11 | Webhook HMAC do WAHA; tenant resolvido pelo `session`; status de entrega normalizado pelo adapter (WAHA / Cloud se ligado) | Must | ADR-0016 |
| RF-E6-12 | Marketing exige `marketing_opt_in`; bloqueio explícito (`BLOCKED_NO_CONSENT`, não silencioso) | Must | RF-E3-08, doc 10 |
| RF-E6-13 | Se Cloud API estiver ligada: templates de lembrete/confirmação são categoria *utility* (nunca marketing) | Should | ADR-0005 (histórico) |
| RF-E6-14 | `OWNER` vê status de falhas de envio e sessão desconectada no painel (banner/alerta) | Must | RNF-UX, RNF-AVL-04 |
| RF-E6-15 | Frontend **nunca** chama o WAHA; `WAHA_API_KEY` só no backend | Must | ADR-0016 |
| RF-E6-19 | Kill switch por tenant: desconectar faz logout da sessão no WAHA | Must | ADR-0016 |

## Critérios de aceite transversais (E6)

- WhatsApp indisponível **não** impede agendar; UI avisa e e-mail cobre.
- QR só depois do checkbox de ciência persistido.
- Mesmo evento de webhook processado duas vezes → um efeito (idempotência).
- Taxa de entrega de lembretes ≥ 95% (meta de qualidade — doc 14).

## Fora do MVP (rastreio)

| ID | Requisito | Prioridade |
| --- | --- | --- |
| RF-E6-16 | Inbox compartilhada / conversas bidirecionais ricas | Could (fase 2) |
| RF-E6-17 | Campanhas de marketing em massa | Won't (MVP) |
| RF-E6-18 | SMS como canal principal | Could (fase 2) |
