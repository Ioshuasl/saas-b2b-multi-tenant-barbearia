# Módulo — Clientes (`customers`)

## 1. Responsabilidade

Cadastro do **cliente final** da rede: identidade por telefone E.164, ficha, observações administrativas e histórico de atendimentos (com a unidade de cada um).

Não é usuário pago. Não há CPF no MVP. Notas **não** são prontuário clínico — texto livre cifrado (envelope).

## 2. Agregados

| Agregado | Invariantes |
| --- | --- |
| `Customer` | UNIQUE `(tenant_id, phone)` ativo; nome + telefone obrigatórios; `first_location_id` imutável após create |
| Consentimento | `marketing_opt_in` separado do tratamento operacional |

Mesmo telefone em **tenants** diferentes = pessoas distintas (a base é da barbearia).

## 3. Regras

1. Primeira reserva (pública ou painel) **cria** o cliente se o telefone não existir.
2. Base **única na rede**: agendar na unidade B reusa o cadastro da unidade A; o histórico lista `location_id`.
3. Telefone validado/normalizado na borda (Zod) para E.164.
4. E-mail opcional.
5. Exclusão = inativação/anonimização LGPD (`anonymize`): nome genérico, telefone/e-mail null, agenda preservada.
6. Página pública não lista outros clientes nem expõe PII alheia.
7. Aviso: dados ficam com a **rede** (controladora).

## 4. Casos de uso

| Use case | Notas |
| --- | --- |
| `CreateService` / `UpsertByPhoneService` | Idempotente por telefone; usado pelo booking público |
| `ListService` | `pg_trgm` no nome + índice no telefone |
| `GetService` | Histórico via `scheduling_public` + total gasto via `billing_public` |
| `UpdateService` | Não troca telefone para um já existente |
| `AnonymizeService` | Só via fluxo LGPD / `OWNER`; audita |

## 5. API pública do módulo

```ts
export interface CustomersModuleApi {
  getOrCreateByPhone(ctx: RequestContext, input: {
    phone: E164; name: string; email?: string; locationId: EntityId; origin: CustomerOrigin;
  }): Promise<{ id: EntityId; created: boolean }>;
  getSummary(ctx: RequestContext, customerId: EntityId): Promise<{ name: string; phone: E164 } | null>;
}
```
