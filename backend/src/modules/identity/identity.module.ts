import { Router } from 'express';
import { getEmailPort } from '../../shared/integrations/email/index.js';
import { AuthController } from './controllers/auth.controller.js';
import { UserController } from './controllers/user.controller.js';
import { buildAuthRoutes } from './routes/v1/auth.routes.js';
import { buildUserRoutes } from './routes/v1/user.routes.js';
import { HibpLeakedPasswordAdapter } from './helpers/hibp_leaked_password.adapter.js';
import { SignupRepository } from './repositories/auth/auth_signup.repository.js';
import { LoginRepository } from './repositories/auth/auth_login.repository.js';
import { GetByEmailRepository } from './repositories/user/user_get_by_email.repository.js';
import { GetRepository as GetUserRepository } from './repositories/user/user_get.repository.js';
import { RecordFailureRepository } from './repositories/user/user_record_failure.repository.js';
import { GetByHashRepository as GetRefreshByHashRepository } from './repositories/refresh_token/refresh_token_get_by_hash.repository.js';
import { RotateRepository as RotateRefreshRepository } from './repositories/refresh_token/refresh_token_rotate.repository.js';
import { RevokeFamilyRepository } from './repositories/refresh_token/refresh_token_revoke_family.repository.js';
import { ConsumeRepository as ConsumeRefreshRepository } from './repositories/refresh_token/refresh_token_consume.repository.js';
import { RevokeUserRepository } from './repositories/refresh_token/refresh_token_revoke_user.repository.js';
import { SignupAction } from './actions/auth/auth_signup.action.js';
import { LoginAction } from './actions/auth/auth_login.action.js';
import { RefreshAction } from './actions/auth/auth_refresh.action.js';
import { LogoutAction } from './actions/auth/auth_logout.action.js';
import { LogoutAllAction } from './actions/auth/auth_logout_all.action.js';
import { SignupService } from './services/auth/auth_signup.service.js';
import { LoginService } from './services/auth/auth_login.service.js';
import { RefreshService } from './services/auth/auth_refresh.service.js';
import { LogoutService } from './services/auth/auth_logout.service.js';
import { LogoutAllService } from './services/auth/auth_logout_all.service.js';
import { MeService } from './services/auth/auth_me.service.js';
import { ForgotService } from './services/auth/auth_password_forgot.service.js';
import { ResetService } from './services/auth/auth_password_reset.service.js';
import { VerifyEmailService } from './services/auth/auth_verify_email.service.js';
import { GetMeRepository } from './repositories/user/user_get_me.repository.js';
import { ListRepository as UserListRepository } from './repositories/user/user_list.repository.js';
import { CountActiveOwnersRepository } from './repositories/user/user_count_active_owners.repository.js';
import { UpdateRepository as UserUpdateRepository } from './repositories/user/user_update.repository.js';
import { UpdatePasswordRepository } from './repositories/user/user_update_password.repository.js';
import { MarkEmailVerifiedRepository } from './repositories/user/user_mark_email_verified.repository.js';
import { AssertLocationsRepository } from './repositories/location/location_assert.repository.js';
import { GetNameRepository } from './repositories/tenant/tenant_get_name.repository.js';
import { GetByHashRepository as GetInviteByHashRepository } from './repositories/invitation/invitation_get_by_hash.repository.js';
import { GetRepository as GetInviteRepository } from './repositories/invitation/invitation_get.repository.js';
import { GetByEmailRepository as GetInviteByEmailRepository } from './repositories/invitation/invitation_get_by_email.repository.js';
import { CreateRepository as InviteCreateRepository } from './repositories/invitation/invitation_create.repository.js';
import { RotateRepository as InviteRotateRepository } from './repositories/invitation/invitation_rotate.repository.js';
import { DeleteRepository as InviteDeleteRepository } from './repositories/invitation/invitation_delete.repository.js';
import { AcceptRepository as InviteAcceptRepository } from './repositories/invitation/invitation_accept.repository.js';
import { ListRepository as InviteListRepository } from './repositories/invitation/invitation_list.repository.js';
import { GetByHashRepository as GetEmailTokenByHashRepository } from './repositories/email_token/email_token_get_by_hash.repository.js';
import { IssueRepository as IssueEmailTokenRepository } from './repositories/email_token/email_token_issue.repository.js';
import { ConsumeRepository as ConsumeEmailTokenRepository } from './repositories/email_token/email_token_consume.repository.js';
import { CreateAction as InviteCreateAction } from './actions/invitation/invitation_create.action.js';
import { ResendAction } from './actions/invitation/invitation_resend.action.js';
import { AcceptAction } from './actions/invitation/invitation_accept.action.js';
import { ForgotAction } from './actions/auth/auth_password_forgot.action.js';
import { ResetAction } from './actions/auth/auth_password_reset.action.js';
import { IssueVerifyAction } from './actions/auth/auth_verify_email_issue.action.js';
import { VerifyEmailAction } from './actions/auth/auth_verify_email.action.js';
import { CreateService as InviteCreateService } from './services/invitation/invitation_create.service.js';
import { ListService as InviteListService } from './services/invitation/invitation_list.service.js';
import { DeleteService as InviteDeleteService } from './services/invitation/invitation_delete.service.js';
import { ResendService } from './services/invitation/invitation_resend.service.js';
import { AcceptService } from './services/invitation/invitation_accept.service.js';
import { ListService as UserListService } from './services/user/user_list.service.js';
import { UpdateService as UserUpdateService } from './services/user/user_update.service.js';

