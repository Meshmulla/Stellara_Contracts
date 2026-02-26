# Database Migration Framework - Best Practices Guide

## Overview

This guide provides best practices for creating and managing database migrations in the Stellara backend using our resilient migration framework.

## Migration Safety Framework

### Components

1. **MigrationValidatorService** - Pre-migration validation checks
2. **MigrationBackupService** - Automated backup and restore
3. **MigrationLoggerService** - Observability and tracking
4. **MigrationExecutorService** - Orchestrates safe execution
5. **SafeMigration** - Base class with guard clauses

## Creating Safe Migrations

### Using SafeMigration Base Class

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';
import { SafeMigration } from '../migration-framework/safe-migration.base';

export class AddUserEmailVerification1700000000000
  extends SafeMigration
  implements MigrationInterface
{
  name = 'AddUserEmailVerification1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Safe column addition with guards
    await this.safeAddColumn(
      queryRunner,
      'users',
      'email_verified',
      'BOOLEAN',
      { nullable: false, default: false }
    );

    // Add index
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email_verified" ON "users" ("email_verified")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Safe rollback
    await queryRunner.query(`DROP INDEX "IDX_users_email_verified"`);
    await this.safeDropColumn(queryRunner, 'users', 'email_verified');
  }
}
```

### Destructive Operations

For destructive operations (DROP, RENAME), always use guard clauses:

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // Check before dropping
  await this.guardColumnDrop(queryRunner, 'users', 'old_column');
  
  // Perform operation
  await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "old_column"`);
}
```

## Migration Workflow

### 1. Development Phase

```bash
# Generate migration
npm run migration:generate -- src/database/migrations/YourMigrationName

# Review generated migration
# Add safety guards and validation
```

### 2. Testing Phase

```bash
# Dry run (validation only)
node scripts/migration-cli.js dry-run

# Run in test environment
npm run migration:run

# Test rollback
npm run migration:revert
```

### 3. Staging Deployment

```bash
# Validate before execution
node scripts/migration-cli.js validate

# Execute with logging
node scripts/migration-cli.js run

# Verify success
npm run migration:show
```

### 4. Production Deployment

```bash
# Pre-deployment checklist:
# ✓ Tested in staging
# ✓ Rollback plan documented
# ✓ Backup strategy confirmed
# ✓ Downtime window scheduled (if needed)

# Execute migration
node scripts/migration-cli.js run

# Monitor logs
tail -f migration-execution.log
```

## Rollback Procedures

### Automatic Rollback

```bash
# Rollback last migration
node scripts/migration-cli.js rollback

# Or using npm script
npm run migration:revert
```

### Manual Rollback

If automatic rollback fails:

1. Check migration logs: `migration-execution.log`
2. Identify failed step
3. Execute down() method manually
4. Restore from backup if needed

## Validation Checks

### Pre-Migration Validation

The framework automatically validates:

- ✓ Table existence
- ✓ Column existence
- ✓ Foreign key constraints
- ✓ Data integrity
- ✓ Nullable constraints

### Custom Validation

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // Custom validation
  const hasNulls = await queryRunner.query(
    `SELECT COUNT(*) FROM users WHERE email IS NULL`
  );
  
  if (hasNulls[0].count > 0) {
    throw new Error('Cannot proceed: NULL emails found');
  }
  
  // Continue with migration
}
```

## Backup Strategy

### Automatic Backups

For critical tables, create backups before destructive operations:

```typescript
// Backup is handled automatically by MigrationBackupService
// when using MigrationExecutorService
```

### Manual Backup

```bash
# Backup specific table
pg_dump -t table_name database_name > backup.sql

# Restore if needed
psql database_name < backup.sql
```

## Logging and Observability

### Migration Logs

All migrations are logged to:
- Console output
- `migration-execution.log` file
- `migration_logs` database table

### Log Levels

- **INFO**: Normal execution steps
- **WARN**: Non-critical issues (e.g., column already exists)
- **ERROR**: Critical failures requiring attention

### Querying Logs

```sql
-- View recent migrations
SELECT * FROM migration_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check failed migrations
SELECT * FROM migration_logs 
WHERE status = 'failed';

-- View migration duration
SELECT migration_name, duration 
FROM migration_logs 
WHERE status = 'success'
ORDER BY duration DESC;
```

## Common Patterns

### Adding a Column

```typescript
await this.safeAddColumn(
  queryRunner,
  'table_name',
  'column_name',
  'VARCHAR(255)',
  { nullable: true }
);
```

### Renaming a Column

```typescript
// Step 1: Add new column
await this.safeAddColumn(queryRunner, 'users', 'new_name', 'VARCHAR(255)');

// Step 2: Copy data
await queryRunner.query(
  `UPDATE users SET new_name = old_name WHERE old_name IS NOT NULL`
);

// Step 3: Drop old column (in separate migration)
await this.safeDropColumn(queryRunner, 'users', 'old_name');
```

### Data Transformation

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // Add new column
  await this.safeAddColumn(queryRunner, 'users', 'status', 'VARCHAR(20)');
  
  // Transform data
  await queryRunner.query(
    `UPDATE users SET status = CASE 
      WHEN active = true THEN 'active'
      ELSE 'inactive'
    END`
  );
  
  // Make NOT NULL after data is populated
  await queryRunner.query(
    `ALTER TABLE users ALTER COLUMN status SET NOT NULL`
  );
}
```

## CI/CD Integration

### GitHub Actions Example

```yaml
- name: Run Migration Dry Run
  run: node scripts/migration-cli.js dry-run

- name: Execute Migrations
  run: node scripts/migration-cli.js run
  if: github.ref == 'refs/heads/main'

- name: Verify Migration Success
  run: npm run migration:show
```

## Emergency Procedures

### Migration Stuck

1. Check database locks: `SELECT * FROM pg_locks;`
2. Identify blocking queries
3. Terminate if safe: `SELECT pg_terminate_backend(pid);`
4. Retry migration

### Data Loss Prevention

1. Always test in staging first
2. Create backups before destructive operations
3. Use transactions (automatic with TypeORM)
4. Implement down() methods for all migrations

### Rollback Failed

1. Check error logs
2. Manually execute down() steps
3. Restore from backup table
4. Contact database administrator if needed

## Checklist for Contributors

Before submitting a migration:

- [ ] Migration has both up() and down() methods
- [ ] Extends SafeMigration base class
- [ ] Uses guard clauses for destructive operations
- [ ] Tested in local environment
- [ ] Tested rollback procedure
- [ ] Documented any manual steps required
- [ ] Added to migration documentation
- [ ] Reviewed by team member

## Additional Resources

- TypeORM Migration Docs: https://typeorm.io/migrations
- PostgreSQL Best Practices: https://wiki.postgresql.org/wiki/Don%27t_Do_This
- Database Refactoring: https://databaserefactoring.com/

## Support

For migration issues:
1. Check `migration-execution.log`
2. Review `migration_logs` table
3. Consult this guide
4. Contact backend team lead
