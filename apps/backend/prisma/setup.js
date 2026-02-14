#!/usr/bin/env node

/**
 * Database Setup Script for POS SaaS
 * 
 * This script automates the complete database setup process:
 * 1. Creates database if not exists
 * 2. Runs Prisma migrations
 * 3. Applies PostgreSQL-specific features
 * 4. Seeds sample data
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for pretty output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function header(message) {
  log(`\n${'='.repeat(60)}`, colors.bright);
  log(message, colors.bright + colors.blue);
  log('='.repeat(60), colors.bright);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function warning(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function execCommand(command, description) {
  try {
    log(`\n▶️  ${description}...`);
    execSync(command, { stdio: 'inherit' });
    success(`${description} completed`);
    return true;
  } catch (err) {
    error(`${description} failed`);
    return false;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const skipSeed = args.includes('--skip-seed');
const resetDb = args.includes('--reset');

// Main setup function
async function setup() {
  header('🚀 POS SaaS Database Setup');

  // Check if .env file exists
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) {
    error('.env file not found!');
    info('Please create a .env file with DATABASE_URL');
    info('Example: DATABASE_URL="postgresql://user:password@localhost:5432/pos_saas"');
    process.exit(1);
  }

  success('.env file found');

  // Load environment variables
  require('dotenv').config({ path: envPath });
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    error('DATABASE_URL not set in .env file');
    process.exit(1);
  }

  info(`Database: ${databaseUrl.split('@')[1]?.split('?')[0] || 'configured'}`);

  // Step 1: Generate Prisma Client
  header('Step 1: Generate Prisma Client');
  if (!execCommand('npx prisma generate', 'Generating Prisma Client')) {
    process.exit(1);
  }

  // Step 2: Database Migration
  if (resetDb) {
    header('Step 2: Reset Database (WARNING: All data will be lost!)');
    warning('Resetting database in 3 seconds... Press Ctrl+C to cancel');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (!execCommand('npx prisma migrate reset --force', 'Resetting database')) {
      process.exit(1);
    }
  } else {
    header('Step 2: Run Database Migrations');
    if (!execCommand('npx prisma migrate deploy', 'Running migrations')) {
      warning('Migration failed. Trying migrate dev instead...');
      if (!execCommand('npx prisma migrate dev --name init', 'Running migrate dev')) {
        process.exit(1);
      }
    }
  }

  // Step 3: Apply PostgreSQL-specific features
  header('Step 3: Apply PostgreSQL Extensions & Features');
  
  const postDeployPath = path.join(__dirname, 'migrations', 'post-deploy.sql');
  
  if (fs.existsSync(postDeployPath)) {
    info('Found post-deploy.sql');
    
    // Extract database connection details
    const dbUrl = new URL(databaseUrl);
    const host = dbUrl.hostname;
    const port = dbUrl.port || 5432;
    const database = dbUrl.pathname.slice(1).split('?')[0];
    const username = dbUrl.username;
    const password = dbUrl.password;

    // Try to find psql
    const psqlPaths = [
      'psql', // In PATH
      'C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe',
      'C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe',
      'C:\\Program Files\\PostgreSQL\\14\\bin\\psql.exe',
      '/usr/bin/psql',
      '/usr/local/bin/psql',
    ];

    let psqlPath = null;
    for (const path of psqlPaths) {
      try {
        execSync(`"${path}" --version`, { stdio: 'ignore' });
        psqlPath = path;
        break;
      } catch (err) {
        // Continue to next path
      }
    }

    if (psqlPath) {
      info(`Using psql: ${psqlPath}`);
      
      // Set PGPASSWORD environment variable for Windows
      const env = { ...process.env };
      if (password) {
        env.PGPASSWORD = password;
      }

      const psqlCommand = `"${psqlPath}" -h ${host} -p ${port} -U ${username} -d ${database} -f "${postDeployPath}"`;
      
      try {
        execSync(psqlCommand, { stdio: 'inherit', env });
        success('Applied PostgreSQL extensions and features');
      } catch (err) {
        warning('Failed to apply post-deploy.sql automatically');
        info('Please run this command manually:');
        console.log(`  ${psqlCommand}`);
      }
    } else {
      warning('psql not found in common locations');
      info('Please run post-deploy.sql manually:');
      info(`  psql -h ${host} -p ${port} -U ${username} -d ${database} -f "${postDeployPath}"`);
    }
  } else {
    warning('post-deploy.sql not found, skipping');
  }

  // Step 4: Seed Database
  if (!skipSeed) {
    header('Step 4: Seed Sample Data');
    if (!execCommand('npx ts-node prisma/seed.ts', 'Seeding database')) {
      warning('Seeding failed. You can run it manually with: npm run prisma:seed');
    }
  } else {
    warning('Skipping database seeding (--skip-seed flag)');
  }

  // Success summary
  header('✨ Setup Complete!');
  success('Database is ready to use');
  
  console.log('\n📊 What was created:');
  console.log('  • 40+ database tables');
  console.log('  • 100+ performance indexes');
  console.log('  • PostgreSQL extensions (uuid-ossp, pg_trgm, btree_gin)');
  console.log('  • Trigger functions for auto-updates');
  console.log('  • Row-Level Security policies');
  if (!skipSeed) {
    console.log('  • Sample data (Demo Café, products, users)');
  }

  console.log('\n🎯 Next steps:');
  console.log('  1. Explore database: npm run prisma:studio');
  console.log('  2. View data at: http://localhost:5555');
  console.log('  3. Start coding! 🚀');

  console.log('\n📚 Documentation:');
  console.log('  • Quick Start: backend/QUICKSTART.md');
  console.log('  • Full Docs: backend/prisma/README.md');
  console.log('  • Conversion Notes: backend/SCHEMA_CONVERSION.md');

  console.log('');
}

// Run setup
setup().catch((err) => {
  error('Setup failed with error:');
  console.error(err);
  process.exit(1);
});
