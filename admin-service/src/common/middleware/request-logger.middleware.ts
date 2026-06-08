import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();

    // Inject x-request-id header if not present
    let requestId = req.headers['x-request-id'] as string;
    if (!requestId) {
      requestId = crypto.randomUUID();
      req.headers['x-request-id'] = requestId;
    }

    // Injects response header for client tracking
    res.setHeader('x-request-id', requestId);

    res.on('finish', () => {
      const latency = Date.now() - start;
      const logPayload = {
        timestamp: new Date().toISOString(),
        level: 'INFO',
        service: 'admin-service',
        request_id: requestId,
        endpoint: `${req.method} ${req.originalUrl || req.url}`,
        status: res.statusCode,
        latency_ms: latency,
        message: `HTTP Request: ${req.method} ${req.url} returned status ${res.statusCode} in ${latency}ms`,
      };

      console.log(JSON.stringify(logPayload));
    });

    next();
  }
}
