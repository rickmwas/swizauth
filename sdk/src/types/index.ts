export interface SwizAuthConfig {
  clientId: string;
  domain: string;
  redirectUri?: string;
  audience?: string;
  scope?: string;
  organizationId?: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  organizationId: string;
  roles: string[];
  permissions: string[];
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  plan: string;
  status: string;
}

export interface Session {
  id: string;
  userId: string;
  organizationId: string;
  expiresAt: string;
  lastActivityAt: string;
  deviceName?: string;
  browser?: string;
  ipAddress?: string;
  country?: string;
  city?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface LoginCredentials {
  email?: string;
  username?: string;
  password: string;
  organizationId?: string;
}

export interface RegisterCredentials {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationId?: string;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
  organization: Organization;
}

export interface AuthError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface AuthState {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: User | null;
  organization: Organization | null;
  session: Session | null;
}

export interface SwizAuthClientOptions {
  onRedirectCallback?: (redirectUrl?: string) => void;
  onTokenExpired?: () => void;
  onSessionExpired?: () => void;
  storage?: 'localStorage' | 'sessionStorage' | 'memory';
}