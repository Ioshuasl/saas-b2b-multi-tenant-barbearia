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
| ADR-008 | **Multi-unidade dentro do MVP**, com `location_id` nas tabelas operacionais | Retrofitar unidade em agenda/relatório/página pública depois é muito mais caro |
| ADR-009 | `tenant` é fronteira de **segurança** (RLS); `location` é fronteira de **autorização** (aplicação) | Mantém a policy de RLS trivial e rápida |
| ADR-010 | Base de clientes única por rede; catálogo de serviços no tenant com override por unidade | Histórico único é vantagem de rede; preço varia por bairro |
| ADR-011 | Stack: Node + TS + Express + Sequelize / React + TS + Next.js | Definição do time |
| ADR-012 | WhatsApp por Evolution API em dev/teste, atrás de `WhatsAppProvider`, com e-mail como fallback | Destrava o desenvolvimento sem depender da homologação da Meta |
| ADR-013 | **Inadimplência é negociada, não automatizada** — nada desativado antes de contato e prazo acordado (`grace_until`) | Não prejudicar a barbearia nem o cliente final dela |
| ADR-014 | Pagamento antecipado/sinal fora do MVP | Confirmado |

## Decisões pendentes

1. **Provedor de pagamento** — taxas, simulação de custo e recomendação em [13](13-provedores-pagamento.md). Critério de desempate sugerido: suporte a **Pix Automático**. Até decidir, codar contra `PaymentProvider`.
2. **Provedor oficial de WhatsApp** (para depois da Evolution API) — comparativo em [14](14-whatsapp-notificacoes.md). Sugestão: Meta Cloud API direta pelo menor custo; 360dialog ou BSP brasileiro se preferir pagar markup por conveniência.
3. **Preço** — os valores em [08](08-billing-planos.md), incluindo o adicional por unidade extra, são hipótese. Validar com os pilotos.
4. **Quando iniciar a homologação da Meta** — leva semanas; sugestão de abrir o Business Manager já na Fase 0 mesmo usando Evolution API no MVP.
5. **Se a Evolution API pode ir ao piloto pago** — recomendação: só com ciência explícita da barbearia e chip dedicado.
6. **Quantas unidades os pilotos têm** — define se multi-unidade será validado com cliente real ou apenas com dados de seed.

## Riscos

| Risco | Prob. | Impacto | Mitigação |
|---|:--:|:--:|---|
| Vazamento de dados entre tenants | Baixa | **Fatal** | RLS + FK composta + suíte de isolamento no CI + seed com 2 tenants em dev |
| Overbooking (2 clientes no mesmo horário) | Média | Alto — quebra a confiança na hora | Constraint `EXCLUDE`; teste de concorrência; mensagem clara de `SLOT_TAKEN` |
| Bugs de fuso horário / horário de verão | **Alta** | Alto | `timestamptz` sempre; timezone **por unidade**; testes com datas de DST e viradas de dia |
| **Vazamento entre unidades do mesmo tenant** | Média | Alto | RLS não cobre isso: teste dedicado por endpoint com usuário de escopo restrito, no CI |
| **Número banido pela Meta (Evolution API)** | **Alta** | Alto | Chip dedicado; só transacional; fallback por e-mail; migração planejada para API oficial |
| Sessão da Evolution API cai sem ninguém perceber | Alta | Médio | Monitor de sessão com alerta; lembrete sai por e-mail se o WhatsApp falhar |
| Multi-unidade complica a UI de quem tem uma loja só | Média | Alto — mata a ativação | Unidade padrão automática; UI de rede oculta com 1 unidade; medir onboarding ≤ 10 min |
| Sequelize permite query fora da transação com tenant | Média | **Fatal** | Hook global que lança erro; teste que verifica o hook; code review |
| Inadimplência negociada virar "nunca cobrar" | Média | Alto | Fila de cobrança no back-office com dias em atraso e `grace_until` obrigatório; revisão semanal |
| Barbearias não largam o WhatsApp | Média | Alto | Piloto presencial; link e QR Code prontos para o Instagram; medir `first_public_booking` |
| Onboarding longo demais → abandono | Média | Alto | Wizard com dados pré-preenchidos; meta de 10 min medida como métrica |
| Preço errado (baixo demais para sustentar suporte) | Média | Médio | Validar com pilotos; suporte self-service; planos por porte |
| Churn alto de SMB | Média | Alto | Ativação forte (primeiro agendamento público) e relatório mensal que mostra valor |
| Custo de WhatsApp explode após migrar para a oficial | Baixa | Médio | Templates sempre categoria *utility*; limite por plano; e-mail como padrão |
| Dependência de um único fundador/dev | Alta | Alto | Documentação (esta pasta), testes, IaC, nada de setup só na cabeça de alguém |

## Perguntas que ainda faltam ser respondidas
- Quantas barbearias você já tem acesso para piloto, e quantas têm mais de uma unidade?
- Qual o prazo desejado até o lançamento? O escopo atual dá ~4,5 meses com 1 dev.
- Vai desenvolver sozinho ou com time?
- Existe barbearia-âncora que já pediu funcionalidade específica (comanda, produtos, fidelidade)?
- Já existe CNPJ ativo há mais de 6 meses? É pré-requisito para o Pix Automático.
