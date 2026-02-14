import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // @ts-ignore - Prisma type compatibility issue
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }

  /**
   * Set tenant context for Row-Level Security
   * @param tenantId - The tenant ID to set as context
   */
  async setTenantContext(tenantId: string) {
    await this.$executeRawUnsafe(
      `SET app.current_tenant_id = '${tenantId}'`,
    );
  }

  /**
   * Clear tenant context
   */
  async clearTenantContext() {
    await this.$executeRawUnsafe(`RESET app.current_tenant_id`);
  }

  /**
   * Execute a query within a tenant context
   * @param tenantId - The tenant ID
   * @param callback - The function to execute within the tenant context
   */
  async withTenantContext<T>(
    tenantId: string,
    callback: (prisma: PrismaClient) => Promise<T>,
  ): Promise<T> {
    await this.setTenantContext(tenantId);
    try {
      return await callback(this);
    } finally {
      await this.clearTenantContext();
    }
  }
}
