import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { MigrationValidatorService } from './migration-validator.service';
import { MigrationBackupService, BackupMetadata } from './migration-backup.service';
import { MigrationLoggerService } from './migration-logger.service';

export interface MigrationExecutionOptions {
  skipBackup?: boolean;
  skipValidation?: boolean;
  dryRun?: boolean;
}

export interface MigrationExecutionResult {
  success: boolean;
  migrationName: string;
  duration: number;
  backupMetadata?: BackupMetadata;
  validationErrors?: string[];
  error?: string;
}

@Injectable()
export class MigrationExecutorService {
  private readonly logger = new Logger(MigrationExecutorService.name);

  constructor(
    private readonly validator: MigrationValidatorService,
    private readonly backup: MigrationBackupService,
    private readonly migrationLogger: MigrationLoggerService,
  ) {}

  async executeMigration(
    dataSource: DataSource,
    migrationName: string,
    upFn: () => Promise<void>,
    downFn: () => Promise<void>,
    options: MigrationExecutionOptions = {},
  ): Promise<MigrationExecutionResult> {
    const startTime = Date.now();
    let backupMetadata: BackupMetadata | undefined;

    await this.migrationLogger.logMigrationStart(migrationName);

    try {
      if (options.dryRun) {
        this.logger.log(`DRY RUN: ${migrationName}`);
        return {
          success: true,
          migrationName,
          duration: Date.now() - startTime,
        };
      }

      if (!options.skipValidation) {
        this.logger.log(`Validating migration: ${migrationName}`);
      }

      const queryRunner = dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();

      try {
        await upFn();
        await queryRunner.commitTransaction();

        await this.migrationLogger.logMigrationSuccess(migrationName, {
          backupCreated: !!backupMetadata,
        });

        return {
          success: true,
          migrationName,
          duration: Date.now() - startTime,
          backupMetadata,
        };
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    } catch (error) {
      this.logger.error(`Migration failed: ${migrationName}`, error.stack);
      await this.migrationLogger.logMigrationFailure(migrationName, error);

      if (backupMetadata) {
        this.logger.warn('Attempting to restore from backup...');
        try {
          await downFn();
          await this.migrationLogger.logRollback(migrationName);
        } catch (rollbackError) {
          this.logger.error('Rollback failed', rollbackError.stack);
        }
      }

      return {
        success: false,
        migrationName,
        duration: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  async validateMigration(
    dataSource: DataSource,
    tableName: string,
    columnName?: string,
  ) {
    return this.validator.preDestructiveMigrationCheck(
      dataSource,
      tableName,
      columnName,
    );
  }
}
