import type { Router } from 'express';
import { Router as createRouter } from 'express';
import { TrialPlanLimitAdapter } from './helpers/trial_plan_limit.adapter.js';
import { LocationController } from './controllers/location.controller.js';
import { TenantController } from './controllers/tenant.controller.js';
import { ServiceController } from './controllers/service.controller.js';
import { StaffController } from './controllers/staff.controller.js';
import { BusinessHoursController } from './controllers/business_hours.controller.js';
import { TimeBlockController } from './controllers/time_block.controller.js';
import { buildLocationRoutes } from './routes/v1/location.routes.js';
import { buildTenantRoutes } from './routes/v1/tenant.routes.js';
import { buildServiceRoutes } from './routes/v1/service.routes.js';
import { buildStaffRoutes } from './routes/v1/staff.routes.js';
import { buildBusinessHoursRoutes } from './routes/v1/business_hours.routes.js';
import { buildTimeBlockRoutes } from './routes/v1/time_block.routes.js';
import { GetRepository as LocationGetRepository } from './repositories/location/location_get.repository.js';
import { ListRepository as LocationListRepository } from './repositories/location/location_list.repository.js';
import { CreateRepository as LocationCreateRepository } from './repositories/location/location_create.repository.js';
import { UpdateRepository as LocationUpdateRepository } from './repositories/location/location_update.repository.js';
import { GetBySlugRepository } from './repositories/location/location_get_by_slug.repository.js';
import { AssertRepository } from './repositories/location/location_assert.repository.js';
import { GetRepository as TenantGetRepository } from './repositories/tenant/tenant_get.repository.js';
import { UpdateRepository as TenantUpdateRepository } from './repositories/tenant/tenant_update.repository.js';
import { SlugAvailableRepository } from './repositories/tenant/tenant_slug_available.repository.js';
import { ListRepository as ServiceListRepository } from './repositories/service/service_list.repository.js';
import { GetRepository as ServiceGetRepository } from './repositories/service/service_get.repository.js';
import { CreateRepository as ServiceCreateRepository } from './repositories/service/service_create.repository.js';
import { UpdateRepository as ServiceUpdateRepository } from './repositories/service/service_update.repository.js';
import { UpsertLocationRepository } from './repositories/service/service_upsert_location.repository.js';
import { ListRepository as StaffListRepository } from './repositories/staff/staff_list.repository.js';
import { GetRepository as StaffGetRepository } from './repositories/staff/staff_get.repository.js';
import { CreateRepository as StaffCreateRepository } from './repositories/staff/staff_create.repository.js';
import { UpdateRepository as StaffUpdateRepository } from './repositories/staff/staff_update.repository.js';
import { ReplaceLocationsRepository } from './repositories/staff/staff_replace_locations.repository.js';
import { ReplaceServicesRepository } from './repositories/staff/staff_replace_services.repository.js';
import { ListRepository as HoursListRepository } from './repositories/business_hours/business_hours_list.repository.js';
import { ReplaceRepository as HoursReplaceRepository } from './repositories/business_hours/business_hours_replace.repository.js';
import { ListRepository as TimeBlockListRepository } from './repositories/time_block/time_block_list.repository.js';
import { CreateRepository as TimeBlockCreateRepository } from './repositories/time_block/time_block_create.repository.js';
import { DeleteRepository as TimeBlockDeleteRepository } from './repositories/time_block/time_block_delete.repository.js';
import { GetRepository as OnboardingGetRepository } from './repositories/onboarding/onboarding_get.repository.js';
import { UpdateRepository as OnboardingUpdateRepository } from './repositories/onboarding/onboarding_update.repository.js';
import { GetService as LocationGetService } from './services/location/location_get.service.js';
import { ListService as LocationListService } from './services/location/location_list.service.js';
import { CreateService as LocationCreateService } from './services/location/location_create.service.js';
import { UpdateService as LocationUpdateService } from './services/location/location_update.service.js';
import { SlugAvailableService as LocationSlugService } from './services/location/location_slug_available.service.js';
import { GetService as TenantGetService } from './services/tenant/tenant_get.service.js';
import { UpdateService as TenantUpdateService } from './services/tenant/tenant_update.service.js';
import { SlugAvailableService as TenantSlugService } from './services/tenant/tenant_slug_available.service.js';
import { ListService as ServiceListService } from './services/service/service_list.service.js';
import { CreateService as ServiceCreateService } from './services/service/service_create.service.js';
import { UpdateService as ServiceUpdateService } from './services/service/service_update.service.js';
import { UpsertLocationService } from './services/service/service_upsert_location.service.js';
import { ListService as StaffListService } from './services/staff/staff_list.service.js';
import { CreateService as StaffCreateService } from './services/staff/staff_create.service.js';
import { UpdateService as StaffUpdateService } from './services/staff/staff_update.service.js';
import { ReplaceLocationsService } from './services/staff/staff_replace_locations.service.js';
import { ReplaceServicesService } from './services/staff/staff_replace_services.service.js';
import { InviteService } from './services/staff/staff_invite.service.js';
import { InviteAction } from './actions/staff/staff_invite.action.js';
import { ListService as HoursListService } from './services/business_hours/business_hours_list.service.js';
import { ReplaceService as HoursReplaceService } from './services/business_hours/business_hours_replace.service.js';
import { ListService as TimeBlockListService } from './services/time_block/time_block_list.service.js';
import { CreateService as TimeBlockCreateService } from './services/time_block/time_block_create.service.js';
import { DeleteService as TimeBlockDeleteService } from './services/time_block/time_block_delete.service.js';
import { GetService as OnboardingGetService } from './services/onboarding/onboarding_get.service.js';
import { UpdateService as OnboardingUpdateService } from './services/onboarding/onboarding_update.service.js';

