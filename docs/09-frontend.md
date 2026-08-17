# 09 — Frontend (Next.js + React + TypeScript)

## 1. Decisões

| Tema | Escolha | Racional |
| --- | --- | --- |
| Framework | Next.js (App Router) | SSR para páginas públicas (SEO do link de agendamento) e RSC para telas de leitura |
| Linguagem | TypeScript `strict`, componentes `.tsx` | Requisito |
| Estilo | Tailwind CSS + design system próprio em `shared/ui` | Velocidade e consistência; evita CSS-in-JS em RSC |
| Componentes base | Radix UI primitives (acessibilidade) encapsulados no nosso DS | Acessibilidade correta sem reinventar |
| Estado servidor | TanStack Query | Cache, revalidação, mutação otimista (essencial na agenda) |
| Estado cliente | Zustand para UI local (filtros, unidade ativa, painéis) | Leve; sem Redux |
| Formulários | React Hook Form + Zod (schemas de `contracts/`) | Mesma validação do backend |
| Tabelas | TanStack Table | Virtualização e coluna dinâmica |
| Datas | `date-fns` + `date-fns-tz` (timezone **da unidade**) | Agenda e rede que cruza fusos |
| Gráficos | Recharts | Suficiente para dashboards do MVP |
| Testes | Vitest + Testing Library; Playwright para e2e | — |
| Autenticação | Access token em memória + refresh em cookie httpOnly | Evita XSS-token em `localStorage` |
| Realtime | Polling ≤ 30 s aceitável no MVP (US-03); SSE (`/api/v1/stream`) na agenda se couber | WebSocket só se necessário |

**Regra:** o frontend não reimplementa regra de negócio. Ele valida para UX (feedback imediato) usando o mesmo schema Zod, mas a verdade e a autorização são sempre do servidor.

## 2. Estrutura de pastas

Mantém o padrão Orius do time (`packages/<área>` + camadas `components/data/services/hooks/types/enum/schemas` por entidade). Cada `page.tsx` é fino e só compõe o que vem de `packages/`. Racional completo e exemplo `Customer` em [16 — Estrutura de Pastas](./16-estrutura-de-pastas.md).

```
frontend/src/
├── app/                                 # ROTAS (App Router)
│   ├── (public)/                        # login, signup, /{tenant}, /{tenant}/{location}
│   ├── (app)/                           # área autenticada
│   │   ├── layout.tsx                   # seletor de unidade (oculto se 1)
│   │   ├── page.tsx                     # dashboard / agenda do dia
│   │   ├── agenda/page.tsx
│   │   ├── clientes/
│   │   │   └── page.tsx                 # compõe CustomerIndex
│   │   ├── financeiro/…
│   │   ├── relatorios/
│   │   └── configuracoes/               # unidades, serviços, staff, billing
│   ├── layout.tsx
│   └── error.tsx / not-found.tsx
├── packages/
│   ├── operacional/                     # Customer, Appointment, Staff, TimeBlock
│   ├── financeiro/                      # Payment, comissões
│   ├── admin/                           # Location, Service, Subscription, usuários
│   ├── messaging/                       # status de envio / conexão WAHA (QR)
│   └── public/                          # booking por slug
├── shared/
│   ├── ui/
│   ├── layout/
│   ├── api/
│   │   ├── api-client.ts
│   │   └── query-client.ts
│   ├── hooks/
│   ├── auth/
│   ├── helpers/
│   └── styles/
```

> Não há package `clinico` — domínio da barbearia não tem prontuário.

Fluxo obrigatório por ação: **`Data → Service → Hook` (+ TanStack Query no hook)**.

Regras de organização:

