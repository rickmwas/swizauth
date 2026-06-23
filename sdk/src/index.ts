// Core client
export { TSAUTHClient } from './client/TSAuthClient';

// React components and hooks
export { TSAUTHProvider, useAuth, useUser, useOrganization, useSession } from './react/TSAuthProvider';
export { SignIn } from './react/components/SignIn';
export { SignUp } from './react/components/SignUp';
export { UserProfile } from './react/components/UserProfile';
export { OrganizationSwitcher } from './react/components/OrganizationSwitcher';

// Types
export type {
  TSAUTHConfig,
  TSAUTHClientOptions,
  User,
  Organization,
  Session,
  AuthTokens,
  AuthResult,
  AuthError,
  AuthState,
  LoginCredentials,
  RegisterCredentials,
} from './types';

// Component prop types
export type { SignInProps } from './react/components/SignIn';
export type { SignUpProps } from './react/components/SignUp';
export type { UserProfileProps } from './react/components/UserProfile';
export type { OrganizationSwitcherProps } from './react/components/OrganizationSwitcher';

// CSS (for bundlers that support CSS imports)
import './styles/tsauth.css';