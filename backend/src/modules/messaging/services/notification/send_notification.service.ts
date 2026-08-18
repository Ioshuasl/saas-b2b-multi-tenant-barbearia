import type { RequestContext } from '../../../../shared/domain/request_context.js';
import { env } from '../../../../shared/config/env.js';
import { logger } from '../../../../shared/config/logger.js';
import {
  MessagingChannel,
  MessagingSessionStatus,
  NotificationStatus,
} from '../../enum/account/messaging_session_status.enum.js';
import { MessageTemplateKey } from '../../enum/account/messaging_session_status.enum.js';
import {
  buildCancelLink,
  buildTemplateVariables,
  renderTemplate,
} from '../../helpers/template_render.js';
import type { MessagingProvider } from '../../types/ports/messaging_provider.port.js';
import type { EmailProvider } from '../../types/ports/email_provider.port.js';
import type { GetContextRepository } from '../../repositories/notification/notification_context_get.repository.js';
import type { GetTemplateRepository } from '../../repositories/template/template_get.repository.js';
import type { CreateRepository as NotificationCreateRepository } from '../../repositories/notification/notification_create.repository.js';
import type { UpdateStatusRepository as NotificationUpdateRepository } from '../../repositories/notification/notification_update.repository.js';

export type SendNotificationInput = {
  appointmentId: string;
  templateKey: string;
  notifyCustomer?: boolean;
  cancelLink?: string;
  cancelToken?: string;
};

export class SendNotificationService {
  constructor(
    private readonly contextGet: GetContextRepository,
    private readonly templateGet: GetTemplateRepository,
    private readonly notificationCreate: NotificationCreateRepository,
    private readonly notificationUpdate: NotificationUpdateRepository,
    private readonly messagingProvider: MessagingProvider,
    private readonly emailProvider: EmailProvider,
  ) {}

  async execute(ctx: RequestContext, input: SendNotificationInput): Promise<void> {
    if (input.notifyCustomer === false) {
      logger.info({ appointmentId: input.appointmentId }, 'notification_skipped_notify_false');
      return;
    }

    const context = await this.contextGet.execute(ctx, input.appointmentId);
    if (!context) {
      logger.warn({ appointmentId: input.appointmentId }, 'notification_context_missing');
      return;
    }

    if (input.templateKey.startsWith('reminder_') && context.status === 'CANCELLED') {
      logger.info({ appointmentId: input.appointmentId }, 'notification_skipped_cancelled');
      return;
    }

    const template = await this.templateGet.execute(ctx, input.templateKey);
    if (!template) {
      throw new Error(`Template ${input.templateKey} não encontrado.`);
    }

    if (template.category === 'MARKETING' && !context.marketingOptIn) {
      await this.notificationCreate.execute(ctx, {
        locationId: context.locationId,
        appointmentId: context.appointmentId,
        customerId: context.customerId,
        channel: MessagingChannel.WHATSAPP,
        provider: env.MESSAGING_PROVIDER,
        templateKey: input.templateKey,
        recipient: context.customerPhone,
        status: NotificationStatus.FAILED,
        error: 'BLOCKED_NO_CONSENT',
      });
      return;
    }

    const cancelLink = buildCancelLink({
      appPublicUrl: env.APP_PUBLIC_URL,
      tenantSlug: context.tenantSlug,
      locationSlug: context.locationSlug,
      cancelLink:
        input.cancelLink ??
        (input.cancelToken
          ? `${env.APP_PUBLIC_URL.replace(/\/$/, '')}/public/${context.tenantSlug}/${context.locationSlug}/appointments/${context.appointmentId}?token=${input.cancelToken}`
          : undefined),
    });

    const body = renderTemplate(
      template.body,
      buildTemplateVariables({
        customerName: context.customerName,
        locationName: context.locationName,
        startsAt: context.startsAt.toISOString(),
        timezone: context.locationTimezone,
        cancelLink,
      }),
    );

    const canWhatsApp =
      !context.killSwitch &&
      context.sessionStatus === MessagingSessionStatus.CONNECTED &&
      context.sessionName;

    if (canWhatsApp && context.sessionName) {
      const notificationId = await this.notificationCreate.execute(ctx, {
        locationId: context.locationId,
        appointmentId: context.appointmentId,
        customerId: context.customerId,
        channel: MessagingChannel.WHATSAPP,
        provider: env.MESSAGING_PROVIDER,
        templateKey: input.templateKey,
        recipient: context.customerPhone,
        status: NotificationStatus.PENDING,
      });

      try {
        const result = await this.messagingProvider.sendText({
          sessionName: context.sessionName,
          toE164: context.customerPhone,
          body,
        });
        await this.notificationUpdate.execute(ctx, notificationId, {
          status: NotificationStatus.SENT,
          providerMessageId: result.providerMessageId,
          sentAt: new Date(),
        });
        return;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        await this.notificationUpdate.execute(ctx, notificationId, {
          status: NotificationStatus.FAILED,
          error: message,
        });
        logger.warn({ appointmentId: input.appointmentId, message }, 'whatsapp_send_failed_fallback_email');
      }
    }

    if (!context.customerEmail) {
      await this.notificationCreate.execute(ctx, {
        locationId: context.locationId,
        appointmentId: context.appointmentId,
        customerId: context.customerId,
        channel: MessagingChannel.EMAIL,
        provider: env.RESEND_API_KEY ? 'resend' : 'smtp',
        templateKey: input.templateKey,
        recipient: context.customerPhone,
        status: NotificationStatus.FAILED,
        error: 'NO_EMAIL_FALLBACK',
      });
      return;
    }

    const emailNotificationId = await this.notificationCreate.execute(ctx, {
      locationId: context.locationId,
      appointmentId: context.appointmentId,
      customerId: context.customerId,
      channel: MessagingChannel.EMAIL,
      provider: env.RESEND_API_KEY ? 'resend' : 'smtp',
      templateKey: input.templateKey,
      recipient: context.customerEmail,
      status: NotificationStatus.PENDING,
    });

    try {
      await this.emailProvider.send({
        to: context.customerEmail,
        subject: subjectForTemplate(input.templateKey, context.locationName),
        text: body,
      });
      await this.notificationUpdate.execute(ctx, emailNotificationId, {
        status: NotificationStatus.SENT,
        sentAt: new Date(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      await this.notificationUpdate.execute(ctx, emailNotificationId, {
        status: NotificationStatus.FAILED,
        error: message,
      });
      throw err;
    }
  }
}

function subjectForTemplate(templateKey: string, locationName: string): string {
  switch (templateKey) {
    case MessageTemplateKey.APPOINTMENT_CONFIRMATION:
      return `Confirmação de horário — ${locationName}`;
    case MessageTemplateKey.REMINDER_24H:
      return `Lembrete: horário amanhã — ${locationName}`;
    case MessageTemplateKey.REMINDER_2H:
      return `Lembrete: horário em 2 horas — ${locationName}`;
    case MessageTemplateKey.APPOINTMENT_CANCELLED:
      return `Horário cancelado — ${locationName}`;
    case MessageTemplateKey.APPOINTMENT_RESCHEDULED:
      return `Horário remarcado — ${locationName}`;
    default:
      return `Mensagem — ${locationName}`;
  }
}
