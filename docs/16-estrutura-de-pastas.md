# 16 — Estrutura de Pastas e Convenções de Código

Este documento fixa a estrutura de pastas do projeto. Ele reaproveita o **padrão Orius** (1 arquivo por operação CRUD em cada camada, classes curtas, separação explícita) — o mesmo do prontuário odontológico / módulos Orius do time — adaptado ao stack Node/TypeScript + Next.js + Prisma deste SaaS de barbearias.

Princípio geral: **a convenção de pastas/nomenclatura é do time (Orius); a regra de dependência e o `models/` rico são da arquitetura (DDD/Clean).** As duas coisas coexistem.

Referência canônica neste doc: entidade **`Customer`** (módulo `customers`).

---

## 0. Decisões fechadas (resumo)

| Tema | Decisão |
| --- | --- |
| Relação com DDD/`models/` | Híbrido: mantém `models/` com invariantes; granularidade Orius (1 arquivo por ação) em service/repository/action |
| Camada `actions/` | **Só quando há efeito além do repositório** (evento, outro módulo, outbox, side-effect). CRUD puro: `Service → Repository` |
| Nome da classe | Curto, **sem** prefixo da entidade: `ListService`, `CreateRepository`, `CreateAction` |
| Nome do arquivo | Backend: `snake_case` (`customer_create.service.ts`). Frontend: `PascalCase` (`CustomerCreateService.ts`) |
| Vocabulário de operação | Alinhado à API REST: `list` / `get` / `create` / `update` / `delete` (+ auxiliares `get_by_<uk>`, verbos de domínio) |
| Frontend | `Data → Service → Hook` por ação + **TanStack Query** no hook; tipagens em `types/`, enums em `enum/` |
| Exemplo canônico | `Customer` |

---

## 1. Backend

### 1.1 Estrutura na raiz

```
backend/src/
├── server.ts
├── worker.ts
├── app.ts
├── routes/
│   └── index.ts                 # monta /api/v1
├── docs/
│   └── openapi.yaml             # gerado dos schemas Zod
├── shared/
│   ├── config/
│   ├── database/                # prisma, tenant-prisma (RLS), unit-of-work, outbox
│   ├── middlewares/
│   ├── integrations/            # whatsapp, email, storage, PaymentProvider
│   ├── queue/
│   ├── domain/                  # kernel: EntityId, TenantId, DomainEvent, erros base
│   └── helpers/
└── modules/
    └── <dominio>/               # ver 1.2
```

Módulos (bounded contexts): `identity`, `locations`, `customers`, `scheduling`, `billing`, `messaging`, `reporting`, `subscription`. Capacidades transversais (`platform`) vivem em `shared/`.

### 1.2 Estrutura de um módulo — exemplo `customers` / `Customer`

```
modules/customers/
├── models/                                    # DOMÍNIO (DDD) — zero framework
│   ├── customer.model.ts
│   ├── value-objects/
│   │   └── phone-number.vo.ts
│   ├── events/
│   │   └── customer-created.event.ts
│   └── errors/
│       └── duplicate-customer-phone.error.ts
│
├── schemas/                                   # Zod (entrada HTTP)
│   └── customer.schema.ts                     # create/update/list query + tipos
│
├── repositories/
│   └── customer/
│       ├── customer_list.repository.ts        # class ListRepository
│       ├── customer_get.repository.ts         # class GetRepository
│       ├── customer_create.repository.ts      # class CreateRepository
│       ├── customer_update.repository.ts      # class UpdateRepository
│       ├── customer_delete.repository.ts      # class DeleteRepository
│       ├── customer_get_by_phone.repository.ts # class GetByPhoneRepository
│       └── mappers/
│           └── customer.mapper.ts             # row ↔ Customer (domínio)
│
├── actions/                                   # SÓ quando há efeito além do repositório
│   └── customer/
│       └── customer_create.action.ts          # class CreateAction
│           # ex.: persiste + publica outbox na mesma UoW
│
├── services/                                  # 1 operação = 1 arquivo = 1 classe curta
│   └── customer/
│       ├── customer_list.service.ts           # class ListService
│       ├── customer_get.service.ts            # class GetService
│       ├── customer_create.service.ts         # class CreateService
│       ├── customer_update.service.ts         # class UpdateService
│       ├── customer_delete.service.ts         # class DeleteService
│       └── customer_get_by_phone.service.ts   # class GetByPhoneService
│
├── controllers/
│   └── customer.controller.ts                 # fino: parse → service → resposta
├── routes/
│   └── v1/customer.routes.ts
├── types/                                     # tipagens TS do módulo (substitui interfaces/)
│   ├── customer/
│   │   ├── customer_create.types.ts
│   │   ├── customer_list.types.ts
│   │   └── customer_summary.types.ts
│   └── ports/
│       └── scheduling.port.ts
├── enum/                                      # enums / mapas const tipados
│   └── customer/
│       └── customer_origin.enum.ts
├── subscribers/
├── jobs/
├── helpers/
├── customers_public.ts                        # fronteira entre módulos
└── customers.module.ts                        # DI + registro de rotas
```

