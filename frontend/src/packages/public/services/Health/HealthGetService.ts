import { HealthGetData } from '@/packages/public/data/Health/HealthGetData';

export async function HealthGetService() {
  return HealthGetData();
}
