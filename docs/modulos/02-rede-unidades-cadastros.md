# Módulo — Rede, Unidades e Cadastros (`locations`)

## 1. Responsabilidade

Configuração estrutural da barbearia: tenant, unidades, horários, bloqueios, catálogo de serviços e profissionais. Define **o que se oferece, onde e quando** — insumo da agenda.

Timezone é **por unidade** (rede pode cruzar fusos). Banco em UTC; conversão na borda.

## 2. Agregados e invariantes

| Agregado | Invariantes |
| --- | --- |
| `Tenant` | `slug` único global; palavras reservadas (`admin`, `api`, `app`…) bloqueadas |
| `Location` | Exatamente uma `is_default`; slug único por tenant; timezone IANA |
| `Service` | Duração 5–480 min; `price_cents ≥ 0`; catálogo da **rede** |
| `LocationService` | Override opcional de preço/duração; sem linha = herda o tenant |
| `Staff` | Unidade base obrigatória; `user_id` opcional; comissão 0–100 |
| `StaffLocation` | Profissional pode atender em N unidades |
| `BusinessHours` | `ends_at > starts_at`; weekday ISO 1–7; `staff_id` null = unidade |
| `TimeBlock` | Pontual ou RRULE; `staff_id` null = feriado da unidade |

## 3. Regras

1. **Seletor oculto** enquanto houver uma unidade ativa — critério de aceite da loja única.
2. **Horário em cascata:** disponibilidade = horário da unidade ∩ jornada do staff naquela unidade; bloqueios subtraem. Staff sem jornada própria herda a unidade.
3. **Preço/duração snapshot** no agendamento; alterar o catálogo não retroage.
4. **Inativar, não apagar** serviço/staff com histórico.
5. **Slug antigo** em `*_slug_history` redireciona 30 dias.
6. Criar unidade ou staff ativo acima do plano → `402 PLAN_LIMIT_EXCEEDED` (consulta `subscription` via port).
7. Bloqueio sobre agenda existente **lista conflitos** e exige confirmação; não cancela sozinho.

## 4. Seed de serviços (signup)

| Código | Nome | Min (sugestão) |
| --- | --- | --- |
| `CORTE` | Corte | 40 |
| `BARBA` | Barba | 20 |
| `CORTE_BARBA` | Corte + barba | 50 |

Preço zero no seed — a barbearia define. Horário padrão da unidade: seg–sáb 09:00–19:00.

## 5. Casos de uso

| Use case | Notas |
| --- | --- |
| `UpdateTenantService` | Slug com redirect; audita |
| `CreateLocationService` | Limite do plano; horários padrão; primeira extra confirma valor informado pela operação |
| `SetBusinessHoursService` | Substituição atômica; alerta agenda futura fora da nova grade |
| `CreateTimeBlockService` | Devolve `conflicts[]` |
| `CreateServiceService` / `UpdateServiceService` | Não retroage snapshot |
| `UpsertLocationServiceService` | Ativa/desativa e override na unidade |
| `CreateStaffService` | `staff_locations`; convite opcional |
| `DeactivateStaffService` | Bloqueia exclusão física |

## 6. API pública do módulo

```ts
export interface LocationsModuleApi {
  getTenantPublic(slug: string): Promise<{ id: EntityId; name: string; locations: LocationPublic[] } | null>;
  getWorkingWindows(input: {
    tenantId: TenantId; locationId: EntityId; staffId?: EntityId; date: string;
  }): Promise<Array<{ startsAt: Date; endsAt: Date }>>;
  getServiceSnapshot(tenantId: TenantId, locationId: EntityId, serviceId: EntityId): Promise<{
    durationMinutes: number; priceCents: number;
  }>;
  staffServesLocation(staffId: EntityId, locationId: EntityId): Promise<boolean>;
}
```

`scheduling` usa `getWorkingWindows` — a regra de horário mora aqui.