> **`interfaces/` não existe.** Tipagens e ports ficam em `types/`; enums em `enum/`.

### 1.3 Fluxo por camada

```
HTTP  →  routes  →  controller  →  service  →  [action?]  →  repository  →  Prisma
                                      │
                                      └── models/ (invariantes, VOs, eventos)
```

| Situação | Fluxo |
| --- | --- |
| CRUD puro (list/get/update simples) | `Service` → `Repository` |
| Persistência **+** efeito (evento, outro agregado, outbox, chamada a port) | `Service` → `Action` → `Repository` (+ ports) |
| Unicidade / lookup auxiliar | `GetBy<Uk>Service` chamado pelo `CreateService`/`UpdateService` |

### 1.4 Nomenclatura (backend)

| Peça | Convenção | Exemplo |
| --- | --- | --- |
| Arquivo | `snake_case` + sufixo de papel | `customer_create.service.ts` |
| Classe de operação | Curta, **sem** entidade | `CreateService`, `ListRepository`, `CreateAction` |
| Parâmetro de entrada | `<entidade>Schema` / campos tipados — **nunca** `data` genérico | `customerSchema: CustomerCreateSchema` |
| Update | `execute(customerId, customerSchema)` | id no path, body sem PK |
| Operações CRUD | `list` `get` `create` `update` `delete` | alinhado a [08 — API v1](./08-api-v1.md) |
| Auxiliares | `get_by_<campo>` | `customer_get_by_phone.service.ts` → `GetByPhoneService` |
| Verbos de domínio (não-CRUD) | verbo no arquivo/classe | `appointment_confirm.service.ts` → `ConfirmService` |
| Eventos | `<modulo>.<entidade>_<verbo_passado>` | `customers.customer_created` |
| Tipagens | `types/<entidade>/` ou `types/ports/` | `customer_create.types.ts` |
| Enums | `enum/<entidade>/` | `customer_origin.enum.ts` → `CustomerOrigin` |

```
# CRUD Customer
customer_list.service.ts         → class ListService
customer_get.service.ts          → class GetService
customer_create.service.ts       → class CreateService
customer_update.service.ts       → class UpdateService
customer_delete.service.ts       → class DeleteService
customer_get_by_phone.service.ts → class GetByPhoneService

customer_list.repository.ts      → class ListRepository
customer_create.repository.ts    → class CreateRepository
customer_create.action.ts        → class CreateAction   # só se houver efeito extra
```

### 1.5 Quando criar `actions/`

**Criar Action** se o caso de uso, além de ler/gravar no repositório da entidade, também:

- publica evento de domínio / grava outbox;
- chama port de outro módulo;
- orquestra mais de um repositório na mesma transação;
- dispara efeito que não é “só o SQL/Prisma desta entidade”.

**Não criar Action** para: listar, buscar por id, update de campos, soft-delete simples, get_by_phone. Nesses casos o `Service` chama o `Repository` direto.

Exemplo `Customer` — create com outbox:

```ts
// services/customer/customer_create.service.ts
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

// actions/customer/customer_create.action.ts
export class CreateAction {
  constructor(
    private readonly createRepository: CreateRepository,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(ctx: RequestContext, customerSchema: CustomerCreateSchema) {
    return this.uow.run(ctx, async () => {
      const customer = Customer.create(/* ... VOs / invariantes ... */);
      await this.createRepository.execute(ctx, customer);
      await this.uow.publish(customer.pullEvents());
      return customer;
    });
  }
}
```

Exemplo `Customer` — list **sem** Action:

```ts
// services/customer/customer_list.service.ts
export class ListService {
  constructor(private readonly listRepository: ListRepository) {}

  async execute(ctx: RequestContext, query: CustomerListQuery) {
    return this.listRepository.execute(ctx, query);
  }
}
```

### 1.6 Regras de dependência (Clean Architecture)

```
controllers · routes · repositories · jobs · subscribers · actions
        │                                         ▲
        ▼                                         │
    services  ──────────────────────────────►  models
```

- `models/` não importa Express, Prisma, Zod, HTTP.
- `services/` orquestra; chama `models/`, `actions/` (quando existir) ou `repositories/`; não importa Prisma Client direto.
- `actions/` orquestra persistência + efeitos; não conhece HTTP.
- `repositories/` é a única pasta do módulo que fala com Prisma (via `TenantPrisma`).
- Cruzar módulo **somente** por `<dominio>_public.ts`.

Equivalência Clean Architecture:

