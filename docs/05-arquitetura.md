# 05 — Arquitetura

## 1. Visão geral

Monólito modular deployado como uma única aplicação Node.js, com módulos internos (bounded contexts) isolados por fronteiras explícitas, cada um organizado em camadas segundo Clean Architecture + DDD. O frontend Next.js é uma aplicação separada que consome a API `/api/v1`.

```
                         ┌───────────────────────────┐
   Navegador (painel)    │  Next.js (React + TSX)    │
   Celular (cliente)     │  App Router, SSR/CSR      │
                         └────────────┬──────────────┘
                                      │ HTTPS  /api/v1
                         ┌────────────▼──────────────┐
                         │      API Express (BFF-less)│
                         │  ┌──────────────────────┐  │
                         │  │ routes + controllers  │  │  rotas v1, controllers finos, Zod
                         │  ├──────────────────────┤  │
                         │  │ services              │  │  casos de uso, transações
                         │  ├──────────────────────┤  │
                         │  │ models                │  │  entidades, agregados, VOs, regras
                         │  ├──────────────────────┤  │
                         │  │ repositories + shared │  │  Prisma, S3, WhatsApp, e-mail, filas
                         │  └──────────────────────┘  │
                         │   módulos: identity,        │
                         │   locations, customers,     │
                         │   scheduling, billing,      │
                         │   messaging, reporting,     │
                         │   subscription              │
                         └───┬────────────┬────────────┘
                             │            │
                   ┌─────────▼──┐   ┌─────▼─────────┐   ┌──────────────┐
                   │ PostgreSQL │   │ Redis + BullMQ│   │ Object store │
                   │  (RLS)     │   │ (jobs/cron)   │   │ (S3/R2)      │
                   └────────────┘   └───────┬───────┘   └──────────────┘
                                            │
                                     ┌──────▼───────────────┐
                                     │ Worker (mesmo código)│  consumidores de fila
                                     └──────┬───────────────┘
                                            │
        WAHA (GOWS) · e-mail (Resend) · S3 sa-east-1 · Sentry
```

Duas execuções do **mesmo artefato**: processo `api` (HTTP) e processo `worker` (filas/cron). Isso mantém um único deploy conceitual sem acoplar latência de request a trabalho assíncrono.

## 2. Por que monólito modular

Detalhado em [ADR-0001](./adr/0001-monolito-modular.md). Em resumo: com um time pequeno e domínio ainda em descoberta, microsserviços transferem complexidade de negócio para complexidade operacional. O monólito modular preserva a opção de extrair um módulo depois — desde que as fronteiras sejam respeitadas desde o dia 1.

**As fronteiras são a única coisa que não podemos relaxar.** Se módulos passarem a importar internals uns dos outros, o resultado é um monólito emaranhado — o pior dos dois mundos.

## 3. Módulos (bounded contexts)

| Módulo | Responsabilidade | Agregados principais |
| --- | --- | --- |
| `identity` | Autenticação, usuários, papéis, convites, sessões | `User`, `Invitation`, `Role` |
| `locations` | Rede (tenant), unidades, horários, catálogo de serviços, profissionais, configurações | `Tenant`, `Location`, `BusinessHours`, `Service`, `Staff`, `TimeBlock` |
| `customers` | Cadastro de clientes finais, deduplicação por telefone, histórico | `Customer` |
| `scheduling` | Agenda, disponibilidade, agendamentos, bloqueios, página pública | `Appointment`, `Availability` |
| `billing` | Financeiro da barbearia: pagamentos de atendimento, comissões | `Payment`, `CommissionEntry` |
| `messaging` | WhatsApp + e-mail, templates, lembretes, log de envio | `Notification`, `MessageTemplate` |
| `reporting` | Consultas de leitura/relatórios (CQRS-lite: views) | — (read models) |
| `subscription` | Assinatura do SaaS, planos, limites, trial, PaymentProvider | `Subscription`, `Plan`, `Invoice` |
| `platform` (em `shared/`) | Erros base, tenant context, auditoria, outbox, exportação/LGPD, feature flags, filas | `TenantId`, `DomainEvent`, `AuditLog` |

