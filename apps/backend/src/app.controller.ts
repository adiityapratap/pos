import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma.service';

// Build timestamp: 2026-02-14T19:10:00Z - v2
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
  health(): { status: string; timestamp: string; version: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: 'v2-with-db-health'
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

  @Get('debug')
  debug(): { dbUrlSet: boolean; nodeEnv: string; port: string } {
    return {
      dbUrlSet: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV || 'not-set',
      port: process.env.PORT || '3000',
    };
  }
}
