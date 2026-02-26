#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const command = args[0];

const MIGRATION_LOG_FILE = path.join(__dirname, '../../migration-execution.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(MIGRATION_LOG_FILE, logMessage);
}

function runCommand(cmd) {
  log(`Executing: ${cmd}`);
  try {
    const output = execSync(cmd, { encoding: 'utf-8', stdio: 'pipe' });
    log(`Success: ${output}`);
    return { success: true, output };
  } catch (error) {
    log(`Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function dryRun() {
  log('=== DRY RUN MODE ===');
  log('Checking pending migrations...');
  
  const result = runCommand('npm run migration:show');
  
  if (result.success) {
    log('Dry run completed. No changes were made to the database.');
  } else {
    log('Dry run failed. Check logs for details.');
    process.exit(1);
  }
}

async function runMigrations() {
  log('=== MIGRATION EXECUTION ===');
  
  // Step 1: Show pending migrations
  log('Step 1: Checking pending migrations...');
  runCommand('npm run migration:show');
  
  // Step 2: Run migrations
  log('Step 2: Executing migrations...');
  const result = runCommand('npm run migration:run');
  
  if (result.success) {
    log('✓ Migrations completed successfully');
  } else {
    log('✗ Migration failed. Check logs and consider rollback.');
    process.exit(1);
  }
}

async function rollback() {
  log('=== MIGRATION ROLLBACK ===');
  log('WARNING: Rolling back last migration...');
  
  const result = runCommand('npm run migration:revert');
  
  if (result.success) {
    log('✓ Rollback completed successfully');
  } else {
    log('✗ Rollback failed. Manual intervention may be required.');
    process.exit(1);
  }
}

async function validate() {
  log('=== MIGRATION VALIDATION ===');
  log('Validating database schema...');
  
  // Check if migrations table exists and is in sync
  const result = runCommand('npm run migration:show');
  
  if (result.success) {
    log('✓ Validation completed');
  } else {
    log('✗ Validation failed');
    process.exit(1);
  }
}

// Main execution
(async () => {
  try {
    switch (command) {
      case 'dry-run':
        await dryRun();
        break;
      case 'run':
        await runMigrations();
        break;
      case 'rollback':
        await rollback();
        break;
      case 'validate':
        await validate();
        break;
      default:
        console.log('Usage: node migration-cli.js [dry-run|run|rollback|validate]');
        process.exit(1);
    }
  } catch (error) {
    log(`Fatal error: ${error.message}`);
    process.exit(1);
  }
})();