export function buildIdentityRouter(): Router {
  const email = getEmailPort();
  const hibp = new HibpLeakedPasswordAdapter();

  const getByEmail = new GetByEmailRepository();
  const getUser = new GetUserRepository();
  const recordFailure = new RecordFailureRepository();
  const signupRepository = new SignupRepository();
  const loginRepository = new LoginRepository();
  const getRefreshByHash = new GetRefreshByHashRepository();
  const rotateRefresh = new RotateRefreshRepository();
  const revokeFamily = new RevokeFamilyRepository();
  const consumeRefresh = new ConsumeRefreshRepository();
  const revokeUser = new RevokeUserRepository();
  const getMe = new GetMeRepository();
  const userListRepository = new UserListRepository();
  const countOwners = new CountActiveOwnersRepository();
  const userUpdateRepository = new UserUpdateRepository();
  const updatePassword = new UpdatePasswordRepository();
  const markVerified = new MarkEmailVerifiedRepository();
  const assertLocations = new AssertLocationsRepository();
  const getTenantName = new GetNameRepository();
  const getInviteByHash = new GetInviteByHashRepository();
  const getInvite = new GetInviteRepository();
  const getInviteByEmail = new GetInviteByEmailRepository();
  const inviteCreateRepository = new InviteCreateRepository();
  const inviteRotate = new InviteRotateRepository();
  const inviteDeleteRepository = new InviteDeleteRepository();
  const inviteAcceptRepository = new InviteAcceptRepository();
  const inviteListRepository = new InviteListRepository();
  const getEmailTokenByHash = new GetEmailTokenByHashRepository();
  const issueEmailToken = new IssueEmailTokenRepository();
  const consumeEmailToken = new ConsumeEmailTokenRepository();

  const signupAction = new SignupAction(signupRepository);
  const loginAction = new LoginAction(loginRepository);
  const refreshAction = new RefreshAction(
    getRefreshByHash,
    rotateRefresh,
    revokeFamily,
    getUser,
  );
  const logoutAction = new LogoutAction(getRefreshByHash, consumeRefresh);
  const logoutAllAction = new LogoutAllAction(getRefreshByHash, revokeUser);
  const issueVerify = new IssueVerifyAction(issueEmailToken, email);
  const forgotAction = new ForgotAction(issueEmailToken, email);
  const resetAction = new ResetAction(
    getEmailTokenByHash,
    getUser,
    consumeEmailToken,
    updatePassword,
    revokeUser,
    hibp,
    email,
  );
  const verifyEmailAction = new VerifyEmailAction(
    getEmailTokenByHash,
    consumeEmailToken,
    markVerified,
  );
  const inviteCreateAction = new InviteCreateAction(
    getByEmail,
    getInviteByEmail,
    inviteCreateRepository,
    inviteRotate,
    assertLocations,
    getTenantName,
    email,
  );
  const resendAction = new ResendAction(getInvite, inviteRotate, getTenantName, email);
  const acceptAction = new AcceptAction(getInviteByHash, getByEmail, inviteAcceptRepository, hibp);

  const authController = new AuthController(
    new SignupService(getByEmail, hibp, signupAction, loginAction, issueVerify),
    new LoginService(getByEmail, recordFailure, loginAction),
    new RefreshService(refreshAction),
    new LogoutService(logoutAction),
    new LogoutAllService(logoutAllAction),
    new MeService(getMe),
    new ForgotService(getByEmail, forgotAction),
    new ResetService(resetAction),
    new VerifyEmailService(verifyEmailAction),
  );

  const userController = new UserController(
    new UserListService(userListRepository),
    new UserUpdateService(getUser, countOwners, userUpdateRepository, assertLocations),
    new InviteCreateService(inviteCreateAction),
    new InviteListService(inviteListRepository),
    new InviteDeleteService(getInvite, inviteDeleteRepository),
    new ResendService(resendAction),
    new AcceptService(acceptAction),
  );

  const router = Router();
  router.use(buildAuthRoutes(authController));
  router.use(buildUserRoutes(userController));
  return router;
}