> Sem módulos de prontuário clínico nem orçamentos de tratamento — fora do domínio da barbearia.

### Regras de dependência entre módulos

```
identity  ← (todos, apenas para contexto de usuário/permissão)
locations ← customers, scheduling, billing, messaging
customers ← scheduling, billing, messaging
scheduling ← messaging (confirmações/lembretes), billing (pagamento ao concluir)
reporting → lê read models de todos (nunca escreve)
subscription ← identity/locations (limites de plano: profissionais e unidades)
```

1. Um módulo **só** pode importar de outro através do seu `<dominio>_public.ts` (contratos e DTOs), nunca de `models/`, `services/` ou `repositories/` alheios.
2. Comunicação preferencial entre módulos é por **evento de domínio** (in-process, transacional via outbox), não por chamada direta.
3. Chamada síncrona cross-module é permitida apenas para **consulta** (ex.: `customers.getCustomerSummary(id)`), exposta como port do módulo consumidor.
4. Não há foreign key física entre agregados de módulos diferentes quando isso impediria extração futura — usamos FK apenas dentro do módulo e por `tenant_id`; entre módulos, referência por ID com validação na aplicação. **Exceção pragmática:** FK para `customers.customer` e `locations.tenant` / `locations.location` é permitida por serem o núcleo compartilhado.
5. `reporting` pode ler tabelas de outros módulos **somente** através de views versionadas (`vw_*`), que funcionam como contrato.

Essas regras são verificadas automaticamente (ver seção 8).

## 4. Camadas (dentro de cada módulo)

A estrutura de pastas segue o **padrão Orius** do time (1 arquivo por operação, classes curtas, `snake_case` no backend), com `models/` rico (DDD) e `actions/` só quando há efeito além do repositório. Mapeamento completo, nomenclatura e exemplo canônico `Customer` em [16 — Estrutura de Pastas](./16-estrutura-de-pastas.md).

```
backend/src/modules/customers/
├── models/                              # DOMÍNIO: regra pura — zero dependência externa
│   ├── customer.model.ts
│   ├── value-objects/{phone-number}.vo.ts
│   ├── events/customer-created.event.ts
│   └── errors/duplicate-customer-phone.error.ts
├── schemas/
│   └── customer.schema.ts               # Zod: create/update/list
├── repositories/customer/               # 1 operação = 1 arquivo; classe curta
│   ├── customer_list.repository.ts      # class ListRepository
│   ├── customer_get.repository.ts       # class GetRepository
│   ├── customer_create.repository.ts    # class CreateRepository
│   ├── customer_update.repository.ts
│   ├── customer_delete.repository.ts
│   ├── customer_get_by_phone.repository.ts
│   └── mappers/customer.mapper.ts
├── actions/customer/                    # SÓ se houver efeito além do repositório
│   └── customer_create.action.ts        # class CreateAction (persist + outbox)
├── services/customer/                   # 1 operação = 1 arquivo; classe curta
│   ├── customer_list.service.ts         # class ListService
│   ├── customer_get.service.ts          # class GetService
│   ├── customer_create.service.ts       # class CreateService
│   ├── customer_update.service.ts
│   ├── customer_delete.service.ts
│   └── customer_get_by_phone.service.ts
├── controllers/
│   └── customer.controller.ts
├── routes/v1/customer.routes.ts
├── types/
│   ├── customer/{customer_create,customer_list}.types.ts
│   └── ports/scheduling.port.ts
├── enum/customer/
│   └── customer_origin.enum.ts
├── subscribers/
├── jobs/
├── helpers/
├── customers_public.ts
└── customers.module.ts
```

Vocabulário de operação alinhado à API REST: `list` / `get` / `create` / `update` / `delete` (+ `get_by_<uk>` e verbos de domínio como `confirm`, `cancel`).

