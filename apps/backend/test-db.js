const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  const prisma = new PrismaClient();
  
  try {
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'SET' : 'NOT SET');
    
    // Test connection
    const tenantCount = await prisma.tenant.count();
    console.log('Tenant count:', tenantCount);
    
    // Get tenant info
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain: 'demo' }
    });
    console.log('Demo tenant:', tenant ? tenant.id : 'NOT FOUND');
    
    // Get user count
    const userCount = await prisma.user.count({
      where: { 
        tenant: { subdomain: 'demo' } 
      }
    });
    console.log('User count in demo tenant:', userCount);
    
    // Get admin user
    const admin = await prisma.user.findFirst({
      where: {
        email: 'admin@demo.com',
        tenant: { subdomain: 'demo' }
      }
    });
    console.log('Admin user:', admin ? { id: admin.id, email: admin.email, isActive: admin.isActive } : 'NOT FOUND');
    
    console.log('SUCCESS: Database connection working');
  } catch (error) {
    console.error('ERROR:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
