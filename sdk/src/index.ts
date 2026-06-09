// Core client
export { SwizAuthClient } from './client/SwizAuthClient';

// React components and hooks
export { SwizAuthProvider, useAuth, useUser, useOrganization, useSession } from './react/SwizAuthProvider';
export { SignIn } from './react/components/SignIn';
export { SignUp } from './react/components/SignUp';
export { UserProfile } from './react/components/UserProfile';
export { OrganizationSwitcher } from './react/components/OrganizationSwitcher';

// Types
export type {
  SwizAuthConfig,
  SwizAuthClientOptions,
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
import './styles/swizauth.css';