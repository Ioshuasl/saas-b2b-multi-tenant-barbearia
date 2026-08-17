# 15 — Glossário (Ubiquitous Language)

Este vocabulário é obrigatório em código, banco, API e conversas. Se um termo do negócio não estiver aqui, ele deve ser adicionado antes de virar nome de classe ou coluna.

## 1. Domínio da barbearia

| Termo (pt-BR) | Termo no código | Definição |
| --- | --- | --- |
| Barbearia / rede | `Tenant` | Empresa assinante; fronteira de isolamento, cobrança e base de clientes |
| Unidade / loja | `Location` | Endereço onde o atendimento acontece; agenda, caixa e página pública próprios |
| Unidade padrão | `is_default` | Criada no onboarding; a UI de rede some enquanto houver só uma |
| Dono | `OWNER` | Papel que vê a rede toda e o billing |
| Gerente de unidade | `MANAGER` | Administra só as unidades em `user_locations` |
| Barbeiro / profissional | `Staff` | Quem aparece na agenda; pode ou não ter login (`user_id` opcional) |
| Recepcionista | `RECEPTIONIST` | Marca/remarca/cancela na unidade do escopo |
| Cliente final | `Customer` | Quem agenda; identificado por telefone E.164; **não** é usuário pago |
| Serviço | `Service` | Item do catálogo da **rede** (corte, barba…); preço/duração podem ser sobrescritos por unidade (`location_services`) |
| Jornada | `business_hours` com `staff_id` | Horário do profissional naquela unidade; `staff_id` null = horário da unidade |
| Bloqueio | `TimeBlock` | Folga, almoço, feriado; pontual ou RRULE |
| Agendamento | `Appointment` | Horário marcado; estados `SCHEDULED` → `CONFIRMED` → `IN_SERVICE` → `COMPLETED` (+ `CANCELLED`, `NO_SHOW`) |
| No-show / furou | `NO_SHOW` | Cliente não compareceu |
| Página pública | rota `/{tenantSlug}/{locationSlug}` | Fluxo de agendamento sem login |
| Comissão | `commission_percent` / relatório | % do `Staff` sobre atendimentos `COMPLETED` |
| Pagamento do atendimento | `Payment` | Dinheiro que o **cliente paga à barbearia** (não confundir com assinatura SaaS) |

## 2. Domínio de negócio (SaaS e gestão)

| Termo | Código | Definição |
| --- | --- | --- |
| Tenant | `Tenant` | A rede assinante |
| Unidade | `Location` | Fronteira **operacional e de autorização**, não de RLS |
| Escopo de unidades | `user_locations` | Quais lojas o usuário enxerga; `OWNER` ignora a tabela |
| Assinatura (SaaS) | `Subscription` | Contrato plataforma → barbearia |
| Trial | `TRIALING` | 14 dias sem cartão |
| Inadimplência negociada | `PAST_DUE` / `NEGOTIATING` / `grace_until` | Nada desliga antes de contato humano e prazo acordado |
| Plano | `Plan` | Limites de profissionais **e** unidades |
| Operador da plataforma | `platform_admin` | Back-office; MFA obrigatório; impersonation somente leitura no MVP |

## 3. Domínio técnico

| Termo | Definição |
| --- | --- |
| Agregado (Aggregate) | Conjunto de entidades com uma raiz que garante invariantes |
| Value Object | Objeto imutável definido por seus valores (ex.: `TimeSlot`, telefone E.164) |
| Bounded context | Fronteira de significado; um módulo do monólito |
| Evento de domínio | Fato no passado (`scheduling.appointment_scheduled`) |
| Outbox | Tabela que grava eventos na mesma transação do agregado |
| Use case | Vive em `services/<entidade>/` com classe curta (`CreateService`) |
| Port | Dependência externa em `types/ports/` |
| Action | Persistência + efeito além do repositório; ausente no CRUD puro |
| RLS | Filtro de linhas do PostgreSQL por `tenant_id` |
| Idempotência | Operação repetida não muda o resultado |
| WAHA | Gateway self-hosted default ([ADR-0016](./adr/0016-waha-default-messaging.md)); engine GOWS |
| Sessão WAHA | Uma conexão WhatsApp por tenant (`session_name`) |
| Texto de automação | Mensagem nossa com variáveis; **não** é template aprovado da Meta no caminho WAHA |
| WABA | WhatsApp Business Account (Cloud API; adapter opcional por env) |
| `provider_message_id` | Id da mensagem no provedor; idempotência de webhook |
| Break-glass | Acesso emergencial de suporte, aprovado e auditado |
| Fitness function | Teste que valida uma regra arquitetural |
| Expand/contract | Migração em duas etapas para evitar downtime |

## 4. Segurança, privacidade e compliance

Vocabulário alinhado a [10](./10-seguranca-lgpd-compliance.md), [17](./17-seguranca-baseline.md) e [ADR-0007](./adr/0007-criptografia-envelope-tenant.md).

