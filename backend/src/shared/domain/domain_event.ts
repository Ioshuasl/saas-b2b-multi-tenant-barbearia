/** Evento de domínio genérico (kernel). Payload só com IDs / metadados. */
export type DomainEvent = {
  name: string;
  payload: Record<string, unknown>;
  occurredAt?: Date;
};
