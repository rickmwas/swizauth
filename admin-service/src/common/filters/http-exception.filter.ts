import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';

interface HttpExceptionResponsePayload {
  message?: string | string[];
  code?: string;
  error?: string;
}

interface PrismaErrorLike {
  code?: string;
  meta?: {
    target?: string[];
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let errorMessage = 'An internal server error occurred';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resPayload = exception.getResponse() as
        | HttpExceptionResponsePayload
        | string
        | null
        | undefined;

      if (typeof resPayload === 'object' && resPayload !== null) {
        if (Array.isArray(resPayload.message)) {
          errorMessage = resPayload.message.join(', ');
          errorCode = 'VALIDATION_ERROR';
        } else {
          errorMessage = resPayload.message || exception.message;
          errorCode = this.mapStatusToErrorCode(status, resPayload.code);
        }
      } else if (typeof resPayload === 'string') {
        errorMessage = resPayload;
        errorCode = this.mapStatusToErrorCode(status);
      } else {
        errorMessage = exception.message;
        errorCode = this.mapStatusToErrorCode(status);
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
      const exc = exception as PrismaErrorLike;

      // Prisma unique constraint error mapping
      if (exc.code === 'P2002') {
        status = HttpStatus.CONFLICT;
        const target = exc.meta?.target || [];
        if (target.includes('email')) {
          errorCode = 'EMAIL_EXISTS';
          errorMessage = 'Email address already registered';
        } else if (target.includes('username')) {
          errorCode = 'USERNAME_EXISTS';
          errorMessage = 'Username already registered';
        } else {
          errorCode = 'VALIDATION_ERROR';
          errorMessage = 'Unique constraint violation';
        }
      }
    }

    // Structured JSON log output matching TSAUTH standards
    const logPayload = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      service: 'admin-service',
      request_id: (request.headers['x-request-id'] as string | undefined) || '',
      endpoint: `${request.method} ${request.url}`,
      status,
      message: errorMessage,
      error: exception instanceof Error ? exception.stack : String(exception),
    };

    console.log(JSON.stringify(logPayload));

    response.status(status).json({
      success: false,
      error: {
        code: errorCode,
        message: errorMessage,
      },
    });
  }

  private mapStatusToErrorCode(
    status: HttpStatus,
    customCode?: string,
  ): string {
    if (customCode) return customCode;
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'VALIDATION_ERROR';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHORIZED';
      case HttpStatus.FORBIDDEN:
        return 'FORBIDDEN';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case 423 as HttpStatus:
        return 'ACCOUNT_LOCKED';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMIT_EXCEEDED';
      default:
        return 'INTERNAL_SERVER_ERROR';
    }
  }
}
