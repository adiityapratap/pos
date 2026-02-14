import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  health(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health/db')
  async dbHealth(): Promise<{ status: string; timestamp: string; tenantCount?: number; error?: string }> {
    try {
      const tenants = await this.prisma.tenant.count();
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        tenantCount: tenants,
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}
