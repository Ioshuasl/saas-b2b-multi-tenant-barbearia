import Link from 'next/link';
import { formatBRL } from '@/shared/helpers/Money';
import { formatDateTimeInTimezone } from '@/packages/public/helpers/PublicBookingTime';
import { Card } from '@/shared/ui/Ui';
import type { PublicBookingConfirmProps } from '@/packages/public/types/PublicAppointment/PublicAppointmentTypes';

export function PublicBookingConfirm({
  tenantSlug,
  locationSlug,
  timezone,
  appointment,
}: PublicBookingConfirmProps) {
  const manageHref = `/${tenantSlug}/${locationSlug}/agendamento/${appointment.id}?token=${encodeURIComponent(appointment.cancelToken)}`;

  return (
    <section className="mt-6 flex flex-col gap-3">
      <h2 className="text-lg font-medium">Horário confirmado</h2>
      <Card>
        <p className="font-medium">{formatDateTimeInTimezone(appointment.startsAt, timezone)}</p>
        <p className="mt-2 text-sm opacity-80">
          {appointment.services.map((service) => service.name).join(', ')}
        </p>
        <p className="mt-1 text-sm opacity-80">{appointment.staff.name}</p>
        <p className="mt-2 font-medium">{formatBRL(appointment.totalPriceCents)}</p>
      </Card>
      <p className="text-sm opacity-80">
        Guarde o link para cancelar ou remarcar. Ele vale nesta aba e no endereço abaixo.
      </p>
      <Link href={manageHref} className="text-sm underline">
        Ver, remarcar ou cancelar
      </Link>
    </section>
  );
}
