# Pesquisa — Gateways WhatsApp open source / self-hosted

**Data da pesquisa:** 2026-08-17  
**Escopo:** Evolution API, OpenWA e WAHA, no contexto deste SaaS de barbearias. Comparativo **idêntico** ao do prontuário odontológico de referência.  
**Decisão vigente do produto:** [ADR-0016](../adr/0016-waha-default-messaging.md) (WAHA GOWS default). O [ADR-0005](../adr/0005-whatsapp-cloud-api.md) (Cloud API) está **supersedido**. Avaliação dos gateways: [ADR-0015](../adr/0015-avaliacao-gateways-whatsapp-nao-oficiais.md).

## 1. Por que esta pesquisa existe

O canal WhatsApp é central no MVP (confirmação, lembretes 24h e 2h). A Cloud API oficial exige credencial Meta / WABA e cobra por mensagem de template. A hipótese comercial é: **SaaS barato → mais barbearias**. Gateways self-hosted prometem custo zero por mensagem.

Essa hipótese só fecha se ignorarmos:

1. risco de **banimento do número da barbearia** (o ativo de contato com a base);
2. custo de **infra por sessão** (RAM, VPS, IPs);
3. quebra quando o protocolo do WhatsApp Web muda;
4. ausência de templates oficiais, selo, e botões estáveis como na Cloud API;
5. a partir de **1º de outubro de 2026**, a Meta passa a cobrar também mensagens de serviço / utility na janela de 24 h na Cloud API — o que muda o TCO da oficial, mas **não legaliza** o cliente não oficial.

## 2. O que todos esses provedores são (e o que não são)

São **HTTP gateways** que encapsulam um cliente **não oficial** do WhatsApp (emulação de WhatsApp Web / protocolo multi-device via bibliotecas comunitárias: Baileys, whatsapp-web.js, GOWS/whatsmeow, etc.).

Não são parceiros da Meta (BSP), substituto da WhatsApp Business Platform, nem um “modo invisível” da Cloud API.

A documentação dos três projetos admite, de formas diferentes, que **não há garantia contra bloqueio**. Usar isso em produção **viola os Termos de Serviço** do WhatsApp. IP residencial, proxy ou “comportamento humano” simulados **não transformam** um cliente reverse-engineered em cliente oficial.

## 3. Distinção de nomes (OpenWA)

Há **dois** produtos distintos com nome parecido:

