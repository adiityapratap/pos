import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantSubdomain = req.headers['x-tenant-subdomain'] as string;

    // Paths that don't require tenant subdomain
    const publicPaths = [
      '/health',
      '/',
      '/api/health',
      '/api/',
      '/api/auth/owner-login',
    ];

    // Owner routes don't require tenant subdomain
    const isOwnerRoute = req.path.startsWith('/api/owner') || req.path.startsWith('/owner');
    const isPublicPath = publicPaths.includes(req.path);

    // For auth endpoints, tenant is required
    if (!tenantSubdomain) {
      // Allow public endpoints and owner routes
      if (isPublicPath || isOwnerRoute) {
        return next();
      }

      throw new UnauthorizedException('Tenant subdomain is required in x-tenant-subdomain header');
    }

    // Attach tenant subdomain to request for later use
    (req as any).tenantSubdomain = tenantSubdomain;

    next();
  }
}
