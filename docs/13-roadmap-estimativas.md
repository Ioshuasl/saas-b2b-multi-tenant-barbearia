# 13 — Roadmap e Estimativas

## 1. Premissas das estimativas

- Time de referência: **2 desenvolvedores full-stack** (ou 1 dev + apoio de IA em ritmo equivalente), com o proprietário do produto disponível para decisões rápidas.
- Sprint de 2 semanas; velocidade assumida de ~30–40 pontos por sprint depois da Sprint 0.
- Estimativas em **pontos** (Fibonacci) e em **sprints** — não em datas de calendário.
- Riscos externos (sessão WAHA/QR, revisão jurídica, barbearias-piloto) correm em paralelo.
- Stack e provedores **já fechados** na Parte 4 (Hostinger, EasyPanel, WAHA, Resend, billing manual, envelope). A S0 não reabre essas decisões.

## 2. Fase 1 — MVP

| Sprint | Objetivo | Épicos | Pontos | Entregável verificável |
| --- | --- | --- | --- | --- |
| **S0** | Fundação técnica + segurança | E9 (parcial) | ~30 | Monorepo, Docker Compose (Postgres, Redis, MinIO, Mailpit), Prisma + primeira migração com RLS, CI verde (gitleaks/audit/arch), Express `/health`, Next.js layout + login mockado; secrets/env Zod; esqueleto `audit_log`; port `KeyManagementPort` + `tenant_crypto_key`; seed com **2 tenants, um com 2 unidades**. Checklist: [desenvolvimento/sprints/S0-fundacao.md](./desenvolvimento/sprints/S0-fundacao.md) |
| **S1** | Identidade, rede e cadastros | E1, E2 | ~40 | Signup cria tenant + unidade padrão + OWNER; login/refresh; convite; RBAC + `user_locations`; CRUD unidades/serviços/staff/horários/bloqueios; seletor oculto com 1 unidade. Checklist: [desenvolvimento/sprints/S1-identidade-rede.md](./desenvolvimento/sprints/S1-identidade-rede.md) |
| **S2** | Clientes e motor de agenda | E3, E4 (núcleo) | ~45 | Cadastro/busca de clientes (E.164); disponibilidade em SQL; criar/editar/cancelar; `EXCLUDE` anti-overbooking **por staff** (todas as unidades); 50 req no mesmo slot = 1 sucesso. Checklist: [desenvolvimento/sprints/S2-clientes-agenda-motor.md](./desenvolvimento/sprints/S2-clientes-agenda-motor.md) |
| **S3** | Agenda no painel | E4 (UI) + E3 (UI) | ~40 | Visão dia/semana; status; clientes/ficha; mobile-first do barbeiro; STAFF só a própria agenda. Checklist: [desenvolvimento/sprints/S3-agenda-painel.md](./desenvolvimento/sprints/S3-agenda-painel.md) |
| **S4** | Página pública | E4 (público) | ~40 | `/{tenant}` seletor ou redirect; `/{tenant}/{unidade}` em ≤ 4 telas; token de cancelamento; LCP < 2,5 s. Checklist: [desenvolvimento/sprints/S4-pagina-publica.md](./desenvolvimento/sprints/S4-pagina-publica.md) |
| **S5** | WhatsApp + e-mail | E6 | ~35 | WAHA GOWS atrás de `MessagingProvider`; checkbox de ciência + QR; confirmação e lembretes 24h/2h; e-mail Resend fallback; kill switch |
| **S6** | Relatórios e caixa básico | E5, E7 | ~40 | Pagamento no `COMPLETED`; relatório por unidade e consolidado; comissão; CSV |
| **S7** | Billing manual e back-office | E8, E9 | ~35 | Trial 14 dias; planos/limites; fila “tenants a cobrar”; `grace_until`; impersonation somente leitura; exportação LGPD |
| **S8** | Endurecimento e piloto | E9 (restante) | ~30 | Auditoria consultável; testes de carga; envelope nos campos definidos; correções do piloto; termos/DPA |

**Total estimado do MVP: ~335 pontos ≈ 9 sprints ≈ 18 semanas de calendário** com o time de referência. Com 1 dev em tempo integral o mesmo conteúdo tende a ~4–5 meses (a multi-unidade no MVP é o acréscimo consciente vs. loja única).

`location_id` entra no schema **desde a S0**. Cortar UI de rede é barato; cortar o modelo depois não.

### Marcos de validação

| Marco | Quando | Critério de saída |
| --- | --- | --- |
| **M1 — Esqueleto seguro** | Fim da S0 | Tenant A recebe 404 em recurso do tenant B **e** gerente X recebe 404 na unidade Y — no CI |
| **M2 — Agenda usável internamente** | Fim da S3 | Dono opera o dia pelo painel sem caderno |
| **M3 — Página pública no ar** | Fim da S4 | Cliente real marca horário pelo link |
| **M4 — Lembrete ponta a ponta** | Fim da S5 | Confirmação/lembrete WhatsApp ou e-mail com número de teste |
| **M5 — Piloto** | Fim da S8 | 3 barbearias (idealmente 1 rede) usando 2 semanas sem incidente de dados |

## 3. Fase 2 — MVP+ (pós-piloto)

Ordem por valor comercial (sem copiar backlog clínico do odontológico):