| Projeto | Repo | O que é |
| --- | --- | --- |
| **OpenWA (gateway self-hosted)** — o comparado neste doc | [rmyndharis/OpenWA](https://github.com/rmyndharis/OpenWA) | Gateway NestJS + dashboard, Docker, engines `whatsapp-web.js` e Baileys. Repo criado em **fev/2026**. |
| **@open-wa/wa-automate** | [open-wa/wa-automate-nodejs](https://github.com/open-wa/wa-automate-nodejs) | Toolkit Node.js mais antigo. Biblioteca/runtime, não o mesmo produto. |

Este documento compara o **gateway** rmyndharis/OpenWA.

## 4. Ficha de cada provedor

Números de GitHub são snapshot de **ago/2026** e mudam rápido.

### 4.1 Evolution API

| Campo | Valor |
| --- | --- |
| Repo | [evolution-foundation/evolution-api](https://github.com/evolution-foundation/evolution-api) |
| Docs | [docs.evolutionfoundation.com.br](https://docs.evolutionfoundation.com.br) |
| Engines | **Baileys** (não oficial) **e** **Cloud API oficial** no mesmo produto |
| Licença | Apache 2.0 **com cláusulas extras** (logo/copyright; notificação de uso) |
| Ativação | Desde **v2.4.0**: instância precisa **ativar** contra o servidor de licença da Evolution Foundation (`503 LICENSE_REQUIRED`) |
| Pontos fortes | Maturidade no mercado BR; dual channel |
| Pontos fracos | Mais pesado; dependência de servidor de licença; atribuição obrigatória |

### 4.2 OpenWA (rmyndharis)

| Campo | Valor |
| --- | --- |
| Repo | [rmyndharis/OpenWA](https://github.com/rmyndharis/OpenWA) — repo **muito novo** (2026) |
| Engines | `whatsapp-web.js` (Chromium, default) e `baileys` |
| Licença | **MIT** |
| Pontos fortes | API + dashboard no mesmo container; HMAC em webhooks |
| Pontos fracos | Projeto jovem; engine browser = **300–500 MB RAM por sessão** |

### 4.3 WAHA (WhatsApp HTTP API)

| Campo | Valor |
| --- | --- |
| Repo | [devlikeapro/waha](https://github.com/devlikeapro/waha) |
| Docs | [waha.devlike.pro](https://waha.devlike.pro/) |
| Engines | **WEBJS**, **NOWEB**, **GOWS** (Go, sem Chromium), WPP |
| Licença | Core gratuito desde 2026.6.1 (features Plus unificadas); apoio Community opcional ~US$ 5 |
| Pontos fortes | DX limpa (Swagger, Docker); troca de engine por env; GOWS barato em CPU/RAM |
| Pontos fracos | Payloads/webhooks diferem entre engines; ainda é cliente não oficial |

## 5. Comparativo

| Critério | Evolution API | OpenWA | WAHA |
| --- | --- | --- | --- |
| Cliente oficial no mesmo binário | Sim (Cloud API) | Não | Não |
| Engine sem browser | Baileys | Baileys | GOWS / NOWEB |
| Multi-sessão | Sim | Sim | Sim |
| Custo de licença de software | Ativação Foundation | MIT | Core livre |
| Adequação a multi-tenant nosso | Instâncias por tenant | Idem | Idem; API keys por sessão |
| Risco de ban | Alto | Alto | Alto; docs: “not totally safe” |
| Neste SaaS | Não default | Não | **Default (ADR-0016)** |

Nenhum dos três é “mais oficial”. A diferença é empacotamento, engine e custo de ops.

## 6. Custo: Cloud API vs self-hosted

### 6.1 Cloud API (oficial)

Modelo vigente desde 1º jul/2025: cobrança **por mensagem de template entregue**. Fonte: [Pricing — WhatsApp Business Platform](https://developers.facebook.com/docs/whatsapp/pricing/).

Ordem de grandeza no Brasil (ago/2026, conferir rate card oficial): utility na casa de poucos centavos de real; marketing uma ordem de grandeza acima.

Simulação: 400 agendamentos/mês × 2 utility (confirmação + lembrete) ≈ 800 msgs — o volume transacional do MVP **não** inviabiliza a Cloud API. O que pesa é **onboarding WABA**, não o centavo da confirmação.

### 6.2 Self-hosted

Custo some da Meta e reaparece na infra: RAM por sessão, suporte a QR, risco de ban. Engine GOWS (dezenas de MB) cabe na VPS; Chromium (300–500 MB/número) não escala no ticket da barbearia.

## 7. Plano de risco: não existe “100% seguro contra a Meta”

**Não existe plano 100% seguro.** O WhatsApp descobre o cliente porque a sessão autentica **nos servidores da Meta**. Este repositório **não documenta** receitas de fingerprint, spoof de dispositivo, aquecimento ofensivo, nem lista de provedores de IP para evasão.

O único plano alinhado a “não ser descoberto como não oficial” é usar a **Cloud API** (ou BSP oficial).

Enquanto o default for WAHA:

1. **Não** conectar o número principal da barbearia.
2. Manter **e-mail** como fallback obrigatório.
3. Manter o port `MessagingProvider`.
4. Não vender “WhatsApp oficial 24/7” no site.

Controles de higiene (não de evasão): número dedicado; consentimento explícito; só transacional; rate limit e silêncio 21h–8h; uma sessão por tenant; kill switch; aviso na UI se a sessão cair.

## 8. Encaixe na arquitetura

```
messaging (domínio) → port MessagingProvider → adapter
```

Adapters: `WahaProvider` (default) · `WhatsAppCloudProvider` (env) · `EmailProvider` (fallback).

Proibido: barbearia falando com GOWS de dentro de `models/` ou de pages Next.

Multi-tenant: **uma sessão WhatsApp = um tenant**; mídia no S3 ([ADR-0008](../adr/0008-hospedagem-vps-hostinger-s3.md)).

## 9. Recomendação (ago/2026)

Produto aceitou **WAHA + GOWS** ([ADR-0016](../adr/0016-waha-default-messaging.md)).

Motivos: densidade (sem Chromium), ops Docker/EasyPanel, API key por sessão, licença sem phone-home (Evolution v2.4.0), fuga de engine no mesmo HTTP.

**Não** Evolution como padrão (peso, Baileys, ativação Foundation). **Não** OpenWA (repo novo, RAM de browser).

Risco de ban e ToS **não mudam** com a escolha do gateway.

## 10. Fontes

- [evolution-foundation/evolution-api](https://github.com/evolution-foundation/evolution-api)
- [rmyndharis/OpenWA](https://github.com/rmyndharis/OpenWA)
- [devlikeapro/waha](https://github.com/devlikeapro/waha) · [Engines / GOWS](https://waha.devlike.pro/docs/how-to/engines/)
- [Meta — WhatsApp Business Platform Pricing](https://developers.facebook.com/docs/whatsapp/pricing/)
- ADRs: [0005](../adr/0005-whatsapp-cloud-api.md), [0015](../adr/0015-avaliacao-gateways-whatsapp-nao-oficiais.md), [0016](../adr/0016-waha-default-messaging.md)
