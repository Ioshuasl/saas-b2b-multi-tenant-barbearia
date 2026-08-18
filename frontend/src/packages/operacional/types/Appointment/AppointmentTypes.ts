import type {
  AppointmentCancelBody,
  AppointmentCreateBody,
  AppointmentDetail,
  AppointmentHistoryItem,
  AppointmentListQuery,
  AppointmentServiceLine,
  AppointmentSourceName,
  AppointmentStatusBody,
  AppointmentStatusName,
  AppointmentSummary,
  AppointmentUpdateBody,
} from '@repo/contracts';

export type {
  AppointmentCancelBody,
  AppointmentCreateBody,
  AppointmentDetail,
  AppointmentHistoryItem,
  AppointmentListQuery,
  AppointmentServiceLine,
  AppointmentSourceName,
  AppointmentStatusBody,
  AppointmentStatusName,
  AppointmentSummary,
  AppointmentUpdateBody,
};

import type { AppointmentSummary as AppointmentSummaryType } from '@repo/contracts';

export type AppointmentViewMode = 'day' | 'week';

export type AppointmentSlotDraft = {
  staffId: string;
  startsAt: string;
  dayKey: string;
};

export type AppointmentFormDialogProps = {
  appointment: AppointmentSummaryType | null;
  draft: AppointmentSlotDraft | null;
  dayKey: string;
  onClose: () => void;
};

export type AppointmentSidebarProps = {
  appointmentId: string;
  timezone: string;
  onClose: () => void;
  onEdit: (appointment: AppointmentSummaryType) => void;
};

export type AppointmentCancelDialogProps = {
  appointmentId: string;
  onClose: () => void;
  onCancelled: () => void;
};

export type AppointmentIndexProps = {
  defaultView?: AppointmentViewMode;
};

export type AppointmentDayViewProps = {
  dayKey: string;
  timezone: string;
  staff: Array<{ id: string; name: string }>;
  appointments: AppointmentSummaryType[];
  onSlotClick: (draft: AppointmentSlotDraft) => void;
  onAppointmentClick: (appointment: AppointmentSummaryType) => void;
  onReschedule: (input: {
    appointment: AppointmentSummaryType;
    staffId: string;
    startsAt: string;
    dayKey: string;
  }) => void;
};

export type AppointmentWeekViewProps = {
  dayKeys: string[];
  timezone: string;
  appointments: AppointmentSummaryType[];
  onDayClick: (dayKey: string) => void;
  onAppointmentClick: (appointment: AppointmentSummaryType) => void;
};

export type AppointmentCardProps = {
  appointment: AppointmentSummaryType;
  dayKey: string;
  timezone: string;
  draggable?: boolean;
  onClick: () => void;
  onReschedule?: (startsAt: string, staffId: string) => void;
};
