import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';

@Injectable()
export class PinStrategy extends PassportStrategy(Strategy, 'pin') {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'employeeId',
      passwordField: 'pin',
      passReqToCallback: true,
    });
  }

  async validate(req: any, employeeId: string, pin: string): Promise<any> {
    const tenantSubdomain = req.headers['x-tenant-subdomain'];
    
    if (!tenantSubdomain) {
      throw new UnauthorizedException('Tenant subdomain is required');
    }

    const user = await this.authService.validatePin(employeeId, pin, tenantSubdomain);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }
}