### Regra de dependência (a regra da Clean Architecture)

```
controllers · routes · repositories · jobs · subscribers · actions
        │                                              ▲
        ▼                                              │
    services  ──────────────────────────────────►  models
                      │
                      └── types/ · enum/
```

- `models/` (domínio) não importa Express, Prisma, Zod ou HTTP.
- `services/` orquestra; chama `models/`, `actions/` (quando existir) ou `repositories/` — nunca Prisma Client direto.
- `actions/` só quando há efeito além do repositório (evento/outbox/outro módulo); CRUD puro: `Service → Repository`.
- Tipagens e ports em `types/`; enums em `enum/` — **não há pasta `interfaces/`**.
- `controllers/`, `routes/`, `repositories/`, `jobs/` e `subscribers/` são a borda.
- Verificado por lint (`eslint-plugin-boundaries` / `import/no-restricted-paths`) e por `dependency-cruiser`.

Equivalência com o vocabulário canônico de Clean Architecture:

| Camada canônica | Pasta aqui |
| --- | --- |
| `domain` (entidades, VOs, eventos, domain services) | `models/` |
| `application` (use cases) | `services/` + `actions/` (quando houver) |
| `application` (ports + tipagens) | `types/` (inclui `types/ports/`) |
| enums / constantes tipadas | `enum/` |
| `interface` (HTTP) | `controllers/` + `routes/` + `schemas/` |
| `infrastructure` (adapters) | `repositories/`, `jobs/`, `shared/integrations/` |

> **`models/` aqui não é model de ORM.** Com Prisma, o mapeamento de tabelas vive em `prisma/schema.prisma`; `models/` guarda o modelo **de domínio**.

## 5. Exemplos de código canônicos

### 5.1 Entidade de domínio em `models/` (nada de framework aqui)

```ts
// modules/scheduling/models/appointment.model.ts
import { TenantId, EntityId, DomainEvent } from '@/shared/domain';
import { TimeSlot } from './value-objects/time-slot.vo';
import { AppointmentStatus } from './value-objects/appointment-status.vo';
import { AppointmentScheduled } from './events/appointment-scheduled.event';
import { InvalidStatusTransitionError } from './errors/invalid-status-transition.error';

export interface AppointmentProps {
  tenantId: TenantId;
  locationId: EntityId;
  customerId: EntityId;
  staffId: EntityId;
  slot: TimeSlot;
  status: AppointmentStatus;
  notes: string | null;
}

export class Appointment {
  private events: DomainEvent[] = [];

  private constructor(
    readonly id: EntityId,
    private props: AppointmentProps,
  ) {}

  static schedule(id: EntityId, props: Omit<AppointmentProps, 'status'>): Appointment {
    const appointment = new Appointment(id, { ...props, status: AppointmentStatus.SCHEDULED });
    appointment.events.push(
      new AppointmentScheduled({
        tenantId: props.tenantId,
        appointmentId: id,
        customerId: props.customerId,
        startsAt: props.slot.start,
      }),
    );
    return appointment;
  }

  confirm(): void {
    this.transitionTo(AppointmentStatus.CONFIRMED);
  }

  cancel(reason: string): void {
    this.transitionTo(AppointmentStatus.CANCELLED);
    this.props.notes = reason;
  }

  reschedule(slot: TimeSlot): void {
    if (this.props.status.isFinal()) {
      throw new InvalidStatusTransitionError(this.props.status, 'reschedule');
    }
    this.props.slot = slot;
    this.props.status = AppointmentStatus.SCHEDULED;
  }

  private transitionTo(next: AppointmentStatus): void {
    if (!this.props.status.canTransitionTo(next)) {
      throw new InvalidStatusTransitionError(this.props.status, next.value);
    }
    this.props.status = next;
  }

  pullEvents(): DomainEvent[] {
    const pending = this.events;
    this.events = [];
    return pending;
  }

  get slot(): TimeSlot { return this.props.slot; }
  get status(): AppointmentStatus { return this.props.status; }
  get tenantId(): TenantId { return this.props.tenantId; }
}
```

