# Database Migration Framework

## Overview

A resilient, production-safe database migration framework for the Stellara backend that ensures schema changes are executed with validation, backup safeguards, and reliable rollback strategies.

## Features

✅ **Pre-Migration Validation** - Automated checks for data integrity, constraints, and foreign keys  
✅ **Backup & Restore** - Automatic table-level backups before destructive operations  
✅ **Rollback Support** - Explicit down() implementations with transaction safety  
✅ **Observability** - Comprehensive logging and metrics for all migrations  
✅ **CI/CD Integration** - Dry-run validation in deployment pipelines  
✅ **Guard Clauses** - Built-in safety checks for destructive operations  

## Quick Start

### 1. Create a Safe Migration

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';
import { SafeMigration } from '../migration-framework/safe-migration.base';

export class AddUserPreferences1700000000000
  extends SafeMigration
  implements MigrationInterface
{
  name = 'AddUserPreferences1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.safeAddColumn(
      queryRunner,
      'users',
      'preferences',
      'JSONB',
      { nullable: true, default: "'{}'" }
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.safeDropColumn(queryRunner, 'users', 'preferences');
  }
}
```

### 2. Run Migration with Validation

```bash
# Dry run (validation only)
npm run migration:dry-run

# Execute with safety checks
npm run migration:safe-run

# Standard TypeORM run
npm run migration:run
```

### 3. Rollback if Needed

```bash
# Safe rollback with logging
npm run migration:rollback

# Standard TypeORM revert
npm run migration:revert
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run migration:generate` | Generate new migration from entity changes |
| `npm run migration:dry-run` | Validate migrations without executing |
| `npm run migration:validate` | Check migration status and integrity |
| `npm run migration:safe-run` | Execute migrations with full logging |
| `npm run migration:rollback` | Rollback last migration safely |
| `npm run migration:run` | Standard TypeORM migration run |
| `npm run migration:revert` | Standard TypeORM migration revert |
| `npm run migration:show` | Show migration status |

## Components

### MigrationValidatorService

Performs pre-migration validation checks:
- Table and column existence
- Foreign key constraints
- Nullable constraints
- Data integrity

### MigrationBackupService

Handles backup and restore operations:
- Table-level snapshots
- Backup metadata tracking
- Restore from backup
- Cleanup utilities

### MigrationLoggerService

Provides observability:
- Migration execution logs
- Success/failure tracking
- Duration metrics
- Persistent log storage

### MigrationExecutorService

Orchestrates safe execution:
- Validation before execution
- Automatic backup creation
- Transaction management
- Rollback on failure

### SafeMigration Base Class

Provides guard clauses and utilities:
- `safeAddColumn()` - Add column with existence check
- `safeDropColumn()` - Drop column with data warning
- `guardColumnDrop()` - Validate before dropping
- `guardTableDrop()` - Validate before dropping table
- `columnExists()` - Check column existence
- `tableExists()` - Check table existence

## Usage Examples

### Adding a Column

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  await this.safeAddColumn(
    queryRunner,
    'users',
    'email_verified',
    'BOOLEAN',
    { nullable: false, default: false }
  );
}
```

### Dropping a Column (with guards)

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  await this.guardColumnDrop(queryRunner, 'users', 'old_column');
  await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "old_column"`);
}
```

### Renaming a Column (safe pattern)

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // Step 1: Add new column
  await this.safeAddColumn(queryRunner, 'users', 'full_name', 'VARCHAR(255)');
  
  // Step 2: Copy data
  await queryRunner.query(
    `UPDATE users SET full_name = name WHERE name IS NOT NULL`
  );
  
  // Step 3: Drop old column (in separate migration)
  // await this.safeDropColumn(queryRunner, 'users', 'name');
}
```

### Data Transformation

```typescript
public async up(queryRunner: QueryRunner): Promise<void> {
  // Add new column
  await this.safeAddColumn(queryRunner, 'users', 'status', 'VARCHAR(20)');
  
  // Transform data
  await queryRunner.query(`
    UPDATE users SET status = CASE 
      WHEN active = true THEN 'active'
      ELSE 'inactive'
    END
  `);
  
  // Make NOT NULL after data is populated
  await queryRunner.query(
    `ALTER TABLE users ALTER COLUMN status SET NOT NULL`
  );
}
```

## CI/CD Integration

The framework includes GitHub Actions workflow for automated validation:

```yaml
# .github/workflows/migration-ci.yml
- name: Run migration dry-run
  run: npm run migration:dry-run

- name: Execute migrations
  run: npm run migration:safe-run
```

## Logging

All migrations are logged to:
- **Console**: Real-time output
- **File**: `migration-execution.log`
- **Database**: `migration_logs` table

Query logs:
```sql
-- View recent migrations
SELECT * FROM migration_logs ORDER BY created_at DESC LIMIT 10;

-- Check failed migrations
SELECT * FROM migration_logs WHERE status = 'failed';
```

## Best Practices

1. **Always extend SafeMigration** for built-in guards
2. **Implement down() methods** for all migrations
3. **Test in staging** before production
4. **Use dry-run** in CI/CD pipelines
5. **Document manual steps** if required
6. **Review backup strategy** for critical tables
7. **Monitor logs** during execution

## Emergency Procedures

### Migration Failed

1. Check logs: `migration-execution.log`
2. Review error in `migration_logs` table
3. Execute rollback: `npm run migration:rollback`
4. Restore from backup if needed

### Rollback Failed

1. Check error logs
2. Manually execute down() steps
3. Restore from backup table
4. Contact database administrator

## Documentation

- [Migration Best Practices](../../docs/MIGRATION_BEST_PRACTICES.md) - Comprehensive guide
- [TypeORM Migrations](https://typeorm.io/migrations) - Official docs

## Support

For issues or questions:
1. Check `migration-execution.log`
2. Review `migration_logs` table
3. Consult best practices guide
4. Contact backend team