1. **Rota é fina.** `page.tsx` cuida de parâmetros, metadata e composição. Zero fetch na página.
2. **Data** é o único lugar que chama a API daquela ação.
3. **Service** só chama Data (thin wrapper; sem montar URL).
4. **Hook** usa TanStack Query (`useQuery`/`useMutation`) e chama Service.
5. **Componente** só usa Hooks (e FormHook) — nunca Data/Service direto.
6. **Um package não importa de outro package.** Compartilhar → `shared/`.
7. **`shared/` só com 2+ consumidores reais.**
8. Arquivos frontend em **PascalCase** (`CustomerCreateData.ts`); operações alinhadas ao REST: `List` / `Get` / `Create` / `Update` / `Delete`.
9. Tipagens em `types/`; enums em `enum/` — **sem pasta `interfaces/`**.
10. `Form` = página; `FormDialog` = modal — não misturar.
11. **Seletor de unidade** some quando há só uma unidade ativa (RF-E2-02).

## 3. Cliente de API tipado

```ts
// shared/api/api-client.ts
import type { ApiError, ApiResponse } from '@repo/contracts';

class ApiClient {
  private accessToken: string | null = null;
  private refreshing: Promise<void> | null = null;
  private locationId: string | null = null; // unidade ativa; nunca tenant_id

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(this.accessToken ? { Authorization: `Bearer ${this.accessToken}` } : {}),
        ...(this.locationId ? { 'X-Location-Id': this.locationId } : {}),
        ...init.headers,
      },
    });

    if (res.status === 401 && !path.startsWith('/auth/refresh')) {
      await (this.refreshing ??= this.refresh().finally(() => (this.refreshing = null)));
      return this.request<T>(path, init);
    }

    const payload = (await res.json()) as ApiResponse<T> | ApiError;
    if (!res.ok) throw new ApiRequestError(payload as ApiError, res.status);
    return (payload as ApiResponse<T>).data;
  }
}
```

`tenant_id` **não** vai em header/body — vem do JWT. `X-Location-Id` é conveniência, sempre revalidada no servidor contra `user_locations`.

Erros são convertidos em `ApiRequestError` com `code` estável; um `ErrorBoundary` + `toast` traduz `code` em mensagem pt-BR (ex.: `SLOT_TAKEN` → “Este horário acabou de ser reservado”).

## 4. Telas críticas — requisitos de UX

### 4.1 Agenda (a tela mais usada)

- Grade de colunas por profissional da **unidade selecionada**, linhas de 10/15/30 min.
- Cores por status **com ícone + texto** (nunca só cor): Agendado, Confirmado, Em atendimento, Concluído, No-show, Cancelado.
- Interações: clicar em slot livre → `AppointmentFormDialog`; arrastar para remarcar; clique → ações rápidas (status, registrar pagamento).
- **Mutação otimista** em drag & drop, com rollback e toast em `409 SLOT_TAKEN`.
- `STAFF` vê só a própria coluna / próprios atendimentos.
- Atalhos: `n` novo, `←/→` dia, `t` hoje, `/` busca, `Esc` fecha.
- Desempenho: virtualização; alvo de 60 fps com o dia cheio.
- Mobile-first para o barbeiro: login cai na agenda do dia.

### 4.2 Página pública de agendamento

- SSR leve (LCP < 2,5 s em 4G), mobile-first, nome/logo da unidade.
- `/{tenant}`: 1 unidade → redirect; várias → seletor (nome, endereço, distância).
- `/{tenant}/{location}`: serviço → profissional ou “qualquer um” → horário → nome + telefone → confirmação. **≤ 4 telas.** Sem login, sem OTP no MVP.
- Consentimento LGPD explícito: dados ficam com a **rede**.
- Sem serviço ativo: “agendamento indisponível”, não erro 500.
- Bundle **sem** código do painel.

### 4.3 Onboarding (wizard)

- 4 passos: horário → serviços (pré-carregados) → profissionais → publicar (link + QR).
- Meta ≤ 10 min; loja única **não** vê UI de rede.

### 4.4 Clientes e relatórios

- Lista com busca por nome/telefone; ficha com histórico (unidade de cada atendimento) e total gasto.
- Relatório: período, profissional, unidade ou consolidado (`OWNER`); export CSV.

### 4.5 Conexão WhatsApp (não inbox)

- Tela de configuração: checkbox de ciência → QR / pairing code → status `CONNECTED` / desconectado.
- Banner global se a sessão cair; o barbeiro continua agendando.
- Inbox bidirecional rica fica **fora do MVP** (RF-E6-16).