| Camada canônica | Pasta aqui |
| --- | --- |
| domain | `models/` |
| application (use cases) | `services/` + `actions/` (quando houver) |
| application (ports + tipagens) | `types/` (inclui `types/ports/`) |
| enums / constantes tipadas | `enum/` |
| interface (HTTP) | `controllers/` + `routes/` + `schemas/` |
| infrastructure | `repositories/`, `jobs/`, `shared/integrations/` |

> **`models/` não é model de ORM.** Mapeamento de tabelas: `prisma/schema.prisma`. `models/` = invariantes de domínio.

### 1.7 Onde colocar o quê

| Se você está escrevendo… | Vai em |
| --- | --- |
| regra sempre verdadeira sobre a entidade | `models/` |
| validação de formato de entrada | `schemas/` (Zod) |
| tipagem TS (DTO, input/output, summary) | `types/<entidade>/` |
| port de saída (clock, storage, outro módulo) | `types/ports/` |
| enum / mapa `as const` do domínio | `enum/<entidade>/` |
| orquestração de **uma** operação (list/create/…) | `services/<entidade>/` |
| persistência + efeitos colaterais | `actions/<entidade>/` |
| SQL/Prisma/mapper | `repositories/<entidade>/` |
| `req`/`res`/status HTTP | `controllers/` |
| API externa | `shared/integrations/` (via port em `types/ports/`) |
| API para outro módulo | `<dominio>_public.ts` |

### 1.8 Verificação automática (CI)

```js
// .dependency-cruiser.js (essencial)
forbidden: [
  { name: 'no-framework-in-models', from: { path: 'src/modules/[^/]+/models' },
    to: { dependencyTypes: ['npm'], pathNot: '^(date-fns|uuid)$' } },
  { name: 'services-nao-importam-prisma', from: { path: 'src/modules/[^/]+/services' },
    to: { path: '@prisma/client' } },
  { name: 'cruzar-modulo-so-pelo-public',
    from: { path: 'src/modules/([^/]+)/' },
    to: { path: 'src/modules/(?!$1)([^/]+)/(?!\\2_public\\.ts)' } },
  { name: 'prisma-so-na-borda',
    from: { pathNot: 'src/(shared/database|modules/[^/]+/repositories)' },
    to: { path: '@prisma/client' } },
]
```

---

## 2. Frontend

### 2.1 Estrutura na raiz

```
frontend/src/
├── app/                         # ROTAS (App Router) — page.tsx fino
│   ├── (public)/                # página de agendamento /{tenant}/{location}
│   └── (app)/                   # painel autenticado
│       └── clientes/page.tsx    # só compõe CustomerIndex
├── packages/
│   ├── operacional/             # recepção/barbeiro: Customer, Appointment, Staff…
│   ├── financeiro/              # pagamentos, comissões, relatórios de caixa
│   ├── admin/                   # unidades, serviços, billing SaaS, usuários
│   ├── messaging/               # templates / status de envio (se UI dedicada)
│   └── public/                  # booking público
└── shared/
    ├── ui/
    ├── layout/
    ├── api/                     # api-client + query-client (TanStack)
    ├── hooks/
    ├── auth/
    ├── helpers/
    └── styles/
```

> Não há package `clinico` — domínio da barbearia não tem prontuário.

### 2.2 Estrutura por entidade — padrão Orius + TanStack Query

Camadas **por ação**: `Data → Service → Hook`. O hook é quem usa TanStack Query.

```
packages/operacional/
├── components/Customer/
│   ├── CustomerIndex.tsx
│   ├── CustomerTable.tsx
│   ├── CustomerColumns.tsx
│   ├── CustomerFilter.tsx
│   ├── CustomerForm.tsx
│   ├── CustomerFormDialog.tsx
│   └── CustomerSelectColumns.tsx
├── data/Customer/
│   ├── CustomerListData.ts
│   ├── CustomerGetData.ts
│   ├── CustomerCreateData.ts
│   ├── CustomerUpdateData.ts
│   └── CustomerDeleteData.ts
├── services/Customer/
│   ├── CustomerListService.ts
│   ├── CustomerGetService.ts
│   ├── CustomerCreateService.ts
│   ├── CustomerUpdateService.ts
│   └── CustomerDeleteService.ts
├── hooks/Customer/
│   ├── useCustomerListHook.ts
│   ├── useCustomerGetHook.ts
│   ├── useCustomerCreateHook.ts
│   ├── useCustomerUpdateHook.ts
│   ├── useCustomerDeleteHook.ts
│   └── useCustomerFormHook.ts
├── types/Customer/
│   ├── CustomerTypes.ts
│   ├── CustomerFilterTypes.ts
│   ├── CustomerTableTypes.ts
│   ├── CustomerFormTypes.ts
│   └── CustomerFormDialogTypes.ts
├── enum/Customer/
│   └── CustomerOriginEnum.ts
└── schemas/Customer/
    └── CustomerSchema.ts
```