### 5.2 Value object com invariante

```ts
// modules/scheduling/models/value-objects/time-slot.vo.ts
import { InvalidTimeSlotError } from '../errors/invalid-time-slot.error';

export class TimeSlot {
  private constructor(readonly start: Date, readonly end: Date) {}

  static create(start: Date, end: Date): TimeSlot {
    if (end <= start) throw new InvalidTimeSlotError('end must be after start');
    const minutes = (end.getTime() - start.getTime()) / 60_000;
    if (minutes < 5 || minutes > 8 * 60) {
      throw new InvalidTimeSlotError('duration must be between 5 minutes and 8 hours');
    }
    return new TimeSlot(start, end);
  }

  overlaps(other: TimeSlot): boolean {
    return this.start < other.end && other.start < this.end;
  }

  get durationMinutes(): number {
    return (this.end.getTime() - this.start.getTime()) / 60_000;
  }
}
```

### 5.3 Máquina de estados do agendamento

```ts
// modules/scheduling/models/value-objects/appointment-status.vo.ts
const TRANSITIONS = {
  SCHEDULED: ['CONFIRMED', 'IN_SERVICE', 'NO_SHOW', 'CANCELLED'],
  CONFIRMED: ['IN_SERVICE', 'NO_SHOW', 'CANCELLED'],
  IN_SERVICE: ['COMPLETED'],
  COMPLETED: [],
  NO_SHOW: ['SCHEDULED'],
  CANCELLED: [],
} as const;

export type AppointmentStatusValue = keyof typeof TRANSITIONS;

export class AppointmentStatus {
  private constructor(readonly value: AppointmentStatusValue) {}

  static readonly SCHEDULED = new AppointmentStatus('SCHEDULED');
  static readonly CONFIRMED = new AppointmentStatus('CONFIRMED');
  static readonly IN_SERVICE = new AppointmentStatus('IN_SERVICE');
  static readonly COMPLETED = new AppointmentStatus('COMPLETED');
  static readonly NO_SHOW = new AppointmentStatus('NO_SHOW');
  static readonly CANCELLED = new AppointmentStatus('CANCELLED');

  canTransitionTo(next: AppointmentStatus): boolean {
    return (TRANSITIONS[this.value] as readonly string[]).includes(next.value);
  }

  isFinal(): boolean {
    return TRANSITIONS[this.value].length === 0;
  }
}
```

### 5.4 Caso de uso (`services/`) — classe curta, 1 operação por arquivo

Padrão Orius: arquivo `customer_create.service.ts`, classe `CreateService`. Quando há efeito além do repositório (outbox, outro módulo), o service delega a um `CreateAction`. Detalhes em [doc 16](./16-estrutura-de-pastas.md).

```ts
// modules/customers/services/customer/customer_create.service.ts
import type { GetByPhoneService } from './customer_get_by_phone.service';
import type { CreateAction } from '../../actions/customer/customer_create.action';
import type { CustomerCreateSchema } from '../../schemas/customer.schema';
import { DuplicateCustomerPhoneError } from '../../models/errors/duplicate-customer-phone.error';
import type { RequestContext } from '@/shared/domain';

export class CreateService {
  constructor(
    private readonly getByPhone: GetByPhoneService,
    private readonly createAction: CreateAction,
  ) {}

  async execute(ctx: RequestContext, customerSchema: CustomerCreateSchema) {
    const existing = await this.getByPhone.execute(ctx, customerSchema.phone, false);
    if (existing) throw new DuplicateCustomerPhoneError(customerSchema.phone);
    return this.createAction.execute(ctx, customerSchema);
  }
}
```

### 5.5 Controller (interface HTTP) — fino por definição

