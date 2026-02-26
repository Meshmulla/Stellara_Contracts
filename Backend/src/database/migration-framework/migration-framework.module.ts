import { Module } from '@nestjs/common';
import { MigrationValidatorService } from './migration-validator.service';
import { MigrationBackupService } from './migration-backup.service';
import { MigrationLoggerService } from './migration-logger.service';
import { MigrationExecutorService } from './migration-executor.service';

@Module({
  providers: [
    MigrationValidatorService,
    MigrationBackupService,
    MigrationLoggerService,
    MigrationExecutorService,
  ],
  exports: [
    MigrationValidatorService,
    MigrationBackupService,
    MigrationLoggerService,
    MigrationExecutorService,
  ],
})
export class MigrationFrameworkModule {}