### 2.3 Nomenclatura (frontend)

| Peça | Convenção | Exemplo |
| --- | --- | --- |
| Pastas de entidade | `PascalCase` | `Customer/` |
| Arquivos | `PascalCase` + papel | `CustomerCreateData.ts`, `useCustomerCreateHook.ts` |
| Tipagens | `types/<Entidade>/` | `CustomerFormTypes.ts` |
| Enums | `enum/<Entidade>/` | `CustomerOriginEnum.ts` |
| Operações | mesmas do REST | `List` `Get` `Create` `Update` `Delete` |
| Form vs FormDialog | `Form` = página; `FormDialog` = modal | não misturar |
| Query keys | `['customers', …]` | invalidar no `onSuccess` das mutations |

### 2.4 Fluxo e exemplos canônicos

```
Component → Hook (TanStack Query) → Service → Data → api-client → /api/v1
```

**Data** — único ponto com HTTP:

```ts
// data/Customer/CustomerListData.ts
import { apiClient } from '@/shared/api/api-client';
import type { CustomerListQuery, CustomerListResult } from '@repo/contracts';

export async function CustomerListData(query: CustomerListQuery): Promise<CustomerListResult> {
  return apiClient.request('/customers', { method: 'GET', query });
}
```

**Service** — thin; sem regra de negócio de servidor:

```ts
// services/Customer/CustomerListService.ts
import { CustomerListData } from '@/packages/operacional/data/Customer/CustomerListData';

export async function CustomerListService(query: CustomerListQuery) {
  return CustomerListData(query);
}
```

**Hook** — TanStack Query:

```ts
// hooks/Customer/useCustomerListHook.ts
export function useCustomerListHook(query: CustomerListQuery) {
  return useQuery({
    queryKey: ['customers', 'list', query],
    queryFn: () => CustomerListService(query),
    staleTime: 15_000,
  });
}

// hooks/Customer/useCustomerCreateHook.ts
export function useCustomerCreateHook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: CustomerCreateService,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customers'] }),
  });
}
```

### 2.5 Regras do frontend

1. **Rota é fina.** `page.tsx` só compõe; zero fetch na página.
2. **Package não importa de outro package.** Compartilhar → `shared/`.
3. **`shared/` só com 2+ consumidores reais.**
4. **Data é o único lugar que fala com a API** daquela ação.
5. **Service não chama `fetch` direto** — só Data.
6. **Hook não monta URL** — só Service + Query/Mutation.
7. **Componente não chama Data/Service** — só Hooks (e FormHook).
8. Tipos de request/response vêm de `contracts/`, não redigitados.

### 2.6 Agrupamento dos packages

| Package | Perfil | Entidades (exemplos) |
| --- | --- | --- |
| `operacional` | recepção / barbeiro | `Customer`, `Appointment`, `Staff`, `TimeBlock` |
| `financeiro` | dono / gerente | `Payment`, comissões, resumos |
| `admin` | dono | `Location`, `Service`, `Subscription`, usuários |
| `messaging` | dono | templates / status de notificação |
| `public` | cliente final | booking por slug |

---

## 3. O que é fixo e o que é negociável

**Fixo**

- 1 operação = 1 arquivo em `services/`, `repositories/` e (quando existir) `actions/`;
- classe curta sem prefixo da entidade;
- backend `snake_case` / frontend `PascalCase`;
- vocabulário `list|get|create|update|delete`;
- `actions/` só com efeito além do repositório;
- tipagens em `types/`; enums em `enum/` — **sem pasta `interfaces/`**;
- `models/` sem framework;
- cruzar módulo só por `<dominio>_public.ts`;
- Prisma só em `repositories/` e `shared/database/`;
- frontend: `Data → Service → Hook` + TanStack Query;
- package do frontend não importa outro package.

**Negociável** (PR + nota neste documento)

- subdividir `models/` por agregado em módulos grandes;
- juntar enums triviais em um único arquivo por módulo se forem poucos;
- novos packages no frontend conforme o produto cresce.

Módulos CRUD simples (tags, categorias) podem omitir `models/` ricos e `actions/` — bastam `schemas` + `services` + `repositories`. Cerimônia de domínio fica onde há invariante: agenda, clientes (unicidade de telefone), billing/subscription, isolamento multi-tenant.

## Referências

- [05 — Arquitetura](./05-arquitetura.md)
- [08 — API v1](./08-api-v1.md)
- [ADR-0001 — Monólito modular](./adr/0001-monolito-modular.md)
- [ADR-0004 — Prisma](./adr/0004-orm-prisma.md)
- Padrão de referência: prontuário odontológico + módulo Orius `Aluno` em `pdi-ioshua`
