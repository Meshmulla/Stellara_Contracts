import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { MigrationLoggerService } from './migration-logger.service';

describe('MigrationLoggerService', () => {
  let service: MigrationLoggerService;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    mockDataSource = {
      query: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [MigrationLoggerService],
    }).compile();

    service = module.get<MigrationLoggerService>(MigrationLoggerService);
  });

  describe('logMigrationStart', () => {
    it('should create a log entry with started status', async () => {
      await service.logMigrationStart('TestMigration');

      const log = service.getMigrationLog('TestMigration');
      expect(log).toBeDefined();
      expect(log?.status).toBe('started');
      expect(log?.migrationName).toBe('TestMigration');
      expect(log?.startTime).toBeInstanceOf(Date);
    });
  });

  describe('logMigrationSuccess', () => {
    it('should update log with success status and duration', async () => {
      await service.logMigrationStart('TestMigration');
      await new Promise((resolve) => setTimeout(resolve, 10));
      await service.logMigrationSuccess('TestMigration', { test: 'data' });

      const log = service.getMigrationLog('TestMigration');
      expect(log?.status).toBe('success');
      expect(log?.endTime).toBeInstanceOf(Date);
      expect(log?.duration).toBeGreaterThan(0);
      expect(log?.metadata).toEqual({ test: 'data' });
    });
  });

  describe('logMigrationFailure', () => {
    it('should update log with failed status and error message', async () => {
      await service.logMigrationStart('TestMigration');
      const error = new Error('Test error');
      await service.logMigrationFailure('TestMigration', error);

      const log = service.getMigrationLog('TestMigration');
      expect(log?.status).toBe('failed');
      expect(log?.errorMessage).toBe('Test error');
      expect(log?.duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('logRollback', () => {
    it('should update log with rolled_back status', async () => {
      await service.logMigrationStart('TestMigration');
      await service.logRollback('TestMigration');

      const log = service.getMigrationLog('TestMigration');
      expect(log?.status).toBe('rolled_back');
    });
  });

  describe('getAllLogs', () => {
    it('should return all migration logs', async () => {
      await service.logMigrationStart('Migration1');
      await service.logMigrationStart('Migration2');

      const logs = service.getAllLogs();
      expect(logs).toHaveLength(2);
      expect(logs.map((l) => l.migrationName)).toContain('Migration1');
      expect(logs.map((l) => l.migrationName)).toContain('Migration2');
    });
  });

  describe('persistLogs', () => {
    it('should create migration_logs table if not exists', async () => {
      mockDataSource.query.mockResolvedValueOnce([]);

      await service.logMigrationStart('TestMigration');
      await service.persistLogs(mockDataSource);

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE migration_logs'),
      );
    });

    it('should insert logs into database', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([{ table_name: 'migration_logs' }])
        .mockResolvedValueOnce(undefined);

      await service.logMigrationStart('TestMigration');
      await service.logMigrationSuccess('TestMigration');
      await service.persistLogs(mockDataSource);

      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO migration_logs'),
        expect.any(Array),
      );
    });
  });
});
