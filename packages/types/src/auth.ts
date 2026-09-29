export type UserRole =
  | 'SYSTEM_ADMIN'
  | 'MANAGING_PARTNER'
  | 'PARTNER'
  | 'LAWYER'
  | 'PARALEGAL'
  | 'INTERN'
  | 'ACCOUNTANT'
  | 'ADMIN_STAFF'
  | 'RECEPTIONIST'
  | 'EXTERNAL_COLLABORATOR';

export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'RESIGNED';

export interface UserSummary {
  id: string;
  email: string;
  fullName: string;
  roles: UserRole[];
  status: UserStatus;
  department?: string;
  position?: string;
  mfaEnabled: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResult {
  requiresMfa?: boolean;
  mfaSessionToken?: string;
  user?: UserSummary;
  message?: string;
}

export interface VerifyMfaPayload {
  mfaSessionToken: string;
  code: string;
  isRecoveryCode?: boolean;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface ActiveSession {
  id: string;
  isCurrent: boolean;
  ipAddress: string;
  userAgent: string;
  browser: string;
  os: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  createdAt: string;
  expiresAt: string;
  lastActiveAt: string;
}

export interface RevokeSessionPayload {
  sessionId: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
    requestId?: string;
    timestamp?: string;
  };
}