```ts
// modules/customers/controllers/customer.controller.ts
import type { Request, Response } from 'express';
import { customerCreateSchema } from '../schemas/customer.schema';
import type { CreateService } from '../services/customer/customer_create.service';

export class CustomerController {
  constructor(private readonly createService: CreateService) {}

  create = async (req: Request, res: Response): Promise<void> => {
    const customerSchema = customerCreateSchema.parse(req.body);
    const result = await this.createService.execute(req.ctx, customerSchema);
    res.status(201).json({ data: result });
  };
}
```

Erros de domínio são convertidos em HTTP por um **error handler central** (mapa `DomainError → status`), nunca com `try/catch` espalhado em controllers. Parâmetro tipado: `customerSchema` — nunca `data` genérico.

### 5.6 Repositório — 1 operação por arquivo, classe curta

```ts
// modules/customers/repositories/customer/customer_create.repository.ts
import { CustomerMapper } from './mappers/customer.mapper';
import type { Customer } from '../../models/customer.model';
import type { TenantPrisma } from '@/shared/database/tenant-prisma';
import type { RequestContext } from '@/shared/domain';

export class CreateRepository {
  constructor(private readonly db: TenantPrisma) {}

  async execute(ctx: RequestContext, customer: Customer): Promise<void> {
    const row = CustomerMapper.toPersistence(customer);
    await this.db.runInTenantContext(ctx, async (tx) => {
      await tx.customer.create({ data: row });
    });
  }
}
```

`TenantPrisma` garante `SET LOCAL app.tenant_id` na transação corrente (ver [Multi-Tenancy](./06-multi-tenancy.md)) — nenhum repositório monta `tenant_id` à mão em `WHERE`.

### 5.7 Evento de domínio + outbox (via Action)

```ts
// modules/customers/actions/customer/customer_create.action.ts
export class CreateAction {
  constructor(
    private readonly createRepository: CreateRepository,
    private readonly uow: UnitOfWork,
    private readonly ids: IdGenerator,
  ) {}

  async execute(ctx: RequestContext, customerSchema: CustomerCreateSchema) {
    return this.uow.run(ctx, async () => {
      const customer = Customer.create(this.ids.next(), { /* ... */ });
      await this.createRepository.execute(ctx, customer);
      await this.uow.publish(customer.pullEvents()); // outbox na mesma transação
      return customer;
    });
  }
}
```

```ts
// modules/messaging/subscribers/on-appointment-scheduled.subscriber.ts
export class OnAppointmentScheduledSubscriber {
  constructor(private readonly enqueue: ScheduleConfirmationMessages) {}

  static readonly event = 'scheduling.appointment_scheduled';

  async handle(event: AppointmentScheduledPayload): Promise<void> {
    await this.enqueue.execute({
      tenantId: event.tenantId,
      appointmentId: event.appointmentId,
      customerId: event.customerId,
      startsAt: event.startsAt,
    });
  }
}
```

Fluxo: Action grava agregado **e** registro na tabela `outbox_event` na mesma transação → dispatcher (no worker) lê o outbox, entrega aos subscribers e marca como processado. Entrega **at-least-once**; handlers idempotentes.

## 6. Estrutura do repositório

