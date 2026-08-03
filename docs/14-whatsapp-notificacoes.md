# 14 — WhatsApp: Evolution API agora, API oficial depois

**Decisão do projeto:** em desenvolvimento e testes usamos a **Evolution API** (não oficial). Migração para API oficial planejada. Este documento define como fazer isso sem retrabalho e compara provedores oficiais por custo-benefício.

## Fase 1 — Evolution API (dev/teste)

A Evolution API é um wrapper open-source sobre o WhatsApp Web (multi-device). Sobe em Docker, conecta por QR Code, tem API REST e webhooks.

**Vantagens:** custo zero por mensagem, sem homologação, sem templates aprovados, funciona hoje.

**Riscos que precisam estar escritos e aceitos:**
- **Uso não autorizado pela Meta.** Número pode ser banido, especialmente com envio em massa ou reclamações de spam.
- **Sessão frágil:** exige QR Code, cai, precisa reconectar; a barbearia pode ficar sem lembrete sem ninguém perceber.
- **Sem SLA e sem garantia de entrega.**
- **Contratual/LGPD:** vender um produto pago que depende de canal não oficial é risco jurídico e reputacional.

**Regras de uso enquanto estivermos nela:**
1. Só em **dev/staging** e, no máximo, em piloto com barbearias que assinem ciência do risco.
2. Nunca com o número principal da barbearia nem com o nosso número comercial — usar chip dedicado e descartável.
3. Monitoramento de sessão com alerta: se a instância desconectar, avisar por e-mail e cair no fallback.
4. **Fallback obrigatório:** se o WhatsApp falhar, o lembrete sai por e-mail. Nenhuma notificação pode depender só dele.
5. Não usar para marketing/disparo em massa — só transacional (confirmação, lembrete, cancelamento).

## Abstração para trocar sem dor

Todo envio passa por uma interface. Trocar Evolution → oficial deve ser mudar variável de ambiente.

```ts
interface WhatsAppProvider {
  sendTemplate(input: {
    to: string;                    // E.164
    template: TemplateName;        // 'appointment_confirmation' | 'reminder_24h' | ...
    variables: Record<string, string>;
    idempotencyKey: string;
  }): Promise<{ providerMessageId: string }>;
  parseWebhook(raw: unknown): DeliveryEvent;  // sent | delivered | read | failed
}
```

Pontos de atenção que **já** devem existir na fase Evolution, senão a migração quebra:
- Mensagens escritas como **templates com variáveis nomeadas** (nunca string concatenada) — a API oficial só envia template aprovado fora da janela de 24h.
- Cada mensagem gravada em `notifications` com `provider`, `provider_message_id` e `status`.
- Respeitar o conceito de **janela de atendimento de 24h** desde já.
- Telefone sempre em E.164.
- Rate limit e fila com retentativa — a API oficial tem limites de envio por nível de qualidade.

## Fase 2 — API oficial: comparativo de provedores

A Meta cobra **por mensagem de template entregue** (modelo por mensagem desde 1º/jul/2025; antes era por conversa de 24h). Pontos que mudam o custo real:

- Mensagens **não-template** (dentro da janela de 24h aberta pelo cliente) são **gratuitas**.
- **Templates de utilidade dentro de uma janela aberta também são gratuitos** — nosso caso de uso (confirmação e lembrete) é *utility*, a categoria mais barata.
- Categoria *marketing* custa muito mais (ordem de grandeza acima de utility no Brasil). Nunca marcar lembrete como marketing.
- Meta só altera preços no 1º dia de cada trimestre, com aviso prévio.

Ordem de grandeza no Brasil (**confirmar no rate card oficial antes de precificar**): *utility* na casa de poucos centavos de real por mensagem; *marketing* uma ordem de grandeza acima. Fonte: https://developers.facebook.com/docs/whatsapp/pricing

### Provedores (BSP)

| Provedor | Modelo de cobrança | Moeda | Prós | Contras |
|---|---|---|---|---|
| **Meta Cloud API direta** | só o custo da Meta, sem markup | USD | **Menor custo possível**; hospedada pela Meta, sem servidor | Você faz toda a integração e o processo de verificação sozinho; sem suporte |
| **360dialog** | taxa mensal por número + markup | EUR/USD | Especialista em WhatsApp, preço competitivo, API limpa (repassa a Cloud API) | Cobranças em camadas (número + volume); só WhatsApp |
| **Gupshup** | por mensagem, agressivo | USD | Preço baixo em volume | Documentação confusa, suporte lento |
| **Twilio** | Meta + taxa de plataforma por mensagem | USD | Documentação padrão-ouro, confiabilidade | Mais caro; câmbio; foco zero em gestão |
| **Sinch** | contrato | USD/EUR | Enterprise, SLA | Overkill e caro para o nosso porte |
| **BSPs brasileiros** (Notifica, Zenvia, Take/Blip etc.) | em BRL, mensalidade + mensagem | **BRL** | Cobrança em real (sem risco cambial), suporte em português, ajuda na verificação | Mensalidade; markup maior que ir direto na Meta |

**Custos ocultos a orçar:** markup do BSP (tipicamente 10–20% sobre a tarifa da Meta), taxa mensal por número, e **reclassificação de template** — a Meta pode reclassificar um template de *utility* para *marketing*, multiplicando o custo da noite para o dia. Monitorar a categoria dos templates aprovados.

### Recomendação de custo-benefício

1. **Meta Cloud API direta** se houver disposição para conduzir a verificação do Business Manager e a aprovação de templates internamente — é o menor custo, sem intermediário, e a Meta hospeda.
2. **360dialog** como melhor relação preço/facilidade entre BSPs, se quiser pular a burocracia.
3. **BSP brasileiro** se preferir pagar em real, com suporte em português e ajuda na homologação — pague o markup como custo de conveniência.
4. **Twilio** só se o time já usar Twilio para outra coisa.

Evitar: soluções não oficiais em produção paga (o que inclui a própria Evolution API a longo prazo).

## Impacto no produto e nos planos

- Lembretes são *utility* — barato. Estimar 2 mensagens por agendamento (confirmação + lembrete 24h).
- Uma barbearia com 400 agendamentos/mês → ~800 mensagens de utility/mês. Precifique isso dentro do plano e defina um **limite mensal por plano**, com excedente cobrado ou degradado para e-mail.
- Como mensagens dentro da janela de 24h são gratuitas, responder o cliente quando ele escreve não gera custo — isso torna viável um fluxo de confirmação por resposta ("Responda SIM para confirmar").

## Checklist da migração para a oficial

1. Abrir Meta Business Manager e concluir a **verificação da empresa** (pode levar semanas — começar cedo).
2. Criar WABA e registrar o número (número novo, ou migrar um existente perdendo o app do WhatsApp Business nele).
3. Cadastrar e aprovar os templates: `appointment_confirmation`, `reminder_24h`, `reminder_2h`, `appointment_canceled`, `appointment_rescheduled`.
4. Implementar o adapter `MetaCloudProvider` seguindo a mesma interface.
5. Ligar por feature flag, por tenant, com rollout gradual e o e-mail sempre como fallback.
6. Monitorar qualidade do número (a Meta reduz limites de envio se a qualidade cair) e categoria dos templates.

## Fontes
- https://developers.facebook.com/docs/whatsapp/pricing (modelo por mensagem, categorias, janela de 24h)
- Comparativos públicos de BSPs no Brasil (2026) e análises de custos ocultos de BSP