| Prioridade | Item | Pontos | Por quê agora |
| --- | --- | --- | --- |
| 1 | Gateway de cobrança SaaS (Stripe / MP / Asaas) | 25 | Converte trial sem operação humana |
| 2 | Inbox WhatsApp compartilhada | 30 | Pedido frequente; infra de sessão já existe |
| 3 | Sinal / pagamento antecipado do cliente | 25 | Arma contra no-show |
| 4 | Domínio próprio por tenant | 15 | Percepção de marca |
| 5 | Google Calendar | 15 | Barbeiro que já vive no Calendar |
| 6 | Caixa do dia (abertura/fechamento) | 20 | Lojas maiores |
| 7 | MFA TOTP para OWNER | 15 | Endurecimento |
| 8 | Relatórios / BI avançados | 25 | Retenção do dono |
| 9 | Fidelidade / cupons | 20 | Retenção do cliente final |
| 10 | Importador de clientes/agenda | 25 | Migração de caderno/planilha |

## 4. Fase 3 — Escala

App nativo, estoque, DRE por unidade, marketplace (anti-objetivo — não fazer), whitelabel, NFS-e, maquininha, SSO, API pública.

## 5. Dependências externas (desde a S0)

| Dependência | Prazo típico | Ação antecipada |
| --- | --- | --- |
| Instância WAHA (GOWS) na VPS | horas a 1 dia | Já em `waha.ioshuavps.com.br`; conferir engine GOWS |
| Ciência jurídica WhatsApp não oficial + DPA | 2–4 semanas | Contratar na S3 para estar pronto na S8 |
| 3 barbearias-piloto (quantas têm 2+ unidades?) | recrutamento | Definir na S2; uma rede valida E1b de verdade |
| CNPJ / meios de recebimento da plataforma | semanas | Necessário antes de automatizar billing (fase 2) |

## 6. Riscos e planos de contingência

| # | Risco | Prob. | Impacto | Mitigação |
| --- | --- | --- | --- | --- |
| R1 | Sessão WAHA cai / número banido | Alta | Alto | Número dedicado + checkbox; fallback e-mail; não bloqueia o resto do MVP |
| R2 | Overbooking | Média | Alto | `EXCLUDE`; teste de 50 req; `SLOT_TAKEN` claro |
| R3 | Fuso / DST | Alta | Alto | `timestamptz`; timezone **por unidade**; testes DST |
| R4 | Vazamento entre tenants | Baixa | Crítico | RLS + CI |
| R5 | Vazamento entre unidades | Média | Alto | Teste de autorização por endpoint |
| R6 | Multi-unidade complica loja única | Média | Alto | UI oculta; medir onboarding ≤ 10 min separado |
| R7 | Inadimplência negociada virar “nunca cobrar” | Média | Alto | Fila de cobrança + `grace_until` obrigatório |
| R8 | Barbearias não largam o WhatsApp paralelo | Média | Alto | QR no Instagram; métrica `first_public_booking` |
| R9 | Time pequeno / bus factor 1 | Alta | Médio | Documentação viva, ADRs, fronteiras no CI |
| R10 | Afirmar “WhatsApp oficial” no marketing | Média | Alto | Copy alinhada ao ADR-0016 |

## 7. Decisões técnicas — status

**Fechadas (não reabrir na S0)**

1. Hospedagem → VPS Hostinger + S3 `sa-east-1` (ADR-0008)
2. Deploy → EasyPanel; domínio app + api (ADR-0014)
3. E-mail → Resend; Mailpit local (ADR-0009)
4. Billing SaaS → **manual no MVP**; Stripe / MP / Asaas depois (ADR-0010)
5. UUID v7 na aplicação (ADR-0011)
6. Observabilidade → Sentry + Pino (ADR-0012)
7. KEK → local na VPS; Vault depois (ADR-0013)
8. Envelope AES-256-GCM; campos `customer.notes` e `appointment.notes` (ADR-0007)
9. WhatsApp → **WAHA GOWS** default (ADR-0016)
10. Filas → BullMQ + outbox (ADR-0006)
11. Prisma + RLS (ADR-0004, ADR-0002)

Cada decisão nova gera ADR em `docs/adr/`.

## 8. Como medir se o MVP deu certo

Metas de saída do piloto (3 meses após M5), detalhe em [14](./14-metricas-kpis.md):

| Métrica | Meta |
| --- | --- |
| Barbearias pagantes ativas | rumo a 10 em 90 dias (meta de produto) |
| Retenção mensal de tenants | ≥ 95% |
| Redução de no-show | ≥ 20% relativo ao mês anterior à adoção |
| Onboarding publicado em < 10 min (loja única) | p90 < 20 min |
| Primeiro agendamento pela página pública | ≥ 50% dos ativados |
| Uso da agenda como fonte única | 100% das piloto |
| p95 da grade de horários | < 500 ms |
| Incidentes S1 (vazamento tenant/unidade) | 0 |
| NPS do piloto | ≥ 50 |

## 9. Se o prazo apertar — ordem de corte

Cortar, nesta ordem: relatório consolidado da rede → preço sobrescrito por unidade → back-office (queries manuais) → WhatsApp (fica só e-mail) → comissões.

**Nunca cortar:** `location_id` no schema, isolamento multi-tenant, prevenção de overbooking, página pública, suíte de isolamento no CI.

## Referências

- [04 — Escopo do MVP](./04-escopo-mvp.md)
- [09 — Frontend](./09-frontend.md)
- [12 — Qualidade e testes](./12-qualidade-testes.md)
- [14 — Métricas](./14-metricas-kpis.md)
- [17 — Segurança baseline](./17-seguranca-baseline.md) §12 (fundação na S0)
- [Sprint 0 — Fundação](./desenvolvimento/sprints/S0-fundacao.md)