```
.
├── backend/
│   ├── src/
│   │   ├── server.ts             # bootstrap HTTP (listen)
│   │   ├── worker.ts             # bootstrap de filas/cron (mesmo código, outro processo)
│   │   ├── app.ts                # Express: middlewares + rotas (sem listen — testável)
│   │   ├── routes/index.ts       # monta /api/v1 a partir das rotas de cada módulo
│   │   ├── docs/openapi.yaml     # gerado dos schemas Zod (não editar à mão)
│   │   ├── shared/
│   │   │   ├── config/           # env schema (Zod), constantes
│   │   │   ├── database/         # prisma client, tenant-prisma (RLS), unit-of-work, outbox
│   │   │   ├── middlewares/      # auth, tenant, error handler, rate limit, requestId
│   │   │   ├── integrations/     # WAHA, Resend, PaymentProvider (manual no MVP)
│   │   │   ├── crypto/           # KeyManagementPort + envelope AES-GCM
│   │   │   ├── storage/          # ObjectStorage (MinIO/S3)
│   │   │   ├── queue/            # filas BullMQ, dispatcher do outbox, scheduler
│   │   │   ├── domain/           # kernel: EntityId, TenantId, DomainEvent, erros base
│   │   │   └── helpers/          # puro e reutilizável: datas, moeda, telefone, id
│   │   └── modules/
│   │       ├── identity/  locations/  customers/  scheduling/
│   │       └── billing/  messaging/  reporting/  subscription/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   └── test/                     # setup de integração (Testcontainers), factories
├── frontend/
│   └── src/
│       ├── app/                  # rotas (Next.js App Router) — 1 pasta ≈ 1 rota
│       ├── packages/             # admin/ · operacional/ · financeiro/ · messaging/ · public/
│       └── shared/               # ui, layout, api, hooks, helpers
├── contracts/                    # tipos/DTOs compartilhados backend↔frontend (dos schemas Zod)
├── docs/
├── docker-compose.yml
└── package.json                  # workspaces (pnpm)
```

`contracts/` é o único ponto de acoplamento entre frontend e backend: os schemas Zod das rotas são a fonte da verdade e exportam tipos para o frontend.

## 7. Composição de dependências (DI simples, sem framework)

```ts
// modules/customers/customers.module.ts
export function buildCustomersModule(deps: SharedDeps): CustomersModule {
  const listRepository = new ListRepository(deps.db);
  const createRepository = new CreateRepository(deps.db);
  const getByPhoneRepository = new GetByPhoneRepository(deps.db);

  const getByPhoneService = new GetByPhoneService(getByPhoneRepository);
  const createAction = new CreateAction(createRepository, deps.uow, deps.ids);
  const createService = new CreateService(getByPhoneService, createAction);
  const listService = new ListService(listRepository);

  const controller = new CustomerController(createService, listService /* … */);

  return {
    routes: buildCustomerRoutes(controller),
    subscribers: [],
    publicApi: { getCustomerSummary: /* ... */ },
  };
}
```

Injeção manual por construtor: explícita, tipada, sem decorators nem container mágico. Classes curtas (`CreateService`, `ListRepository`) — a entidade está no caminho do arquivo, não no nome da classe.

## 8. Fitness functions (a arquitetura verificada por CI)

| Verificação | Ferramenta |
| --- | --- |
| `models/` não importa Prisma/Express/Zod/axios | `dependency-cruiser` (regra `no-framework-in-models`) |
| `services/` não importa `@prisma/client` nem `controllers/` | `dependency-cruiser` |
| Prisma só em `repositories/` e `shared/database/` | `dependency-cruiser` |
| Módulo só importa `<dominio>_public.ts` de outro módulo | `eslint-plugin-boundaries` |
| Sem dependência circular entre módulos | `dependency-cruiser` |
| Toda tabela com dado de tenant tem `tenant_id` + policy RLS | teste de integração que varre `information_schema` |
| Nenhuma query sem contexto de tenant | teste que roda os casos de uso sem `SET app.tenant_id` e espera erro |
| Cobertura mínima em `models/` e `services/` | Vitest coverage (limite ≥ 85% em `models/`) |
| Contrato da API não quebra | snapshot do OpenAPI gerado + teste de compatibilidade |

## 9. Decisões técnicas complementares

