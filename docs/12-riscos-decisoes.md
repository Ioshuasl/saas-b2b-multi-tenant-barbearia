# 12 — Riscos e Decisões em Aberto

## Decisões já tomadas (ADRs)

| ID | Decisão | Motivo |
|---|---|---|
| ADR-001 | Multi-tenancy por `tenant_id` + RLS no Postgres | Menor custo por tenant; isolamento garantido pelo banco, não pela disciplina do dev |
| ADR-002 | Monolito modular | Time pequeno, domínio coeso, transações cruzando módulos |
| ADR-003 | Não sobreposição garantida por constraint `EXCLUDE` no banco | Checagem em aplicação não sobrevive a concorrência |
| ADR-004 | Trial de 14 dias sem cartão | Maximiza topo de funil no segmento SMB |
| ADR-005 | Sem app nativo no MVP | Web responsivo resolve; custo e prazo altos |
| ADR-006 | Cliente final não tem conta (identificado por telefone) | Fricção zero é requisito do fluxo público |
| ADR-007 | Preço e duração são snapshot no agendamento | Histórico e relatórios não podem mudar retroativamente |

## Decisões pendentes (precisam de você)

1. **Provedor de pagamento** — Stripe (melhor DX) vs. provedor BR como Asaas/Pagar.me (Pix e boleto nativos). Depende de quanto do público-alvo pagaria com cartão de crédito recorrente. *Sugestão: provedor BR, atrás de interface trocável.*
2. **Preço** — os valores em [08](08-billing-planos.md) são hipótese. Validar com os pilotos antes de publicar.
3. **WhatsApp no MVP** — esperar a homologação da API oficial (semanas) ou lançar só com e-mail + link `wa.me` manual? *Sugestão: lançar sem, iniciar a homologação já na Fase 0.*
4. **Comportamento em inadimplência** — desativar a página pública em `PAST_DUE` (proposto) ou mantê-la para não prejudicar o cliente final da barbearia? Trade-off entre pressão de cobrança e dano à reputação.
5. **Stack** — confirmar linguagem/framework conforme a experiência do time; o plano funciona em qualquer stack sobre Postgres.
6. **Multi-unidade** — confirmar que nenhum dos pilotos tem duas lojas. Se tiver, o modelo de dados precisa de `location_id` **antes** do MVP (adicionar depois é caro).
7. **Pagamento antecipado/sinal** — fora do MVP, mas é a arma mais eficaz contra no-show. Confirmar que dá para esperar a fase 2.

## Riscos

| Risco | Prob. | Impacto | Mitigação |
|---|:--:|:--:|---|
| Vazamento de dados entre tenants | Baixa | **Fatal** | RLS + FK composta + suíte de isolamento no CI + seed com 2 tenants em dev |
| Overbooking (2 clientes no mesmo horário) | Média | Alto — quebra a confiança na hora | Constraint `EXCLUDE`; teste de concorrência; mensagem clara de `SLOT_TAKEN` |
| Bugs de fuso horário / horário de verão | **Alta** | Alto | `timestamptz` sempre; timezone por tenant; testes com datas de DST e viradas de dia |
| Homologação do WhatsApp atrasa | Alta | Médio | MVP não depende dela; fallback por e-mail e link manual |
| Barbearias não largam o WhatsApp | Média | Alto | Piloto presencial; link e QR Code prontos para o Instagram; medir `first_public_booking` |
| Onboarding longo demais → abandono | Média | Alto | Wizard com dados pré-preenchidos; meta de 10 min medida como métrica |
| Preço errado (baixo demais para sustentar suporte) | Média | Médio | Validar com pilotos; suporte self-service; planos por porte |
| Churn alto de SMB | Média | Alto | Ativação forte (primeiro agendamento público) e relatório mensal que mostra valor |
| Custo de WhatsApp explode | Baixa | Médio | Limite por plano; e-mail como padrão |
| Dependência de um único fundador/dev | Alta | Alto | Documentação (esta pasta), testes, IaC, nada de setup só na cabeça de alguém |

## Perguntas que ainda faltam ser respondidas
- Quantas barbearias você já tem acesso para piloto?
- Qual o prazo/orçamento desejado até o lançamento?
- Você vai desenvolver sozinho ou com time? Qual stack domina?
- Existe alguma barbearia-âncora que já pediu funcionalidade específica (ex.: comanda, produtos, fidelidade)?
