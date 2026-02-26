# Migration Framework - Quick Reference

## 🚀 Quick Commands

```bash
# Dry run (validation only)
npm run migration:dry-run

# Execute migrations safely
npm run migration:safe-run

# Rollback last migration
npm run migration:rollback

# Validate migration status
npm run migration:validate

# Show migration status
npm run migration:show

# Standard TypeORM commands
npm run migration:run
npm run migration:revert
npm run migration:generate -- src/database/migrations/MigrationName
```

## 📝 Create Safe Migration

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';
import { SafeMigration } from '../migration-framework/safe-migration.base';

export class YourMigration1700000000000
  extends SafeMigration
  implements MigrationInterface
{
  name = 'YourMigration1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add column safely
    await this.safeAddColumn(
      queryRunner,
      'table_name',
      'column_name',
      'VARCHAR(255)',
      { nullable: true }
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback
    await this.safeDropColumn(queryRunner, 'table_name', 'column_name');
  }
}
```

## 🛡️ Guard Methods

```typescript
// Check if column exists
await this.columnExists(queryRunner, 'table', 'column');

// Check if table exists
await this.tableExists(queryRunner, 'table');

// Guard before dropping column
await this.guardColumnDrop(queryRunner, 'table', 'column');

// Guard before dropping table
await this.guardTableDrop(queryRunner, 'table');

// Safe add column
await this.safeAddColumn(queryRunner, 'table', 'column', 'TYPE', options);

// Safe drop column
await this.safeDropColumn(queryRunner, 'table', 'column');
```

## 📊 View Logs

```sql
-- Recent migrations
SELECT * FROM migration_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Failed migrations
SELECT * FROM migration_logs 
WHERE status = 'failed';

-- Migration duration
SELECT migration_name, duration 
FROM migration_logs 
WHERE status = 'success'
ORDER BY duration DESC;
```

## 🔍 File Locations

- **Framework**: `src/database/migration-framework/`
- **Migrations**: `src/database/migrations/`
- **CLI Tool**: `scripts/migration-cli.js`
- **Logs**: `migration-execution.log`
- **Docs**: `docs/MIGRATION_BEST_PRACTICES.md`

## ✅ Pre-Deployment Checklist

- [ ] Migration tested locally
- [ ] Rollback tested
- [ ] Dry-run executed
- [ ] Reviewed by team member
- [ ] Backup strategy confirmed
- [ ] Documentation updated

## 🆘 Emergency Rollback

```bash
# Immediate rollback
npm run migration:rollback

# Check status
npm run migration:show

# View logs
cat migration-execution.log
```

## 📚 Documentation

- Full Guide: `docs/MIGRATION_BEST_PRACTICES.md`
- Framework README: `src/database/migration-framework/README.md`
- Implementation Summary: `docs/MIGRATION_FRAMEWORK_SUMMARY.md`