| Tema | Escolha | Racional |
| --- | --- | --- |
| Runtime | Node.js LTS (≥ 22) | Estabilidade, suporte longo |
| Linguagem | TypeScript `strict` + `noUncheckedIndexedAccess` | Segurança de tipos real; proíbe `any`/`as` casual |
| HTTP | Express 5 | Maduro, com `async` nativo no 5 |
| Validação | Zod nos limites (HTTP, env, webhook) | Um schema = validação + tipo |
| ORM | Prisma | DX, migrações versionadas, tipos gerados ([ADR-0004](./adr/0004-orm-prisma.md)) |
| Consultas complexas/relatório | SQL cru via `$queryRaw` tipado ou views | ORM não é bom para relatório; view é contrato |
| Filas/cron | BullMQ + Redis ([ADR-0006](./adr/0006-filas-bullmq.md)) | Retry, backoff, delayed jobs (lembrete 24h/2h) |
| Autenticação | JWT curto + refresh rotativo httpOnly | Sem sessão em memória |
| Storage | AWS S3 `sa-east-1` com URL pré-assinada ([ADR-0008](./adr/0008-hospedagem-vps-hostinger-s3.md)) | Logos/fotos; upload não passa pela API |
| Logs | Pino (JSON) com `requestId`/`tenantId`/`locationId`/`userId` ([ADR-0012](./adr/0012-observabilidade-sentry-logs.md)) | Correlação; Sentry para erros |
| Erros | Hierarquia `DomainError`/`ApplicationError`/`InfraError` + handler central | Mapeamento consistente para HTTP |
| Datas | UTC no banco, timezone **da unidade** na borda; `date-fns-tz` | Rede pode cruzar fusos |
| Dinheiro | Inteiro em centavos, nunca `float` | Precisão |
| IDs | UUID v7 gerado na **aplicação** (`IdGenerator`) | Ordenável por tempo ([ADR-0011](./adr/0011-uuid-v7-aplicacao.md)) |
| Pagamentos SaaS | **Manual no MVP** ([ADR-0010](./adr/0010-billing-saas-manual-mvp.md)); candidatos Stripe / Mercado Pago / Asaas | Sem checkout até novo ADR |
| WhatsApp | **WAHA GOWS** default ([ADR-0016](./adr/0016-waha-default-messaging.md)); Cloud API só por env; e-mail Resend fallback ([ADR-0009](./adr/0009-email-resend.md)) | Atrás de `MessagingProvider` |
| Hospedagem | VPS Hostinger + EasyPanel ([ADR-0008](./adr/0008-hospedagem-vps-hostinger-s3.md), [ADR-0014](./adr/0014-deploy-easypanel-dominios.md)) | Postgres/Redis na mesma VPS |
| Criptografia | Envelope AES-256-GCM por tenant ([ADR-0007](./adr/0007-criptografia-envelope-tenant.md)); KEK local ([ADR-0013](./adr/0013-kms-local-vps.md)) | `shared/crypto/` |
| Testes | Vitest + Supertest + Testcontainers (Postgres) + Playwright (e2e) | Testar RLS exige banco real |
| Docs de API | OpenAPI gerado dos schemas Zod (`zod-to-openapi`) + Scalar/Swagger UI | Documentação que não mente |

## 10. Anti-padrões proibidos

1. Controller com regra de negócio ou query.
2. Entidade anêmica em `models/` (só getters/setters) com a regra toda no `service`.
3. Prefixo da entidade no nome da classe (`CustomerCreateService` ❌ → `CreateService` ✅).
4. Parâmetro genérico `data` — usar `customerSchema` / tipagem explícita.
5. `actions/` para CRUD puro sem efeito colateral.
6. `PrismaClient` importado fora de `repositories/` ou `shared/database/`.
7. Módulo importando `../outro-modulo/models/...` — só `<dominio>_public.ts`.
8. `any`, `as unknown as`, acesso dinâmico a atributo para escapar de tipos.
9. Query sem `tenant_id`/RLS ativa.
10. Aceitar `tenant_id` vindo do body/query string.
11. Lógica de negócio duplicada no frontend (frontend valida para UX; a verdade é do servidor).
12. Job sem idempotência ou sem limite de retry.
13. Segredo em `.env` comitado ou log de dado pessoal (telefone, tokens).
