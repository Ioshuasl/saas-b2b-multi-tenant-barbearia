# 12 — Qualidade e Testes

## 1. Estratégia

A arquitetura em camadas define onde cada teste vive. Testar regra de negócio via HTTP é lento e frágil; testar integração com mock de banco é ilusão. Cada camada tem seu tipo de teste:

```
        ╱╲          e2e (Playwright)            ~12 fluxos críticos
       ╱  ╲         contrato/API (Supertest)    ~1 por endpoint
      ╱────╲        integração (Testcontainers) repositórios, RLS, jobs, transações
     ╱      ╲       unidade (Vitest)            domain + application (a maior parte)
    ╱────────╲
```

| Camada | O que testar | Ferramenta | Dependências reais |
| --- | --- | --- | --- |
| `domain` | Invariantes, máquinas de estado, cálculos | Vitest | nenhuma (puro) |
| `application` | Orquestração de use case, erros, eventos emitidos | Vitest + fakes in-memory | nenhuma |
| `infrastructure` (repos) | Mapeamento, queries, constraints, RLS | Vitest + Testcontainers (Postgres) | Postgres real |
| `interface` (HTTP) | Contrato, validação, status, permissão | Supertest | app + Postgres real |
| Jobs | Idempotência, retry, contexto de tenant | Vitest + Redis real | Redis + Postgres |
| Fluxos | Jornadas de ponta a ponta | Playwright | stack completa |

## 2. Exemplos canônicos

### 2.1 Domínio (rápido, sem I/O)

```ts
describe('Appointment', () => {
  it('não permite confirmar agendamento cancelado', () => {
    const appointment = anAppointment({ status: 'SCHEDULED' });
    appointment.cancel('cliente desistiu');
    expect(() => appointment.confirm()).toThrow(InvalidStatusTransitionError);
  });

  it('emite AppointmentScheduled ao agendar', () => {
    const appointment = Appointment.schedule(id(), validProps());
    expect(appointment.pullEvents()).toEqual([
      expect.objectContaining({ name: 'scheduling.appointment_scheduled' }),
    ]);
  });
});

describe('TimeSlot', () => {
  it.each([
    ['08:00', '08:00', false],
    ['08:00', '07:00', false],
    ['08:00', '08:03', false],
    ['08:00', '08:30', true],
  ])('valida %s→%s = %s', (start, end, valid) => { /* ... */ });
});
```

### 2.2 Use case com fakes

```ts
it('rejeita agendamento em slot ocupado sem persistir nada', async () => {
  const repo = new InMemoryCreateRepository([anAppointment({ startsAt: '2026-08-20T14:00:00Z' })]);
  const service = new CreateService(/* AvailabilityCalculator + fakeUow */);

  await expect(service.execute(ctx, overlappingSchema())).rejects.toThrow(SlotTakenError);
  expect(repo.all()).toHaveLength(1);
  expect(fakeUow.publishedEvents).toHaveLength(0);
});
```

Fakes in-memory (não mocks de biblioteca) para repositórios.

### 2.3 Isolamento multi-tenant (banco real, obrigatório)

```ts
describe('RLS de clientes', () => {
  it('não retorna cliente de outro tenant', async () => {
    const a = await createTenantWithCustomer('Barbearia A');
    const b = await createTenantWithCustomer('Barbearia B');

    const found = await withTenant(b.tenantId, (tx) =>
      tx.customer.findUnique({ where: { id: a.customerId } }),
    );
    expect(found).toBeNull();
  });

  it('bloqueia INSERT com tenant_id divergente do contexto', async () => {
    await expect(
      withTenant(tenantB, (tx) => tx.customer.create({ data: { ...validCustomer(), tenantId: tenantA } })),
    ).rejects.toThrow(/row-level security/i);
  });

  it('falha sem contexto de tenant em vez de retornar tudo', async () => {
    const rows = await prismaWithoutContext.customer.findMany();
    expect(rows).toHaveLength(0);
  });

  it('todas as tabelas com tenant_id têm RLS habilitada', async () => {
    expect(await tablesMissingRls()).toEqual([]);
  });
});
```

### 2.4 Escopo de unidade (autorização, não RLS)

```ts
it('MANAGER da unidade X recebe 404 em recurso da unidade Y', async () => {
  const res = await asManagerOf(locationX).get(`/api/v1/appointments/${appointmentAtY}`);
  expect(res.status).toBe(404);
});
```

### 2.5 Constraint de double-booking (profissional em qualquer unidade)

```ts
it('impede o mesmo profissional no mesmo intervalo em duas unidades', async () => {
  const input = { staffId, startsAt: at('14:00'), endsAt: at('14:40') };
  const results = await Promise.allSettled([
    scheduleAt(locationA, input),
    scheduleAt(locationB, input),
  ]);

  expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
  expect(results.filter((r) => r.status === 'rejected')).toHaveLength(1);
});
```

50 requisições concorrentes no mesmo slot → exatamente 1 sucesso.

### 2.6 Comissão em centavos

```ts
it('comissão % × total COMPLETED soma em centavos sem float', () => {
  const totalCents = 10_000;
  const percent = 40;
  expect(commissionCents(totalCents, percent)).toBe(4_000);
});
```

### 2.7 Webhook / job idempotente

```ts
it('processa o mesmo provider_message_id apenas uma vez', async () => {
  const payload = deliveryWebhook({ providerMessageId: 'waha.ABC' });
  await Promise.all([handler.handle(payload), handler.handle(payload)]);
  expect(await countNotifications({ providerMessageId: 'waha.ABC' })).toBe(1);
});
```

