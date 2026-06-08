/**
 * Shape of the user object attached to requests by AuthGuard
 * after successful token verification against the Go auth-service.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationId: string;
  roles: string[];
  permissions: string[];
}
