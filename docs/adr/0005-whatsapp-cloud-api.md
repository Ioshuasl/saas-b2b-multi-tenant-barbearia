# ADR-0005 — WhatsApp Business Cloud API oficial (não WhatsApp Web)

- **Status:** Supersedido
- **Data:** 2026-08-17
- **Supersedido em:** 2026-08-17 por [ADR-0016](./0016-waha-default-messaging.md) (WAHA GOWS default; Cloud API só por env). O texto abaixo é histórico e **não** é a decisão vigente.

## Contexto

WhatsApp é o canal de comunicação real entre barbearia e cliente no Brasil, e confirmação/lembrete de horário por WhatsApp é o recurso com efeito mais direto sobre no-show.

Existem três caminhos de integração:

1. **Extensão de navegador sobre o WhatsApp Web** — abordagem comum em concorrentes de agenda.
2. **Biblioteca não oficial** que automatiza o protocolo do WhatsApp Web (`whatsapp-web.js`, Baileys e similares).
3. **WhatsApp Business Cloud API oficial**, da Meta.

## Decisão (histórica)

**Cloud API oficial**, com número dedicado por tenant, templates aprovados e webhook server-side.

Consequências de desenho que essa decisão impõe ao produto:

- Envio proativo só por **template aprovado**, com categoria (`marketing`, `utility`, `authentication`, `service`).
- A cobrança da Meta é **por mensagem de template entregue** desde 1º de julho de 2025, com preço por categoria; mensagens fora de template dentro de uma janela de atendimento aberta (24 h após mensagem do cliente) não são cobradas ([documentação oficial de preços](https://developers.facebook.com/docs/whatsapp/pricing/)). Modelamos janela, categoria e consumo desde o MVP.
- Marketing exige **opt-in** registrado (`customers.marketing_opt_in`).
- Webhook precisa de verificação de assinatura, resposta rápida e idempotência por `wamid`.

## Consequências

**Positivas**

- Funciona 24/7 sem computador ligado. Confirmação e lembretes 24h/2h saem no horário certo.
- Entrega e status confiáveis (`sent`/`delivered`/`read`/`failed`).
- Botões interativos ("Confirmar" / "Cancelar") com resposta processada pelo backend.
- Conformidade com a política da Meta: sem risco de banimento do número principal da barbearia.
- Estável: não quebra quando o WhatsApp Web muda a interface.

**Negativas / custos aceitos**

- Custo variável por mensagem de template. Mitigação: categoria `utility`, medição por tenant.
- Onboarding burocrático (verificação Meta / WABA). Este era o principal risco de cronograma.
- Templates precisam de aprovação e não permitem texto livre proativo.
- Depender de um provedor único é risco de plataforma. Mitigação: port `MessagingProvider`.

## Alternativas rejeitadas (à época)

**Extensão de navegador sobre WhatsApp Web:** depende do computador ligado; não envia lembrete com a loja fechada.

**Bibliotecas não oficiais:** violam os termos de uso e expõem o número a banimento. (Reavaliado depois — ver ADR-0015/0016.)

**Não integrar WhatsApp no MVP:** inviável comercialmente; e-mail permanece fallback obrigatório.

## Desenho técnico resultante

```
Port (application)                Adapter (infrastructure)
MessagingProvider {               WhatsAppCloudProvider
  sendTemplate(...)                 → POST /{phone_number_id}/messages
  sendFreeText(...)                 → só com janela aberta
  getTemplates()                    → catálogo da WABA
}                                 EmailProvider (fallback)
```

Webhook: verificar assinatura → responder 200 → enfileirar job idempotente por `wamid` → processar.

## Verificação

- Mesmo `wamid` processado duas vezes gera um único efeito.
- Webhook com assinatura inválida é recusado sem enfileirar.
- Cancelamento do agendamento cancela os envios pendentes.
- Janela de silêncio (21h–8h) respeitada.
- Marketing sem opt-in bloqueado e registrado.
- Provedor indisponível: mensagens permanecem na fila e a UI avisa; e-mail cobre.

## Referências

- [WhatsApp Business Platform — Pricing](https://developers.facebook.com/docs/whatsapp/pricing/)
- Pesquisa: [docs/pesquisa/whatsapp-provedores-self-hosted.md](../pesquisa/whatsapp-provedores-self-hosted.md) · [ADR-0015](./0015-avaliacao-gateways-whatsapp-nao-oficiais.md)
- Decisão vigente: [ADR-0016](./0016-waha-default-messaging.md)
