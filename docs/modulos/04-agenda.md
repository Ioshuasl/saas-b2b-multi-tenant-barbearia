# Módulo — Agenda (`scheduling`)

## 1. Responsabilidade

Marcar, mover, confirmar e encerrar atendimentos, garantindo que **nenhum profissional seja duplo-agendado** (inclusive entre unidades) e que a grade pública seja verdadeira. Se a agenda falha, a barbearia volta para o WhatsApp no primeiro dia.

## 2. Agregado `Appointment`

```ts
interface AppointmentProps {
  tenantId: TenantId; locationId: EntityId;
  customerId: EntityId; staffId: EntityId;
  slot: TimeSlot;                    // [startsAt, endsAt)
  status: AppointmentStatus;
  source: 'PUBLIC_PAGE' | 'PANEL' | 'PHONE' | 'WALKIN';
  totalPriceCents: number;           // soma dos snapshots
  notes?: string;                    // envelope
  cancelTokenHash?: string;
}
```

### Máquina de estados

```
SCHEDULED ──► CONFIRMED ──► IN_SERVICE ──► COMPLETED
    │              │              │
    └──────────────┴──────────────┴──► CANCELLED
                   └──────────────┴──► NO_SHOW
```

1. Transição fora do mapa → `409 INVALID_STATE_TRANSITION`.
2. `CANCELLED` exige motivo; `NO_SHOW` só após `starts_at`; `COMPLETED` só a partir de `IN_SERVICE`.
3. Terminais (`COMPLETED`, `CANCELLED`) não voltam; correção = novo agendamento.
4. `ends_at` e preço são calculados no servidor a partir de `appointment_services` (snapshot). Cliente **não** envia `endsAt`.

## 3. Double-booking — três camadas

**UI:** só slots de `GET /availability`.

**Domínio:** use case recalcula na transação (jornada, bloqueios, appointments ativos do staff em **todas** as unidades, lead time, horizonte 60 dias, não passado).

**Banco:** `EXCLUDE USING gist (tenant_id, staff_id, period)` — **sem** `location_id`. `23P01` → `409 SLOT_TAKEN`. 50 POSTs concorrentes no mesmo slot → 1 sucesso.

## 4. Disponibilidade

```ts
export class AvailabilityCalculator {
  async slotsFor(input: {
    locationId: EntityId; staffId?: EntityId; date: string; durationMinutes: number;
  }) {
    const windows = await this.locations.getWorkingWindows(input);
    const blocks  = await this.blocks.findByDate(input);
    const booked  = await this.appointments.findActiveByStaffAcrossLocations(input);
    return split(windows, durationMinutes).filter(freeAgainst(blocks, booked));
  }
}
```

`staffId` omitido na pública = união dos profissionais da unidade que executam o serviço (`staff_services` vazio = todos).

## 5. Público

- Sem login, sem OTP.
- Token de cancelamento/remarcação: hash no banco, comparação constante, prazo `cancel_deadline_hours`.
- Rate limit IP + unidade; captcha progressivo; máx. 3 futuros por telefone.
- Consentimento de tratamento obrigatório; marketing separado.

## 6. Eventos

`scheduling.appointment_scheduled` | `rescheduled` | `cancelled` | `completed` | `no_show` — outbox na mesma TX. Messaging cancela/reagenda lembretes. Billing registra pagamento no `COMPLETED` (não cria pagamento sozinho).

## 7. Casos de uso

`CreateService`, `RescheduleService`, `ChangeStatusService`, `CancelService`, `PublicBookService`, `PublicCancelService`, `AvailabilityService`.