### 4.6 Billing (OWNER)

- Status do plano, uso (profissionais/unidades), dias de trial.
- Sem checkout. CTA: “Fale conosco para ativar” após o trial.

## 5. Padrões de implementação

### Data → Service → Hook (Customer)

```ts
// data/Customer/CustomerListData.ts
export async function CustomerListData(query: CustomerListQuery) {
  return apiClient.request('/customers', { method: 'GET', query });
}

// services/Customer/CustomerListService.ts
export async function CustomerListService(query: CustomerListQuery) {
  return CustomerListData(query);
}

// hooks/Customer/useCustomerListHook.ts
export function useCustomerListHook(query: CustomerListQuery) {
  return useQuery({
    queryKey: ['customers', 'list', query],
    queryFn: () => CustomerListService(query),
    staleTime: 15_000,
    refetchOnWindowFocus: true,
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

Agenda (mutação otimista) segue o mesmo padrão — `AppointmentUpdateData` / `useAppointmentUpdateHook`, com `onMutate` / rollback no hook.

### Permissões na UI

```tsx
<Can permission="appointments.write" fallback={null}>
  <Button onClick={openCreate}>Novo horário</Button>
</Can>
```

Esconder na UI é **conveniência**, nunca segurança — o servidor sempre reavalia (papel + unidade + `staff_id`).

### Server Components vs Client Components

- RSC (padrão): páginas públicas, listagens, relatórios, layouts.
- Client Components: agenda, wizard, formulários — tudo que é interativo.
- Nunca passar token do usuário para RSC via props; chamadas autenticadas usam o cookie.

## 6. Design system (`shared/ui`)

Componentes previstos no MVP: `Button`, `Input`, `Select`, `Combobox`, `DatePicker`, `TimePicker`, `Modal`, `Drawer`, `Tabs`, `Table`, `Badge`, `StatusPill`, `Avatar`, `Tooltip`, `Toast`, `EmptyState`, `Skeleton`, `MoneyInput`, `PhoneInput`, `AgendaGrid`, `LocationSwitcher`, `QrCode`.

Tokens: cores (paleta semântica de status da agenda), espaçamento 4px-base, tipografia, raio, sombra, z-index. Tema claro no MVP; escuro na fase 2 (tokens já preparados). Design system visual definitivo do SaaS será definido depois; até lá, tokens Orius provisórios.

## 7. Acessibilidade e i18n

- Navegação por teclado na agenda; foco visível; `aria-live` em toasts.
- Contraste mínimo AA; status nunca comunicado **só** por cor (ícone + texto).
- Textos em `pt-BR` centralizados em arquivo de mensagens; `Intl.NumberFormat` / `Intl.DateTimeFormat`.
- Timezone **da unidade** na renderização; nunca `new Date()` sem fuso explícito em cálculo de agenda.

## 8. Performance

| Meta | Como |
| --- | --- |
| LCP < 2,5 s nas páginas públicas | RSC + imagens otimizadas + CSS crítico |
| TTI < 3 s na agenda | Code splitting por rota, virtualização |
| Bundle da página pública mínimo | Sem código do painel |
| Bundle autenticado < 250 KB gzip | Import dinâmico de gráficos |
| Sem layout shift | Skeletons com dimensões fixas |

## 9. Tratamento de erros e estados vazios

- Todo estado de lista: carregando (skeleton), vazio (com CTA), erro (retry), sem permissão.
- Erros de rede: toast com retry; agenda mostra tarja se o polling falhar.
- Nunca exibir mensagem técnica bruta; `requestId` em “detalhes” para suporte.

## Referências

- [16 — Estrutura de pastas](./16-estrutura-de-pastas.md)
- [12 — Qualidade e testes](./12-qualidade-testes.md)
- [15 — Glossário](./15-glossario.md)
- [ADR-0010 — Billing manual](./adr/0010-billing-saas-manual-mvp.md)
- [ADR-0016 — WAHA GOWS](./adr/0016-waha-default-messaging.md)
