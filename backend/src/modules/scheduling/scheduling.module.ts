import type { Router } from 'express';
import { Router as createRouter } from 'express';
import { AppointmentController } from './controllers/appointment.controller.js';
import { PublicBookingController } from './controllers/public_booking.controller.js';
import { buildAppointmentRoutes } from './routes/v1/appointment.routes.js';
import { buildPublicBookingRoutes } from './routes/v1/public_booking.routes.js';
import { InsertRepository } from './repositories/appointment/appointment_insert.repository.js';
import { ListRepository as AppointmentListRepository } from './repositories/appointment/appointment_list.repository.js';
import { GetRepository } from './repositories/appointment/appointment_get.repository.js';
import { UpdateRepository } from './repositories/appointment/appointment_update.repository.js';
import { StatusRepository } from './repositories/appointment/appointment_status.repository.js';
import { FindActiveRepository } from './repositories/appointment/appointment_find_active.repository.js';
import { StaffCandidatesRepository } from './repositories/appointment/staff_candidates.repository.js';
import { CountFutureRepository } from './repositories/appointment/appointment_count_future.repository.js';
import { GetByTokenRepository } from './repositories/appointment/appointment_get_by_token.repository.js';
import { ListRepository as HistoryListRepository } from './repositories/appointment_history/history_list.repository.js';
import { ClaimRepository } from './repositories/idempotency/idempotency_claim.repository.js';
import { SlotCalculateService } from './services/appointment/appointment_slot_calculate.service.js';
import { PersistService } from './services/appointment/appointment_persist.service.js';
import { ListService as AvailabilityListService } from './services/availability/availability_list.service.js';
import { CreateService } from './services/appointment/appointment_create.service.js';
import { ListService as AppointmentListService } from './services/appointment/appointment_list.service.js';
import { GetService } from './services/appointment/appointment_get.service.js';
import { UpdateService } from './services/appointment/appointment_update.service.js';
import { StatusService } from './services/appointment/appointment_status.service.js';
import { DeleteService } from './services/appointment/appointment_delete.service.js';
import { HistoryListService } from './services/appointment/appointment_history_list.service.js';
import { ScopeService } from './services/public/public_scope.service.js';
import { TenantListService } from './services/public/public_tenant_list.service.js';
import { LocationGetService } from './services/public/public_location_get.service.js';
import { BookService } from './services/public/public_book.service.js';
import { AppointmentGetService } from './services/public/public_appointment_get.service.js';
import { AppointmentUpdateService } from './services/public/public_appointment_update.service.js';
import { AppointmentCancelService } from './services/public/public_appointment_cancel.service.js';

const slotCalculate = new SlotCalculateService();
const insertRepository = new InsertRepository();
const persistService = new PersistService(slotCalculate, insertRepository);

export function buildSchedulingRouter(): Router {
  const getRepository = new GetRepository();
  const updateRepository = new UpdateRepository();
  const claimRepository = new ClaimRepository();
  const getByTokenRepository = new GetByTokenRepository();
  const availabilityListService = new AvailabilityListService(
    new StaffCandidatesRepository(),
    new FindActiveRepository(),
    slotCalculate,
  );
  const getService = new GetService(getRepository);
  const statusRepository = new StatusRepository();
  const statusService = new StatusService(getRepository, statusRepository, getService);

  const panelController = new AppointmentController(
    availabilityListService,
    new AppointmentListService(new AppointmentListRepository()),
    new CreateService(
      slotCalculate,
      insertRepository,
      getRepository,
      claimRepository,
      availabilityListService,
    ),
    getService,
    new UpdateService(getRepository, getService, updateRepository, slotCalculate),
    statusService,
    new DeleteService(getRepository, statusService),
    new HistoryListService(getRepository, new HistoryListRepository()),
  );

  const scopeService = new ScopeService();
  const publicController = new PublicBookingController(
    scopeService,
    new TenantListService(scopeService),
    new LocationGetService(scopeService),
    availabilityListService,
    new BookService(
      scopeService,
      slotCalculate,
      insertRepository,
      getRepository,
      new CountFutureRepository(),
      claimRepository,
      availabilityListService,
    ),
    new AppointmentGetService(scopeService, getByTokenRepository, getRepository),
    new AppointmentUpdateService(
      scopeService,
      getByTokenRepository,
      getRepository,
      updateRepository,
      slotCalculate,
    ),
    new AppointmentCancelService(scopeService, getByTokenRepository, statusRepository),
  );

  const router = createRouter();
  router.use(buildAppointmentRoutes(panelController));
  router.use(buildPublicBookingRoutes(publicController));
  return router;
}

export { slotCalculate, insertRepository, persistService, SlotCalculateService, PersistService };
