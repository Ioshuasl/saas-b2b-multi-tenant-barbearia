import type { Router } from 'express';
import { Router as createRouter } from 'express';
import { CustomerController } from './controllers/customer.controller.js';
import { buildCustomerRoutes } from './routes/v1/customer.routes.js';
import { CreateRepository } from './repositories/customer/customer_create.repository.js';
import { GetRepository } from './repositories/customer/customer_get.repository.js';
import { GetByPhoneRepository } from './repositories/customer/customer_get_by_phone.repository.js';
import { ListRepository } from './repositories/customer/customer_list.repository.js';
import { UpdateRepository } from './repositories/customer/customer_update.repository.js';
import { DeactivateRepository } from './repositories/customer/customer_deactivate.repository.js';
import { CreateService } from './services/customer/customer_create.service.js';
import { GetService } from './services/customer/customer_get.service.js';
import { ListService } from './services/customer/customer_list.service.js';
import { UpdateService } from './services/customer/customer_update.service.js';
import { DeleteService } from './services/customer/customer_delete.service.js';
import { CheckDuplicateService } from './services/customer/customer_check_duplicate.service.js';
import { AppointmentsListService } from './services/customer/customer_appointments_list.service.js';

export function buildCustomersRouter(): Router {
  const createRepository = new CreateRepository();
  const getRepository = new GetRepository();
  const getByPhoneRepository = new GetByPhoneRepository();
  const listRepository = new ListRepository();
  const updateRepository = new UpdateRepository();
  const deactivateRepository = new DeactivateRepository();

  const getService = new GetService(getRepository);

  const controller = new CustomerController(
    new ListService(listRepository),
    new CreateService(createRepository, getByPhoneRepository),
    getService,
    new UpdateService(getService, updateRepository),
    new DeleteService(deactivateRepository),
    new CheckDuplicateService(getByPhoneRepository),
    new AppointmentsListService(getRepository),
  );

  const router = createRouter();
  router.use(buildCustomerRoutes(controller));
  return router;
}
