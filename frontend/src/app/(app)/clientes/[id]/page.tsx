import { CustomerDetails } from '@/packages/operacional/components/Customer/CustomerDetails';

export default async function ClienteFichaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerDetails customerId={id} />;
}
