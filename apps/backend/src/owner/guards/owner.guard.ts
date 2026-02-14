import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

/**
 * Guard to ensure only owner/super_admin users can access owner endpoints
 */
@Injectable()
export class OwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check if user has owner role
    if (user.role !== 'owner' && user.role !== 'super_admin') {
      throw new ForbiddenException('Owner access required');
    }

    return true;
  }
}