export function buildLocationsRouter(): Router {
  const planLimit = new TrialPlanLimitAdapter();
  const locationGet = new LocationGetRepository();
  const locationList = new LocationListRepository();
  const locationCreate = new LocationCreateRepository();
  const locationUpdate = new LocationUpdateRepository();
  const locationBySlug = new GetBySlugRepository();
  const assertLocations = new AssertRepository();
  const tenantGet = new TenantGetRepository();
  const tenantUpdate = new TenantUpdateRepository();
  const tenantSlug = new SlugAvailableRepository();
  const serviceList = new ServiceListRepository();
  const serviceGet = new ServiceGetRepository();
  const serviceCreate = new ServiceCreateRepository();
  const serviceUpdate = new ServiceUpdateRepository();
  const serviceUpsert = new UpsertLocationRepository();
  const staffList = new StaffListRepository();
  const staffGet = new StaffGetRepository();
  const staffCreate = new StaffCreateRepository();
  const staffUpdate = new StaffUpdateRepository();
  const staffReplaceLocations = new ReplaceLocationsRepository();
  const staffReplaceServices = new ReplaceServicesRepository();
  const hoursList = new HoursListRepository();
  const hoursReplace = new HoursReplaceRepository();
  const timeBlockList = new TimeBlockListRepository();
  const timeBlockCreate = new TimeBlockCreateRepository();
  const timeBlockDelete = new TimeBlockDeleteRepository();
  const onboardingGet = new OnboardingGetRepository();
  const onboardingUpdate = new OnboardingUpdateRepository();

  const locationController = new LocationController(
    new LocationListService(locationList),
    new LocationGetService(locationGet),
    new LocationCreateService(planLimit, locationBySlug, locationCreate),
    new LocationUpdateService(locationGet, locationBySlug, locationUpdate),
    new LocationSlugService(locationBySlug),
  );

  const tenantController = new TenantController(
    new TenantGetService(tenantGet),
    new TenantUpdateService(tenantSlug, tenantUpdate),
    new TenantSlugService(tenantSlug),
    new OnboardingGetService(onboardingGet),
    new OnboardingUpdateService(onboardingGet, onboardingUpdate),
  );

  const serviceController = new ServiceController(
    new ServiceListService(serviceList),
    new ServiceCreateService(serviceCreate),
    new ServiceUpdateService(serviceUpdate),
    new UpsertLocationService(locationGet, serviceGet, serviceUpsert),
  );

  const staffController = new StaffController(
    new StaffListService(staffList),
    new StaffCreateService(planLimit, assertLocations, staffCreate),
    new StaffUpdateService(staffGet, assertLocations, staffUpdate),
    new ReplaceLocationsService(staffGet, assertLocations, staffReplaceLocations),
    new ReplaceServicesService(staffGet, serviceGet, staffReplaceServices),
    new InviteService(new InviteAction(staffGet)),
  );

  const hoursController = new BusinessHoursController(
    new HoursListService(locationGet, hoursList),
    new HoursReplaceService(locationGet, staffGet, hoursReplace),
  );

  const timeBlockController = new TimeBlockController(
    new TimeBlockListService(timeBlockList),
    new TimeBlockCreateService(locationGet, staffGet, timeBlockCreate),
    new TimeBlockDeleteService(timeBlockDelete),
  );

  const router = createRouter();
  router.use(buildTenantRoutes(tenantController));
  router.use(buildLocationRoutes(locationController, serviceController));
  router.use(buildServiceRoutes(serviceController));
  router.use(buildStaffRoutes(staffController));
  router.use(buildBusinessHoursRoutes(hoursController));
  router.use(buildTimeBlockRoutes(timeBlockController));
  return router;
}