### 2.8 Envelope

Campo cifrado no banco ≠ plaintext; decrypt sem contexto de tenant falha; AAD errado falha GCM; ciphertext/DEK nunca no logger fake.

### 2.9 E2E (Playwright) — fluxos obrigatórios

1. Signup → wizard → publicar → `/{tenant}` 200 (loja única, sem seletor).
2. Agendar na página pública (nome + telefone) → confirmação na tela.
3. Login STAFF → agenda do dia só com os próprios atendimentos → concluir + registrar pagamento.
4. Bloquear horário recorrente.
5. Relatório do período + export CSV.
6. MANAGER da unidade X não vê agenda da unidade Y.
7. Tenant A não acessa recurso do tenant B (404).
8. Trial expirado → `PAST_DUE`; página pública ainda no ar; operação estende `grace_until`.
9. `SUSPENDED` → página pública off; exportação ainda disponível.
10. Conexão WAHA: checkbox de ciência antes do QR (pode mockar o gateway).
11. WhatsApp “caiu”: ainda é possível agendar; UI avisa.
12. Exportação LGPD do tenant.

## 3. Dados de teste

- **Builders/fábricas** por agregado (`aCustomer()`, `anAppointment()`, `aLocation()`) com defaults válidos.
- Cada teste de integração em transação revertida ou banco por worker (Testcontainers).
- Seed local: **dois tenants, um deles com duas unidades**; dados sintéticos pt-BR. **Proibido** dado real fora de produção.

## 4. Metas de cobertura

| Escopo | Mínimo | Racional |
| --- | --- | --- |
| `models/` (domínio) | 85% (piso do doc 05; alvo 90%) | É onde está a regra |
| `services/` (aplicação) | 85% | Orquestração e erros |
| `repositories/`, `controllers/`, `jobs/` | 60% | Cobertos por integração |
| Frontend (hooks/utils) | 70% | Componentes visuais cobertos por e2e |
| Global | 80% | Guarda geral |

Cobertura é piso, não meta de vaidade.

## 5. Qualidade estática

| Ferramenta | Configuração |
| --- | --- |
| TypeScript | `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`; `any` proibido por lint |
| ESLint | `@typescript-eslint`, `import/order`, `eslint-plugin-boundaries`, `no-floating-promises`, `no-console` |
| Prettier | Formatação única |
| dependency-cruiser | Clean Architecture e fronteira entre módulos |
| Commitlint + Husky | Conventional Commits; lint/typecheck no `pre-commit` |
| gitleaks | Bloqueia segredo no commit |

Regras de lint (espelho do [doc 16](./16-estrutura-de-pastas.md)):

```js
'boundaries/element-types': ['error', { default: 'disallow', rules: [
  { from: 'models',       allow: ['models', 'enum', 'types'] },
  { from: 'services',     allow: ['models', 'services', 'actions', 'types', 'enum', 'repositories'] },
  { from: 'actions',      allow: ['models', 'actions', 'types', 'enum', 'repositories'] },
  { from: 'controllers',  allow: ['models', 'services', 'schemas', 'types', 'enum'] },
  { from: 'repositories', allow: ['models', 'types', 'enum', 'repositories'] },
]}],
```

## 6. Testes não funcionais

| Tipo | Como | Critério |
| --- | --- | --- |
| Carga | k6 na grade de horários e agenda | p95 availability < 500 ms; demais APIs < 300 ms |
| Concorrência | 50 requisições no mesmo slot | Exatamente 1 sucesso |
| Segurança | OWASP ASVS nível 1; ZAP baseline no CI | Zero achado alto |
| Acessibilidade | axe-core no Playwright nas telas principais | Zero violação crítica |
| Resiliência | Derrubar Redis/WAHA em staging | App continua agendando; e-mail cobre; mensagens na fila |
| Migração | Rodar migrações contra dump de staging | Sem downtime e sem perda |

## 7. Definition of Done (por história)

- [ ] Critérios de aceite atendidos e demonstráveis
- [ ] Testes: unidade (domínio/use case) + integração quando toca banco + e2e se é fluxo crítico
- [ ] `pnpm lint`, `pnpm typecheck`, `pnpm arch:check`, `pnpm test` verdes
- [ ] Migração incluída e compatível para frente
- [ ] RLS verificada para tabelas novas
- [ ] Permissões por papel **e** unidade testadas
- [ ] Auditoria emitida para ação sensível
- [ ] OpenAPI atualizado automaticamente
- [ ] Log/métrica relevante; redaction de PII
- [ ] Texto de UI em pt-BR
- [ ] `docs/` ou ADR se houve decisão nova
- [ ] Revisado por outra pessoa em PR

## 8. Processo de revisão de código

Foco, em ordem: **corretude do domínio** → **isolamento de tenant** → **escopo de unidade** → **segurança/permissão** → **testes** → **legibilidade** → estilo (automatizado).

Perguntas obrigatórias:

1. Essa regra está no domínio ou vazou para controller/repositório?
2. Toda query respeita o contexto de tenant?
3. Recurso de outra unidade do mesmo tenant está protegido?
4. O que acontece se esse job rodar duas vezes?
5. Um usuário do papel errado consegue chamar isso?
6. Isso quebra contrato de API existente?

## Referências

- [05 — Arquitetura](./05-arquitetura.md)
- [06 — Multi-tenancy](./06-multi-tenancy.md)
- [09 — Frontend](./09-frontend.md)
- [17 — Segurança baseline](./17-seguranca-baseline.md)
- [RNF](./requisitos/nao-funcionais/requisitos-nao-funcionais.md)
