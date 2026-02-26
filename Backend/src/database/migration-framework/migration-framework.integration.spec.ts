import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { MigrationExecutorService } from './migration-executor.service';
import { MigrationValidatorService } from './migration-validator.service';
import { MigrationBackupService } from './migration-backup.service';
import { MigrationLoggerService } from './migration-logger.service';

describe('Migration Framework Integration', () => {
  let executor: MigrationExecutorService;
  let validator: MigrationValidatorService;
  let backup: MigrationBackupService;
  let logger: MigrationLoggerService;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    mockDataSource = {
      query: jest.fn(),
      createQueryRunner: jest.fn().mockReturnValue({
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MigrationExecutorService,
        MigrationValidatorService,
        MigrationBackupService,
        MigrationLoggerService,
      ],
    }).compile();

    executor = module.get<MigrationExecutorService>(MigrationExecutorService);
    validator = module.get<MigrationValidatorService>(MigrationValidatorService);
    backup = module.get<MigrationBackupService>(MigrationBackupService);
    logger = module.get<MigrationLoggerService>(MigrationLoggerService);
  });

  describe('Complete Migration Flow', () => {
    it('should execute migration with validation and logging', async () => {
      const upFn = jest.fn().mockResolvedValue(undefined);
      const downFn = jest.fn().mockResolvedValue(undefined);

      const result = await executor.executeMigration(
        mockDataSource,
        'TestMigration',
        upFn,
        downFn,
        { skipBackup: true, skipValidation: true },
      );

      expect(result.success).toBe(true);
      expect(result.migrationName).toBe('TestMigration');
      expect(upFn).toHaveBeenCalled();
      expect(result.duration).toBeGreaterThanOrEqual(0);
    });

    it('should rollback on migration failure', async () => {
      const upFn = jest.fn().mockRejectedValue(new Error('Migration failed'));
      const downFn = jest.fn().mockResolvedValue(undefined);

      const result = await executor.executeMigration(
        mockDataSource,
        'FailingMigration',
        upFn,
        downFn,
        { skipBackup: true, skipValidation: true },
      );

      expect(result.success).toBe(false);
      expect(result.error).toBe('Migration failed');
    });

    it('should skip execution in dry-run mode', async () => {
      const upFn = jest.fn();
      const downFn = jest.fn();

      const result = await executor.executeMigration(
        mockDataSource,
        'DryRunMigration',
        upFn,
        downFn,
        { dryRun: true },
      );

      expect(result.success).toBe(true);
      expect(upFn).not.toHaveBeenCalled();
      expect(downFn).not.toHaveBeenCalled();
    });
  });

  describe('Validation Integration', () => {
    it('should validate before destructive operations', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([{ table_name: 'test_table' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: 100 }]);

      const result = await executor.validateMigration(
        mockDataSource,
        'test_table',
      );

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Logging Integration', () => {
    it('should track migration lifecycle', async () => {
      await logger.logMigrationStart('TestMigration');
      await logger.logMigrationSuccess('TestMigration');

      const log = logger.getMigrationLog('TestMigration');
      expect(log?.status).toBe('success');
      expect(log?.duration).toBeGreaterThanOrEqual(0);
    });

    it('should persist logs to database', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      await logger.logMigrationStart('TestMigration');
      await logger.logMigrationSuccess('TestMigration');
      await logger.persistLogs(mockDataSource);

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE migration_logs'),
      );
    });
  });
});
