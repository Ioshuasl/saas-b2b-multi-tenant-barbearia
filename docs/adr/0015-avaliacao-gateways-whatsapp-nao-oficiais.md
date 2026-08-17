# ADR-0015 — Avaliação de gateways WhatsApp self-hosted (Evolution, OpenWA, WAHA)

- **Status:** Aceito (pesquisa; decisão de provedor no [ADR-0016](./0016-waha-default-messaging.md))
- **Data:** 2026-08-17
- **Pesquisa completa:** [docs/pesquisa/whatsapp-provedores-self-hosted.md](../pesquisa/whatsapp-provedores-self-hosted.md)

## Contexto

O [ADR-0005](./0005-whatsapp-cloud-api.md) descrevia a Cloud API oficial. Hipótese de produto: credencial Meta indisponível; SaaS barato. Pedido: comparar Evolution API, OpenWA e WAHA — o mesmo comparativo do prontuário odontológico de referência.

Pedido de “plano 100% seguro para a Meta não descobrir” (incl. IP residencial vitalício) foi **rejeitado**: não existe garantia; o tráfego termina nos servidores da Meta. Ver pesquisa §7.

## Decisão (desta avaliação)

1. Se o produto usar gateway não oficial, o gateway é **WAHA com engine GOWS** (não OpenWA; não Evolution como padrão).
2. Não adotar plano de ocultação / IP residencial como mitigação de ToS.
3. Domínio atrás de `MessagingProvider`; uma sessão por tenant; número dedicado e consentimento.

A decisão de **substituir** o ADR-0005 no produto está no [ADR-0016](./0016-waha-default-messaging.md) (Aceito).

## Comparativo resumido

| | Evolution API | OpenWA (rmyndharis) | WAHA |
| --- | --- | --- | --- |
| Papel | Gateway BR maduro; Baileys **+** Cloud API | Gateway MIT + dashboard (repo 2026) | Gateway Docker; engines WEBJS / NOWEB / **GOWS** |
| Licença | Apache 2.0 + logo/notificação; **ativação** v2.4.0 | MIT | Core gratuito (Plus unificado em 2026.6.1) |
| Custo software | Ativação Foundation | Zero de feature-gate | Opcional Community US$ 5 |
| Neste SaaS | Não default (phone-home, peso) | Não (RAM de browser, repo novo) | **Default (ADR-0016)** |

## Alternativas consideradas

- **Gateway + IP residencial “invisível”:** rejeitada (pesquisa §7).
- **Manter só Cloud API até WABA:** rejeitada pelo ADR-0016 (onboarding).
- **Não ter WhatsApp no MVP:** rejeitada no 0005 por mercado; fallback continua e-mail se a sessão cair.

## Referências

- [Pesquisa — provedores self-hosted](../pesquisa/whatsapp-provedores-self-hosted.md)
- [ADR-0005](./0005-whatsapp-cloud-api.md) (supersedido)
- [ADR-0016](./0016-waha-default-messaging.md)
- [RF E6](../requisitos/funcionais/06-whatsapp-notificacoes.md)
