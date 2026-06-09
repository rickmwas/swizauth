import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

interface VerifyTokenUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

interface VerifyTokenOrganization {
  id: string;
}

interface VerifyTokenResponse {
  authenticated: boolean;
  user: VerifyTokenUser;
  organization: VerifyTokenOrganization;
  roles?: string[];
  permissions?: string[];
}

interface VerifyTokenErrorResponse {
  error?: {
    message?: string;
  };
}

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly authServiceUrl: string;
  private readonly internalApiSecret: string;

  constructor(configService: ConfigService) {
    this.authServiceUrl =
      configService.get<string>('AUTH_SERVICE_URL') || 'http://localhost:8080';
    this.internalApiSecret =
      configService.get<string>('INTERNAL_API_SECRET') || '';
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<Request & { user?: AuthenticatedUser }>();
    const authHeader = request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token is required');
    }

    const token = authHeader.substring(7);

    try {
      const response = await fetch(
        `${this.authServiceUrl}/api/v1/internal/verify-token`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.internalApiSecret}`,
          },
          body: JSON.stringify({ token }),
        },
      );

      if (!response.ok) {
        const errorData = (await response
          .json()
          .catch(() => ({}))) as VerifyTokenErrorResponse;
        throw new UnauthorizedException(
          errorData?.error?.message || 'Invalid or expired access token',
        );
      }

      const verifyData = (await response.json()) as VerifyTokenResponse;

      if (!verifyData.authenticated) {
        throw new UnauthorizedException('Authentication failed');
      }

      // Attach the verified claims to request context
      request.user = {
        id: verifyData.user.id,
        email: verifyData.user.email,
        firstName: verifyData.user.first_name,
        lastName: verifyData.user.last_name,
        organizationId: verifyData.organization.id,
        roles: verifyData.roles || [],
        permissions: verifyData.permissions || [],
      };

      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException(
        'Authentication service unreachable or token invalid',
      );
    }
  }
}