| Termo | Código | Definição |
| --- | --- | --- |
| Controlador | — | A barbearia (tenant): decide a finalidade do tratamento |
| Operador | — | A plataforma: trata dados em nome da barbearia (DPA) |
| Titular | `Customer` (quando cliente final) | Pessoa a quem se referem os dados |
| Encarregado (DPO) | — | Canal com titulares e ANPD |
| DPA | — | Contrato de operador de dados |
| Consentimento | `marketing_opt_in` | Marketing exige opt-in; transacional não |
| Minimização | — | Nome + telefone no público; **sem CPF** no MVP |
| Anonimização | `anonymize` | Nome genérico; telefone/e-mail null; agenda preservada |
| Portabilidade | `EXPORT` | JSON/CSV do tenant ou do cliente |
| Envelope encryption | `TenantCrypto` | DEK cifra o campo; KEK cifra a DEK |
| DEK | `DataEncryptionKey` | Chave por tenant (AES-256-GCM); plaintext só em memória |
| KEK | `KeyEncryptionKey` | Chave mestra na VPS (MVP); Vault depois |
| Wrap / Unwrap | `KeyManagementPort` | Cifrar/decifrar a DEK |
| AAD | `aad` | `tenantId\|table\|column\|rowId` no GCM |
| Ciphertext | — | Conteúdo cifrado persistido |
| E2EE | — | **Não adotado** no MVP |
| Modelo enterprise | — | TLS + at-rest + envelope; servidor descriptografa no request autorizado |
| RBAC | `Role` + `authorize` | Papel + unidade + `staff_id` |
| BOLA / IDOR | — | Mitigado por RLS + 404 |
| Argon2id | — | Hash de senha; mínimo 10 caracteres |
| Refresh rotativo | `RefreshTokenFamily` | Reuso revoga a família |
| Trilha de auditoria | `audit_log` | Append-only; nem o Owner apaga |

Campos no envelope no MVP: `customer.notes`, `appointment.notes`. Nome e telefone permanecem plaintext para busca.

## 5. Convenções de nomenclatura

| Contexto | Convenção | Exemplo |
| --- | --- | --- |
| Tabelas e colunas | `snake_case`, singular | `appointment`, `starts_at` |
| Payload de API | `camelCase` | `startsAt`, `totalCents` |
| Classes de operação (backend) | `PascalCase` **curto**, sem entidade | `CreateService`, `ListRepository` |
| Tipagens TS | pasta `types/` (sem `interfaces/`) | `customer_create.types.ts` |
| Enums TypeScript | pasta `enum/` | `customer_origin.enum.ts` |
| Arquivos backend | `snake_case` + sufixo | `customer_create.service.ts` |
| Arquivos frontend | `PascalCase` + papel | `CustomerCreateData.ts` |
| Eventos | `<modulo>.<entidade>_<verbo_passado>` | `scheduling.appointment_scheduled` |
| Códigos de erro | `SCREAMING_SNAKE_CASE` | `SLOT_TAKEN` |
| Jobs/filas | `kebab-case` verbal | `send-whatsapp-message` |
| Dinheiro | inteiro em centavos | `amountCents` / `amount_cents` |
| Datas | `*_at` instante, `*_date` civil | `paid_at` |
| Rotas | substantivo plural, `kebab-case` | `/api/v1/time-blocks` |
| Operações CRUD | `list` / `get` / `create` / `update` / `delete` | alinhado à API REST |

Detalhe Orius em [16](./16-estrutura-de-pastas.md).

## 6. Termos que **não** usamos

| Evitar | Usar | Motivo |
| --- | --- | --- |
| "Paciente" | `Customer` | Domínio da barbearia, não clínico |
| "Empresa"/"Company" | `Tenant` (ou “barbearia”/“rede” na UI) | Consistência multi-tenant |
| "Consulta" como tabela | `Appointment` | Agendamento é o registro |
| "Assinatura" sem qualificar | `Subscription` (SaaS) vs `Signature` (se no futuro) | Ambiguidade |
| "Serviço" para caso de uso | pasta `services/` vs entidade `Service` (catálogo) | Qualificar: “serviço da barbearia” vs `CreateService` |
| "Cancelado" para falta | `NO_SHOW` | Consequências diferentes |
| "Deletar" cliente com histórico | `anonymize` / inativar | Integridade da agenda |
| "WhatsApp oficial" no caminho default | WAHA GOWS + ciência de risco | ADR-0016 |
| "Evolution" como provedor vigente | WAHA | ADR-0015/0016 |
| "Checkout" / "cartão no app" no MVP | billing **manual** | ADR-0010 |
| "E2EE" / "ponta a ponta" para o modelo atual | TLS + at-rest + envelope | ADR-0007 |
| "Criptografado" sem dizer onde | Qualificar: trânsito, repouso, envelope | Evita falsa segurança |
| "Log de auditoria" editável pelo Owner | `audit_log` append-only | Nem o Owner apaga |
| "Chave no `.env`" para DEK | DEK wrapped; KEK na VPS | ADR-0013 |
| "Cliente" para a barbearia em código de domínio | `Tenant` | “Cliente” na UI do SaaS somos nós falando da barbearia; no domínio operacional cliente = `Customer` |

## Referências

- [05 — Arquitetura](./05-arquitetura.md)
- [09 — Frontend](./09-frontend.md)
- [10 — Segurança, LGPD](./10-seguranca-lgpd-compliance.md)
- [16 — Estrutura de pastas](./16-estrutura-de-pastas.md)
