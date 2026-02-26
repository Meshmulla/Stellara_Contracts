import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { MigrationValidatorService } from './migration-validator.service';

describe('MigrationValidatorService', () => {
  let service: MigrationValidatorService;
  let mockDataSource: jest.Mocked<DataSource>;

  beforeEach(async () => {
    mockDataSource = {
      query: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [MigrationValidatorService],
    }).compile();

    service = module.get<MigrationValidatorService>(MigrationValidatorService);
  });

  describe('validateColumnExists', () => {
    it('should return true when column exists', async () => {
      mockDataSource.query.mockResolvedValue([{ column_name: 'test_column' }]);

      const result = await service.validateColumnExists(
        mockDataSource,
        'test_table',
        'test_column',
      );

      expect(result).toBe(true);
      expect(mockDataSource.query).toHaveBeenCalledWith(
        expect.stringContaining('information_schema.columns'),
        ['test_table', 'test_column'],
      );
    });

    it('should return false when column does not exist', async () => {
      mockDataSource.query.mockResolvedValue([]);

      const result = await service.validateColumnExists(
        mockDataSource,
        'test_table',
        'nonexistent_column',
      );

      expect(result).toBe(false);
    });
  });

  describe('validateTableExists', () => {
    it('should return true when table exists', async () => {
      mockDataSource.query.mockResolvedValue([{ table_name: 'test_table' }]);

      const result = await service.validateTableExists(
        mockDataSource,
        'test_table',
      );

      expect(result).toBe(true);
    });

    it('should return false when table does not exist', async () => {
      mockDataSource.query.mockResolvedValue([]);

      const result = await service.validateTableExists(
        mockDataSource,
        'nonexistent_table',
      );

      expect(result).toBe(false);
    });
  });

  describe('validateNullableConstraints', () => {
    it('should return valid when no NULL values exist', async () => {
      mockDataSource.query.mockResolvedValue([{ count: 0 }]);

      const result = await service.validateNullableConstraints(
        mockDataSource,
        'test_table',
        'test_column',
      );

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when NULL values exist', async () => {
      mockDataSource.query.mockResolvedValue([{ count: 5 }]);

      const result = await service.validateNullableConstraints(
        mockDataSource,
        'test_table',
        'test_column',
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('5 NULL values');
    });
  });

  describe('preDestructiveMigrationCheck', () => {
    it('should fail when table does not exist', async () => {
      mockDataSource.query.mockResolvedValue([]);

      const result = await service.preDestructiveMigrationCheck(
        mockDataSource,
        'nonexistent_table',
      );

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Table nonexistent_table does not exist');
    });

    it('should fail when column does not exist', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([{ table_name: 'test_table' }])
        .mockResolvedValueOnce([]);

      const result = await service.preDestructiveMigrationCheck(
        mockDataSource,
        'test_table',
        'nonexistent_column',
      );

      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('does not exist');
    });

    it('should pass with warnings when table exists', async () => {
      mockDataSource.query
        .mockResolvedValueOnce([{ table_name: 'test_table' }])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([{ count: 10 }]);

      const result = await service.preDestructiveMigrationCheck(
        mockDataSource,
        'test_table',
      );

      expect(result.valid).toBe(true);
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });
  });
});
