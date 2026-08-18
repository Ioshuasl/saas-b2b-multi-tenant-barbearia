import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { getTenantPrisma } from '../../../../shared/database/tenant_prisma.js';

export type NotificationContext = {
  appointmentId: string;
  locationId: string;
  customerId: string;
  startsAt: Date;
  endsAt: Date;
  status: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  marketingOptIn: boolean;
  locationName: string;
  locationTimezone: string;
  tenantSlug: string;
  locationSlug: string;
  sessionName: string | null;
  sessionStatus: string | null;
  killSwitch: boolean;
};

export class GetContextRepository {
  constructor(private readonly db = getTenantPrisma()) {}

  async execute(ctx: RequestContext, appointmentId: string): Promise<NotificationContext | null> {
    return this.db.runInTenantContext(ctx, async (tx) => {
      const appointment = await tx.appointment.findFirst({
        where: { id: appointmentId },
        include: {
          customer: true,
          location: true,
          tenant: { select: { slug: true } },
        },
      });
      if (!appointment) return null;

      const account = await tx.whatsappAccount.findUnique({
        where: { tenantId: ctx.tenantId },
      });

      return {
        appointmentId: appointment.id,
        locationId: appointment.locationId,
        customerId: appointment.customerId,
        startsAt: appointment.startsAt,
        endsAt: appointment.endsAt,
        status: appointment.status,
        customerName: appointment.customer.name,
        customerPhone: appointment.customer.phone,
        customerEmail: appointment.customer.email,
        marketingOptIn: appointment.customer.marketingOptIn,
        locationName: appointment.location.name,
        locationTimezone: appointment.location.timezone,
        tenantSlug: appointment.tenant.slug,
        locationSlug: appointment.location.slug,
        sessionName: account?.sessionName ?? null,
        sessionStatus: account?.status ?? null,
        killSwitch: account?.killSwitch ?? false,
      };
    });
  }
}
