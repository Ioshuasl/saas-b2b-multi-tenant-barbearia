import type { Request, Response } from 'express';
import { AppError } from '../../../shared/domain/errors.js';
import {
  authLoginSchema,
  authPasswordForgotSchema,
  authPasswordResetSchema,
  authSignupSchema,
  authVerifyEmailSchema,
} from '../schemas/auth.schema.js';
import { parseBody } from '../helpers/http_parse.js';
import { requestMeta } from '../helpers/request_meta.js';
import type { SignupService } from '../services/auth/auth_signup.service.js';
import type { LoginService } from '../services/auth/auth_login.service.js';
import type { RefreshService } from '../services/auth/auth_refresh.service.js';
import type { LogoutService } from '../services/auth/auth_logout.service.js';
import type { LogoutAllService } from '../services/auth/auth_logout_all.service.js';
import type { MeService } from '../services/auth/auth_me.service.js';
import type { ForgotService } from '../services/auth/auth_password_forgot.service.js';
import type { ResetService } from '../services/auth/auth_password_reset.service.js';
import type { VerifyEmailService } from '../services/auth/auth_verify_email.service.js';
import type { AuthSession } from '../types/auth/auth_session.types.js';
import {
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from '../helpers/refresh_cookie.js';

export class AuthController {
  constructor(
    private readonly signupService: SignupService,
    private readonly loginService: LoginService,
    private readonly refreshService: RefreshService,
    private readonly logoutService: LogoutService,
    private readonly logoutAllService: LogoutAllService,
    private readonly meService: MeService,
    private readonly forgotService: ForgotService,
    private readonly resetService: ResetService,
    private readonly verifyEmailService: VerifyEmailService,
  ) {}

  async signup(req: Request, res: Response): Promise<void> {
    const authSignupSchemaParsed = parseBody(authSignupSchema, req.body);
    const session = await this.signupService.execute(
      authSignupSchemaParsed,
      requestMeta(req),
    );
    writeSession(res, session, 201);
  }

  async login(req: Request, res: Response): Promise<void> {
    const authLoginSchemaParsed = parseBody(authLoginSchema, req.body);
    const session = await this.loginService.execute(
      authLoginSchemaParsed,
      requestMeta(req),
    );
    writeSession(res, session, 200);
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const raw = readRefreshCookie(req);
    if (!raw) {
      throw new AppError('UNAUTHENTICATED', 'Sessão inválida. Entre novamente.', 401);
    }
    const session = await this.refreshService.execute(raw, requestMeta(req));
    writeSession(res, session, 200);
  }

  async logout(req: Request, res: Response): Promise<void> {
    await this.logoutService.execute(readRefreshCookie(req), requestMeta(req));
    clearSession(res);
    res.status(200).json({ data: { ok: true } });
  }

  async logoutAll(req: Request, res: Response): Promise<void> {
    await this.logoutAllService.execute(readRefreshCookie(req), requestMeta(req));
    clearSession(res);
    res.status(200).json({ data: { ok: true } });
  }

  async me(req: Request, res: Response): Promise<void> {
    const ctx = req.ctx;
    if (!ctx) throw new AppError('UNAUTHENTICATED', 'Contexto de autenticação ausente.', 401);
    const me = await this.meService.execute(ctx);
    res.status(200).json({ data: me });
  }

  async forgot(req: Request, res: Response): Promise<void> {
    const authPasswordForgotSchemaParsed = parseBody(authPasswordForgotSchema, req.body);
    await this.forgotService.execute(authPasswordForgotSchemaParsed, requestMeta(req));
    res.status(202).json({ data: { ok: true } });
  }

  async reset(req: Request, res: Response): Promise<void> {
    const authPasswordResetSchemaParsed = parseBody(authPasswordResetSchema, req.body);
    await this.resetService.execute(authPasswordResetSchemaParsed, requestMeta(req));
    res.status(200).json({ data: { ok: true } });
  }

  async verifyEmail(req: Request, res: Response): Promise<void> {
    const authVerifyEmailSchemaParsed = parseBody(authVerifyEmailSchema, req.body);
    await this.verifyEmailService.execute(authVerifyEmailSchemaParsed, requestMeta(req));
    res.status(200).json({ data: { ok: true } });
  }
}

function readRefreshCookie(req: Request): string | undefined {
  const cookies: unknown = req.cookies;
  if (!cookies || typeof cookies !== 'object') return undefined;
  const value = (cookies as Record<string, unknown>)[REFRESH_COOKIE_NAME];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

function writeSession(res: Response, session: AuthSession, status: number): void {
  res.cookie(REFRESH_COOKIE_NAME, session.refreshToken, refreshCookieOptions());
  res.status(status).json({
    data: {
      accessToken: session.accessToken,
      user: session.user,
    },
  });
}

function clearSession(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    path: refreshCookieOptions().path,
    httpOnly: true,
    sameSite: 'lax',
    secure: refreshCookieOptions().secure,
  });
}
