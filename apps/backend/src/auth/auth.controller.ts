import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PinLoginDto, EmailLoginDto, OwnerLoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * PIN Login for POS terminals
   * POST /auth/pin-login
   */
  @Post('pin-login')
  @HttpCode(HttpStatus.OK)
  async pinLogin(
    @Body() dto: PinLoginDto,
    @Headers('x-tenant-subdomain') tenantSubdomain: string,
  ) {
    if (!tenantSubdomain) {
      throw new Error('Tenant subdomain is required');
    }

    return this.authService.validatePin(
      dto.employeeId,
      dto.pin,
      tenantSubdomain,
    );
  }

  /**
   * Email/Password Login for web dashboard
   * POST /auth/login
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async emailLogin(
    @Body() dto: EmailLoginDto,
    @Headers('x-tenant-subdomain') tenantSubdomain: string,
  ) {
    if (!tenantSubdomain) {
      throw new Error('Tenant subdomain is required');
    }

    return this.authService.validateEmailPassword(
      dto.email,
      dto.password,
      tenantSubdomain,
    );
  }

  /**
   * Owner/Super Admin Login for Owner Portal
   * POST /auth/owner-login
   * Does not require tenant subdomain - authenticates platform owners
   */
  @Post('owner-login')
  @HttpCode(HttpStatus.OK)
  async ownerLogin(@Body() dto: OwnerLoginDto) {
    return this.authService.validateOwnerLogin(dto.email, dto.password);
  }

  /**
   * Refresh token (optional for future use)
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() body: { refreshToken: string }) {
    // Implement refresh token logic if needed
    return { message: 'Refresh token endpoint' };
  }
}
