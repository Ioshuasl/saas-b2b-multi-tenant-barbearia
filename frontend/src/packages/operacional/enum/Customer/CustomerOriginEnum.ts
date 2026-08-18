import type { CustomerOriginName } from '@repo/contracts';

export {
  CUSTOMER_ORIGINS,
  CustomerOrigin,
  type CustomerOriginName,
} from '@repo/contracts';

export const CUSTOMER_ORIGIN_LABELS: Record<CustomerOriginName, string> = {
  PUBLIC_PAGE: 'Página pública',
  PANEL: 'Painel',
  PHONE: 'Telefone',
  WALKIN: 'Presencial',
};
