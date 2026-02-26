# Database Migration Framework

## Overview

The Stellara backend includes a resilient, production-safe database migration framework that ensures schema changes are executed with validation, backup safeguards, and reliable rollback strategies.

## Quick Start

### Create a Safe Migration

```bash
# Generate migration
npm run migration:generate -- src/database/migrations/YourMigrationName
```

Edit the generated migration to extend `SafeMigration`:

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';
import { SafeMigration } from '../migration-framework/safe-migration.base';

export class YourMigration1700000000000
  extends SafeMigration
  implements MigrationInterface
{
  name = 'YourMigration1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.safeAddColumn(
      queryRunner,
      'users',
      'email_verified',
      'BOOLEAN',
      { nullable: false, default: false }
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.safeDropColumn(queryRunner, 'users', 'email_verified');
  }
}
```

### Run Migrations

```bash
# Dry run (validation only)
npm run migration:dry-run

# Execute with safety checks
npm run migration:safe-run

# Rollback if needed
npm run migration:rollback

# Show migration status
npm run migration:show
```

## Features

✅ **Pre-Migration Validation** - Automated checks for data integrity, constraints, and foreign keys  
✅ **Backup & Restore** - Automatic table-level backups before destructive operations  
✅ **Rollback Support** - Explicit down() implementations with transaction safety  
✅ **Observability** - Comprehensive logging and metrics for all migrations  
✅ **CI/CD Integration** - Dry-run validation in deployment pipelines  
✅ **Guard Clauses** - Built-in safety checks for destructive operations  

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run migration:dry-run` | Validate migrations without executing |
| `npm run migration:validate` | Check migration status and integrity |
| `npm run migration:safe-run` | Execute migrations with full logging |
| `npm run migration:rollback` | Rollback last migration safely |
| `npm run migration:run` | Standard TypeORM migration run |
| `npm run migration:revert` | Standard TypeORM migration revert |
| `npm run migration:show` | Show migration status |
| `npm run migration:generate` | Generate new migration |

## Documentation

- **[Best Practices Guide](docs/MIGRATION_BEST_PRACTICES.md)** - Comprehensive guide with examples
- **[Quick Reference](docs/MIGRATION_QUICK_REFERENCE.md)** - Command cheat sheet
- **[Framework README](src/database/migration-framework/README.md)** - Technical details
- **[Implementation Summary](docs/MIGRATION_FRAMEWORK_SUMMARY.md)** - Complete overview

## Components

- **MigrationValidatorService** - Pre-migration validation checks
- **MigrationBackupService** - Backup and restore functionality
- **MigrationLoggerService** - Observability and tracking
- **MigrationExecutorService** - Orchestrates safe execution
- **SafeMigration** - Base class with guard clauses

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
SELECT * FROM migration_logs ORDER BY created_at DESC LIMIT 10;
```

## Emergency Procedures

If a migration fails:

1. Check logs: `migration-execution.log`
2. Review error in `migration_logs` table
3. Execute rollback: `npm run migration:rollback`
4. Restore from backup if needed

## Testing

All migration framework components are fully tested:

```bash
npm test -- migration-framework
```

```
Test Suites: 3 passed, 3 total
Tests:       22 passed, 22 total
```

## Support

For migration issues:
1. Check `migration-execution.log`
2. Review `migration_logs` table
3. Consult [Best Practices Guide](docs/MIGRATION_BEST_PRACTICES.md)
4. Contact backend team
