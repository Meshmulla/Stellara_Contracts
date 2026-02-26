import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

@Injectable()
export class MigrationValidatorService {
  private readonly logger = new Logger(MigrationValidatorService.name);

  async validateColumnExists(
    dataSource: DataSource,
    tableName: string,
    columnName: string,
  ): Promise<boolean> {
    const table = await dataSource.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
      [tableName, columnName],
    );
    return table.length > 0;
  }

  async validateTableExists(
    dataSource: DataSource,
    tableName: string,
  ): Promise<boolean> {
    const table = await dataSource.query(
      `SELECT table_name FROM information_schema.tables WHERE table_name = $1`,
      [tableName],
    );
    return table.length > 0;
  }

  async validateForeignKeyConstraints(
    dataSource: DataSource,
    tableName: string,
  ): Promise<ValidationResult> {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };

    const fks = await dataSource.query(
      `SELECT constraint_name FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY' AND table_name = $1`,
      [tableName],
    );

    if (fks.length > 0) {
      result.warnings.push(
        `Table ${tableName} has ${fks.length} foreign key constraint(s)`,
      );
    }

    return result;
  }

  async validateNullableConstraints(
    dataSource: DataSource,
    tableName: string,
    columnName: string,
  ): Promise<ValidationResult> {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };

    const nullCount = await dataSource.query(
      `SELECT COUNT(*) as count FROM "${tableName}" WHERE "${columnName}" IS NULL`,
    );

    if (nullCount[0]?.count > 0) {
      result.errors.push(
        `Column ${columnName} in ${tableName} has ${nullCount[0].count} NULL values`,
      );
      result.valid = false;
    }

    return result;
  }

  async validateDataIntegrity(
    dataSource: DataSource,
    tableName: string,
  ): Promise<ValidationResult> {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };

    const rowCount = await dataSource.query(
      `SELECT COUNT(*) as count FROM "${tableName}"`,
    );

    if (rowCount[0]?.count === 0) {
      result.warnings.push(`Table ${tableName} is empty`);
    } else {
      this.logger.log(`Table ${tableName} has ${rowCount[0].count} rows`);
    }

    return result;
  }

  async preDestructiveMigrationCheck(
    dataSource: DataSource,
    tableName: string,
    columnName?: string,
  ): Promise<ValidationResult> {
    const result: ValidationResult = { valid: true, errors: [], warnings: [] };

    const tableExists = await this.validateTableExists(dataSource, tableName);
    if (!tableExists) {
      result.errors.push(`Table ${tableName} does not exist`);
      result.valid = false;
      return result;
    }

    if (columnName) {
      const columnExists = await this.validateColumnExists(
        dataSource,
        tableName,
        columnName,
      );
      if (!columnExists) {
        result.errors.push(
          `Column ${columnName} does not exist in ${tableName}`,
        );
        result.valid = false;
        return result;
      }
    }

    const fkValidation = await this.validateForeignKeyConstraints(
      dataSource,
      tableName,
    );
    result.warnings.push(...fkValidation.warnings);

    const dataValidation = await this.validateDataIntegrity(
      dataSource,
      tableName,
    );
    result.warnings.push(...dataValidation.warnings);

    return result;
  }
}
