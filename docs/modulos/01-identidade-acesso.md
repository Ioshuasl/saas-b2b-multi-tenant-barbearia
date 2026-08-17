# Módulo — Identidade e Acesso (`identity`)

## 1. Responsabilidade

Autenticar pessoas, amarrá-las a **um** tenant no MVP e garantir que cada request só faça o que o papel + `user_locations` + `staff_id` permitem. Único módulo que conhece senha, token e sessão.

**Não é responsabilidade:** dados da rede/unidade (`locations`), assinatura (`subscription`), perfil de quem aparece na agenda (`staff` — pode existir sem login).

## 2. Agregados

| Agregado | Invariantes |
| --- | --- |
| `User` | E-mail único global; senha Argon2id, mínimo 10 caracteres + lista de vazadas; bloqueio após N falhas |
| `Invitation` | Token de uso único, 7 dias; e-mail sem usuário ativo no tenant |
| `RefreshTokenFamily` | Reuso de token consumido revoga a família |
| `UserLocation` | Escopo de unidades; `OWNER` ignora a tabela |

Ao menos **um** `OWNER` ativo por tenant; o último não pode ser removido nem rebaixado.

## 3. Permissões

```ts
export const PERMISSIONS = [
  'agenda.read', 'agenda.write',
  'customers.read', 'customers.write',
  'finance.read', 'finance.write',
  'messaging.read', 'messaging.configure',
  'reports.read', 'reports.financial', 'reports.network',
  'settings.read', 'settings.write',
  'users.manage', 'subscription.manage', 'data.export', 'audit.read',
] as const;

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  OWNER: PERMISSIONS,
  MANAGER: [
    'agenda.read', 'agenda.write',
    'customers.read', 'customers.write',
    'finance.read', 'finance.write',
    'messaging.read',
    'reports.read', 'reports.financial',
    'settings.read', 'settings.write',
    'users.manage',
  ],
  RECEPTIONIST: [
    'agenda.read', 'agenda.write',
    'customers.read', 'customers.write',
    'finance.read', 'finance.write',
    'reports.read',
    'settings.read',
  ],
  STAFF: [
    'agenda.read', 'agenda.write', // filtrado por staff_id no servidor
    'customers.read',
    'reports.read',                 // só própria comissão
  ],
};
```

Regras:

1. Recurso de outra unidade do escopo → `404`, não `403`.
2. `STAFF` só muta os próprios atendimentos (`staff_id` do vínculo).
3. Permissão negada no **mesmo** tenant/unidade visível → `403` + `audit_log PERMISSION_DENIED`.
4. `platform_admin` é tabela separada, MFA obrigatório, fora da RLS de tenant.

## 4. Casos de uso

| Use case | Regras |
| --- | --- |
| `SignUpService` | Tenant + location `is_default` + User OWNER + seeds (serviços, horários) + `tenant_crypto_key` + subscription TRIALING 14 d; evento `identity.tenant_created` |
| `SignInService` | Tempo constante; rate 5/min IP+e-mail; emite access+refresh |
| `RefreshTokenService` | Rotação; reuso → revoga família + alerta |
| `RequestPasswordResetService` | Sempre 202; token 1 h |
| `ResetPasswordService` | Nova senha; revoga sessões; e-mail |
| `InviteUserService` | Papel + `location_ids`; reenvio/revogação |
| `AcceptInvitationService` | Define senha; cria `user_locations` |
| `UpdateUserService` | Não rebaixa o último OWNER |

## 5. API pública do módulo

```ts
export interface IdentityModuleApi {
  getActor(userId: EntityId): Promise<{ role: Role; locationIds: EntityId[] | 'ALL'; staffId?: EntityId }>;
  authorize(ctx: RequestContext, permission: Permission, resource?: { locationId?: EntityId; staffId?: EntityId }): void;
}
```
