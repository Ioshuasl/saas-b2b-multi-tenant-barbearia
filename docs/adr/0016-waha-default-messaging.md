# ADR-0016 — WAHA (GOWS) como provedor WhatsApp default

- **Status:** Aceito
- **Data:** 2026-08-17
- **Supersede:** [ADR-0005](./0005-whatsapp-cloud-api.md)
- **Pesquisa:** [docs/pesquisa/whatsapp-provedores-self-hosted.md](../pesquisa/whatsapp-provedores-self-hosted.md)

## Contexto

O ADR-0005 descrevia a WhatsApp Business Cloud API oficial (WABA, templates aprovados, tarifa por mensagem). Sem credencial Meta, o onboarding trava confirmações/lembretes. O produto precisa de SaaS barato e o time já opera **WAHA na VPS** (`waha.ioshuavps.com.br`) — o mesmo default do prontuário odontológico de referência.

Comparativo Evolution / OpenWA / WAHA: [ADR-0015](./0015-avaliacao-gateways-whatsapp-nao-oficiais.md). Escolha de gateway: **WAHA + GOWS**.

## Decisão

1. **Default de produção (quando o adapter for ligado):** WAHA self-hosted, engine **GOWS**, um processo para todos os tenants.
2. Manter o port `MessagingProvider`. Cloud API só se um dia `MESSAGING_PROVIDER=cloud` (ou equivalente) for ligado — não é o caminho feliz.
3. Onboarding **no nosso SaaS**: checkbox obrigatório de ciência (ToS da Meta, risco de ban, número **dedicado**) → criar sessão no WAHA → QR / pairing code no app. A barbearia **não** acessa o dashboard do WAHA.
4. Frontend **nunca** chama o WAHA. Chave `WAHA_API_KEY` só no backend.
5. Sem débito de crédito Meta. Kill switch + anti-spam (silêncio 21h–8h, teto por cliente/telefone). Usage = volume e falhas.
6. Confirmação e lembretes 24h/2h: botões Confirmar / Cancelar via WAHA quando o engine permitir; senão, fallback texto. E-mail é fallback obrigatório se a sessão cair.
7. **Não** há plano de ocultação da Meta (IP residencial, fingerprint). Risco de ban é aceito e declarado ao tenant.
8. **Evolution API não é o default.** Pode existir só como pesquisa histórica; o adapter de produção é WAHA.

## Consequências

**Positivas**

- Sem WABA / aprovação de template / tarifa por mensagem no caminho default.
- Continua **server-side 24/7**, sem extensão no PC da recepção.
- Densidade de sessões melhor com GOWS do que com Chromium.
- Troca futura de provedor continua no port.

**Negativas / custos aceitos**

- Viola os Termos de Serviço do WhatsApp. Número pode ser **banido**; o aviso obriga número dedicado, não o WhatsApp principal da barbearia.
- Sessão QR pode cair; suporte operacional maior que Cloud API.
- Sem selo / templates oficiais da Meta. Textos são nossos, renderizados no adapter.
- Esta leva **só documenta**; implementação quando pedida.

## Alternativas rejeitadas

- Manter ADR-0005 até ter WABA (bloqueia lembretes sem credencial).
- Evolution ou OpenWA como default (ADR-0015 / pesquisa §9).
- Barbearia emparelha no dashboard do WAHA.
- Dashboard WAHA exposto ao cliente.
- Créditos como cobrança do SaaS só porque a Meta cobrava.
- Playbook para a Meta “não descobrir” o cliente.

## Verificação (quando o código existir)

- QR só depois do checkbox de ciência persistido (`risk_accepted_at`).
- Uma sessão WAHA por tenant (`session_name` estável).
- Webhook HMAC do WAHA; tenant resolvido pelo `session`, não por `phone_number_id` da Meta.
- Fake em test/dev; production default WAHA.
- Kill switch e disconnect fazem logout da sessão no WAHA.
- Marketing sem opt-in → `BLOCKED_NO_CONSENT`.
- WhatsApp indisponível: e-mail cobre; UI avisa.

## Referências

- [RF E6](../requisitos/funcionais/06-whatsapp-notificacoes.md)
- [docs/11-infra-devops.md](../11-infra-devops.md)
- [ADR-0015](./0015-avaliacao-gateways-whatsapp-nao-oficiais.md)
