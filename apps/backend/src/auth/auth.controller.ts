import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Headers,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { PinLoginDto, EmailLoginDto, OwnerLoginDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  
  constructor(private readonly authService: AuthService) {}

  /**
   * Get tenant theme settings by subdomain
   * GET /auth/tenant-theme/:subdomain
   * Public endpoint - no auth required
   */
  @Get('tenant-theme/:subdomain')
  async getTenantTheme(@Param('subdomain') subdomain: string) {
    this.logger.log(`Fetching theme for tenant: ${subdomain}`);
    return this.authService.getTenantTheme(subdomain);
  }

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
    this.logger.log(`PIN login attempt for employee: ${dto.employeeId}, tenant: ${tenantSubdomain}`);
    
    if (!tenantSubdomain) {
      throw new BadRequestException('Tenant subdomain is required (x-tenant-subdomain header)');
    }

    try {
      const result = await this.authService.validatePin(
        dto.employeeId,
        dto.pin,
        tenantSubdomain,
      );
      this.logger.log(`PIN login successful for employee: ${dto.employeeId}`);
      return result;
    } catch (error) {
      this.logger.error(`PIN login failed: ${error.message}`, error.stack);
      throw error;
    }
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
    this.logger.log(`Email login attempt for: ${dto.email}, tenant: ${tenantSubdomain}`);
    
    if (!tenantSubdomain) {
      throw new BadRequestException('Tenant subdomain is required (x-tenant-subdomain header)');
    }

    try {
      const result = await this.authService.validateEmailPassword(
        dto.email,
        dto.password,
        tenantSubdomain,
      );
      this.logger.log(`Email login successful for: ${dto.email}`);
      return result;
    } catch (error) {
      this.logger.error(`Email login failed: ${error.message}`, error.stack);
      throw error;
    }
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
