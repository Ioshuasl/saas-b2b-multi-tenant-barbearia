# 02 — Benchmark de Mercado

Pesquisa em páginas públicas (produto, planos, FAQ, central de ajuda e blog) dos players relevantes para **agenda/gestão de barbearias no Brasil**, mais um player global (Fresha) e o status quo (WhatsApp + caderno). Consulta em **agosto de 2026**. Preços e empacotamento mudam com frequência — reconferir antes de qualquer decisão comercial.

Fontes principais:

- Trinks — <https://negocios.trinks.com/planos/>, <https://negocios.trinks.com/negocios/barbearias/>, <https://negocios.trinks.com/negocios/redes-e-franquias/>, <https://ajuda.trinks.com/rotina-de-mensagens-via-whatsapp>
- Booksy Biz — <https://biz.booksy.com/pt-br/precos>, <https://biz.booksy.com/pt-br>
- AppBarber — <https://appbarber.com.br/funcionalidades/>, [planos Zendesk](https://appbarber-appbeleza.zendesk.com/hc/pt-br/articles/360001701331-Planos-e-Pre%C3%A7os-do-Sistema)
- Belasis — <https://www.belasis.com.br/precos>, <https://www.belasis.com.br/sistema-para-barbearia>
- Fresha — <https://www.fresha.com/pt/for-business/barber>, <https://www.fresha.com/pt-PT/pricing>
- No-show (contexto, não concorrente): [Belio](https://blog.belio.com.br/artigos/quanto-custa-no-show-salao-beleza/), [Fisga](https://fisga.net/aprenda/whatsapp-salao-lembrete-d1-no-show), [lucro-local](https://lucro-local.com/barbearia/como-reduzir-no-show)

---

## 1. Resumo por player

### 1.1 Trinks

Posicionamento: sistema de gestão “completo” para beleza e bem-estar (salão, barbearia, estética, spa), com **marketplace B2C** (`trinks.com`) e oferta explícita para **redes/franquias**. Declara +13 anos, +44 mil negócios, +7 mi usuários e +460 mi agendamentos.

- **Empacotamento:** faixas por **número de profissionais**. Na página oficial de planos (ago/2026) só o faixa **1–2 profissionais** tem preço público: **R$ 76/mês no anual** e **R$ 110/mês no mensal**; 3+ profissionais e 21+ vão para “sob consulta” / “falar com especialista”. Landing de captação comercial ainda lista a tabela completa (mensal R$ 110 / 158 / 291 / 406 / 621; anual equivalente R$ 76 / 110 / 205 / 286 / 435) — tratar como **indício**, não como contrato.
- **Trial:** 5 dias, sem taxa de adesão. Planos semestral/anual com **fidelidade**: cancelamento antecipado com multa de 50% das parcelas restantes.
- **Barbearia:** agenda online, app do profissional, comissão (inclusive split na maquininha Belezinha), clube de assinaturas (corte/barba recorrente), estoque.
- **WhatsApp:** “Rotina de mensagens” é **adicional**. 1 automação = 3 mensagens (confirmação + lembrete + avaliação) em 24 h; pacote único ou saldo mensal. Trinks afirma integração oficial Meta.
- **Redes:** produto separado (relatórios consolidados, cadastro-modelo, implementação assistida). Não é o default da loja única.

**Leituras:** (a) líder de marca e de descoberta B2C — não competimos no marketplace; (b) preço público só na entrada e WhatsApp à parte geram atrito de previsibilidade; (c) fidelidade anual é objeção; (d) multi-unidade existe, mas como **produto de rede/franquia**, não como “loja única que um dia abre a segunda sem mudar de software”.

### 1.2 Booksy

Posicionamento: app de consumidor + Booksy Biz. Discurso: **um preço, todos os recursos**, sem fidelidade. Forte em barbearias (cases e landing próprias).

- **Preço BR (página oficial):** **R$ 99,99/mês + impostos** para o estabelecimento; **+ R$ 20,00/mês + impostos por agenda adicional** da equipe. Sem planos premium para “liberar” função.
- **Trial:** 7 dias, acesso total; cancele quando quiser.
- **Incluso no discurso:** agendamento 24/7, marketplace, confirmações/lembretes, e-mail marketing, SMS*, lista de espera, proteção contra faltas, gift cards, assinaturas/pacotes, Reserve with Google, relatórios.
- **Comissão de novos clientes:** em outros países o destaque de perfil cobra taxa; **no Brasil a página afirma isenção** dessa taxa. Pagamentos flexíveis/integrados (taxas de processing à parte, típico do modelo global).

**Leituras:** (a) cobra **por profissional/agenda** — o dono tem incentivo a “esconder” barbeiro, o contrário do que queremos; (b) marketplace é o motor de aquisição deles e o anti-objetivo nosso; (c) transparência de preço e trial sem fidelidade são o padrão que o dono espera; (d) onboarding ainda gira em torno do **app do consumidor**, não de um link da própria marca.

### 1.3 AppBarber

Posicionamento: nicho **barbearia**, app nativo (estabelecimento, profissional e cliente), site incluso, comanda, estoque, fidelidade, lista de espera.

- **Preço (central de ajuda, faixas por profissionais cadastrados — inclusive quem não atende):** 1 prof. **R$ 79,90/mês**; 2–5 **R$ 109,90**; 6–15 **R$ 164,50**; 15+ **R$ 219,90**. Semestral −15%, anual −30%. **Trial 30 dias.**
- **Lembretes:** push no app + e-mail; SMS configurável. Não é WhatsApp como canal principal no material de funcionalidades.
- **Financeiro:** caixa, contas a pagar/receber, taxas de cartão, comissões, vales, comandas de consumo do profissional.
- **Extra vs. nosso MVP:** estoque, pacotes, clube de pontos, pagamento online, lista de espera, pesquisa de satisfação, “rede social” interna.

**Leituras:** (a) é o concorrente de **nicho** mais próximo em preço de entrada; (b) o cliente final precisa do **app** — fricção vs. nosso link público sem login; (c) lembrete por push/e-mail/SMS, não WhatsApp transacional no servidor; (d) trial longo (30 dias) é agressivo — o nosso 14 dias precisa compensar com time-to-value (publicar em ≤ 10 min).

### 1.4 Belasis

Posicionamento: gestão completa para beleza/estética/barbearia, com **IA**, clube de assinaturas, sinal, NFS-e e oferta para redes (Scale sob consulta). Declara +16 mil profissionais.

- **Planos (ago/2026):** **Lite R$ 99/mês**; **Pro R$ 189/mês**; **Scale sob consulta** (faturamento anual, gerente de contas, API, IA).
- **Lite:** agenda (PC/celular), comandas, CRM, vendas por assinatura, relatórios.
- **Pro:** comissões, financeiro entradas/saídas, CRM completo, anamneses. WhatsApp **API oficial** e campanhas aparecem como diferencial de plano superior / adicional.
- **Barbearia:** cobrança de sinal, cashback, estoque, emissão fiscal (Lei do Salão Parceiro), app iOS/Android. Página de produto empurra demo + “fale com vendas”.
- **Redes:** consolidação, multiempresa e app próprio da rede no Scale — não no Lite.

**Leituras:** (a) preço de entrada alinhado ao Booksy (~R$ 99), mas funções de comunicação e rede sobem de plano; (b) sinal e clube de assinatura são o discurso anti-no-show deles — nós deixamos sinal **fora do MVP** de propósito; (c) autosserviço existe (“criar conta”), porém o funil comercial ainda puxa demonstração.

### 1.5 Fresha (global)

Posicionamento: software + marketplace mundial de beleza/bem-estar, inclusive barbearias. Referência de UX de booking, não o rival do dia a dia do dono brasileiro (suporte, Pix, WhatsApp, NF).

- **Modelo 2026:** acabou o “free forever”. Assinatura **por membro da equipe agendável**; trial 7 dias. Preço é **geo-servido** (não citar um valor único em R$ sem abrir a página do Brasil).
- **Extras:** mensagens além da franquia (ex.: 20/mês) são tarifadas; marketplace cobra comissão de **cliente novo** (ex. 20% no material internacional, com mínimo).
- **Booking:** link direto, Google/Facebook/Instagram, app do cliente.

**Leituras:** (a) confirma que marketplace **monetiza o cliente novo** — reforça nosso anti-objetivo; (b) UX de reserva pública é o teto de qualidade que a página `/{tenant}/{location}` precisa perseguir; (c) não é prioridade de feature-parity (NFS-e, comissão BR, WhatsApp).

### 1.6 Status quo — WhatsApp + caderno

Ainda é o “sistema” da maioria das barbearias de 1–5 cadeiras. Custo aparente zero; custo real: interrupção do corte, horário duplo, zero histórico, comissão no fim do mês na planilha, rede que soma Excel.

Estimativas públicas de **no-show sem confirmação ativa** no setor de beleza BR (blogs de produto, não paper acadêmico): ordem de **15–35%**; com cadência de lembretes (confirmação + 24 h + 2 h) relatos de queda para **~6–12%**. Uma barbearia com 3 profissionais, ~8 atendimentos/dia, ticket ~R$ 65 e 25% de furo perde da ordem de **R$ 10 mil/mês** de receita não realizada — o argumento de venda do lembrete, não um KPI nosso até medirmos o piloto ([doc 14](./14-metricas-kpis.md)).

---

## 2. Matriz comparativa consolidada

Legenda: ● presente e destacado · ◐ plano superior / pago à parte / não é o default · ○ não identificado no material público · — não se aplica

| Funcionalidade | Trinks | Booksy | AppBarber | Belasis | Fresha | **Nosso MVP** |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| Agenda dia/semana, status visuais | ● | ● | ● | ● | ● | ● |
| Link público de autoagendamento | ● | ● | ● (site/app) | ● | ● | ● (`/{tenant}/{location}`, sem OTP) |
| Sem app obrigatório para o cliente final | ◐ (marketplace/app) | ○ (app é o canal) | ○ | ◐ | ○ | ● |
| Confirmação/lembrete WhatsApp | ◐ adicional | ● (no discurso) | ○ (push/e-mail/SMS) | ◐ API oficial em plano+ | ◐ tarifado | ● WAHA + e-mail fallback |
| Lembrete 24 h + 2 h | ◐ | ● | ◐ | ◐ | ● | ● |
| Bloqueio / jornada por profissional | ● | ● | ● | ● | ● | ● |
| Overbooking impedido no banco | ○ | ○ | ○ | ○ | ○ | ● (`EXCLUDE` por staff) |
| Multi-unidade no produto de entrada | ◐ (rede/franquia) | ◐ | ○ | ◐ (Scale) | ◐ | ● (UI oculta se 1 loja) |
| Relatório consolidado da rede | ◐ | ○ | ○ | ◐ | ◐ | ● (`OWNER`) |
| Comissão de profissionais | ● | ◐ | ● | ◐ (Pro) | ◐ | ● |
| Registro de pagamento no atendimento | ● | ● | ● (comanda) | ● | ● | ● (sem caixa do dia) |
| Estoque / comanda rica | ● | ◐ | ● | ● | ◐ | fase 2 / fora |
| Clube de assinatura (cliente) | ● | ● | ● | ● | ● | fase 2 |
| Sinal / pagamento antecipado | ◐ | ● | ● | ● | ● | fase 2 |
| Lista de espera / reencaixe | ○ | ● | ● | ○ | ● | fase 2 |
| Marketplace de descoberta | ● | ● | ○ | ○ | ● | **não fazer** |
| Inbox WhatsApp compartilhada | ○ | ○ | ○ | ◐ | ○ | fase 2 |
| Exportação self-service dos dados | ○ | ○ | ○ | ○ | ○ | ● |
| Preço público na web | ◐ (só 1–2) | ● | ● | ● (Lite/Pro) | ◐ geo | ● (hipótese em pesquisa billing) |
| Trial sem cartão | ● (5 d) | ● (7 d) | ● (30 d) | ● | ● (7 d) | ● (14 d) |
| Sem fidelidade no plano mensal | ◐ (anual tem multa) | ● | ● | ● | ● | ● |
| Implantação obrigatória / vendedor | ◐ redes | ○ | ○ | ◐ demo | ○ | **não** (self-service) |

---

## 3. Padrões de mercado que devemos simplesmente adotar

Expectativa mínima — não ter isso é ser descartado na avaliação do dono:

1. Agenda multiprofissional com status claros (não só cor) e visão dia no celular.
2. Página/link de autoagendamento integrado à agenda **real** (sem planilha no meio).
3. Confirmação na hora + lembretes perto do horário, no canal que o cliente lê (no BR: **WhatsApp**; e-mail só não basta).
4. Cadastro mínimo do cliente (nome + telefone); histórico na ficha.
5. Relatório do período: faturamento, atendimentos, ticket, no-show, comissão.
6. Papéis distintos (dono, barbeiro, recepção) com o barbeiro vendo só a própria cadeira.
7. Trial sem cartão e cancelamento do plano mensal sem multa.
8. LGPD comunicada na página pública (dados ficam com a **rede**).
9. Preço compreensível (por profissionais e/ou unidades) — não “fale com especialista” na faixa de 1–5 cadeiras.
10. Onboarding sozinho, em minutos, não em 30 dias de CS.

---

## 4. Onde vamos ser diferentes

| # | Diferencial | Justificativa vinda do benchmark |
| --- | --- | --- |
| D1 | **Link da marca, sem marketplace e sem app do cliente** | Trinks/Booksy/Fresha vivem de descoberta B2C; o dono pequeno quer Instagram → link, não “mais um app” |
| D2 | **WhatsApp no servidor (WAHA) já no plano de uso**, com e-mail fallback e ciência de risco | Trinks cobra pacote; AppBarber empurra push/SMS; Belasis reserva API oficial ao plano alto |
| D3 | **Rede modelada no MVP, UI de loja única** | Concorrentes tratam multi-unidade como SKU de franquia; nós nascemos com `location` e escondemos o seletor |
| D4 | **Self-service ≤ 10 min, sem vendedor** | Trinks redes e Belasis Scale puxam especialista; trial Trinks só 5 dias |
| D5 | **Exportação total self-service** | Nenhum player promove saída fácil; reduz medo de lock-in |
| D6 | **Não cobrar por “agenda extra” escondida** | Booksy +R$ 20/agenda; AppBarber conta profissional cadastrado mesmo ocioso — nós limitamos profissionais **ativos** + unidades |
| D7 | **Overbooking e fuso por unidade no banco** | Material público dos concorrentes não vende garantia de concorrência; redes sofrem exatamente isso |
| D8 | **Billing SaaS manual no MVP** | Não copiamos checkout na cara do piloto; operação humana + `grace_until` (ADR-0010) |

O que **não** vamos copiar no MVP (mesmo sendo “checkbox de mercado”): estoque, clube de assinatura do cliente, sinal, NFS-e, maquininha, inbox, lista de espera, app nativo. Entrar nisso é virar Trinks/Belasis sem marca.

---

## 5. Referências de precificação (agosto/2026)

Valores mensais divulgados; impostos podem ser extra (Booksy deixa explícito).

| Player | Entrada (1–2 prof., 1 loja) | Como escala | Trial |
| --- | --- | --- | --- |
| Trinks | R$ 76 anual / R$ 110 mensal (1–2); resto sob consulta | Por faixa de profissionais; WhatsApp à parte; redes = outro discurso | 5 dias |
| Booksy | R$ 99,99 + impostos | + R$ 20 por agenda | 7 dias |
| AppBarber | R$ 79,90 (1 prof.) | R$ 109,90 (2–5) → R$ 219,90 (15+) | 30 dias |
| Belasis | R$ 99 Lite | R$ 189 Pro; Scale sob consulta | teste grátis (conta) |
| Fresha | geo-servido / por headcount | + mensagens + comissão de cliente novo no marketplace | 7 dias |
| **Nossa hipótese** ([pesquisa/billing-planos.md](./pesquisa/billing-planos.md)) | Solo **R$ 49** / Barbearia **R$ 99** | +unidade **R$ 39**; Pro R$ 179; Rede R$ 349 | **14 dias**, sem cartão |

Faixa competitiva de entrada no BR para 1–5 profissionais: **R$ 80–110/mês**. Nossa hipótese Solo R$ 49 é **agressiva** (abaixo de AppBarber/Trinks) e só se sustenta se o custo variável de WhatsApp for o nosso (WAHA, sem pacote Meta) e o onboarding for realmente self-service. Validar com os 3 pilotos; **não travar preço no código**.

Anual com 2 meses grátis (−17%) é padrão de mercado; Trinks ainda usa multa de fidelidade — nós **não**.

---

## 6. Implicações para o produto (o que o benchmark muda)

1. **Página pública é o produto.** Quem precisa de app do cliente perde para o link do Instagram. Fluxo ≤ 4 telas, LCP < 2,5 s ([doc 09](./09-frontend.md)).
2. **WhatsApp transacional no caminho feliz**, não como upsell. Checkbox de ciência + número dedicado ([ADR-0016](./adr/0016-waha-default-messaging.md)).
3. **`location_id` desde a S0** — a brecha não é “ter rede no plano Enterprise”, é a segunda loja sem migrar de sistema.
4. **Não construir marketplace**, clube do cliente, estoque nem sinal no MVP — são exatamente os módulos que incham Trinks/Belasis e atrasam o core.
5. **Comissão e relatório no plano de uso**, não só no Pro (Belasis empurra comissão para o Pro).
6. **Mensagem de venda:** “publica em 10 minutos, o cliente marca sozinho, o lembrete sai no WhatsApp, a segunda unidade não quebra o modelo” — não “130 relatórios” nem “IA”.

## Referências

- [01 — Visão de produto](./01-visao-produto.md)
- [04 — Escopo do MVP](./04-escopo-mvp.md)
- [pesquisa/billing-planos.md](./pesquisa/billing-planos.md)
- [13 — Roadmap](./13-roadmap-estimativas.md)
- [14 — Métricas](./14-metricas-kpis.md)
