import type { CustomerOriginName } from '../enum/customer/customer_origin.enum.js';

export type CustomerProps = {
  id: string;
  tenantId: string;
  firstLocationId: string;
  name: string;
  phone: string;
  email: string | null;
  notes: string | null;
  birthdate: Date | null;
  marketingOptIn: boolean;
  origin: CustomerOriginName;
  active: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class Customer {
  constructor(readonly props: CustomerProps) {}

  get isActive(): boolean {
    return this.props.active && this.props.deletedAt === null;
  }

  assertCanUpdate(): void {
    if (!this.isActive) {
      throw new Error('Cliente inativo.');
    }
  }
}
