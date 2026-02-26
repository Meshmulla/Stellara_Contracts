import { MigrationInterface, QueryRunner } from 'typeorm';
import { Logger } from '@nestjs/common';

export abstract class SafeMigration implements MigrationInterface {
  protected readonly logger = new Logger(this.constructor.name);
  abstract name: string;

  abstract up(queryRunner: QueryRunner): Promise<void>;
  abstract down(queryRunner: QueryRunner): Promise<void>;

  protected async columnExists(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<boolean> {
    const result = await queryRunner.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND column_name = $2`,
      [tableName, columnName],
    );
    return result.length > 0;
  }

  protected async tableExists(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<boolean> {
    const result = await queryRunner.query(
      `SELECT table_name FROM information_schema.tables WHERE table_name = $1`,
      [tableName],
    );
    return result.length > 0;
  }

  protected async guardColumnDrop(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<void> {
    const exists = await this.columnExists(queryRunner, tableName, columnName);
    if (!exists) {
      this.logger.warn(
        `Column ${columnName} does not exist in ${tableName}, skipping drop`,
      );
      return;
    }

    const hasData = await queryRunner.query(
      `SELECT COUNT(*) as count FROM "${tableName}" WHERE "${columnName}" IS NOT NULL`,
    );

    if (hasData[0]?.count > 0) {
      this.logger.warn(
        `Column ${columnName} in ${tableName} has ${hasData[0].count} non-null values`,
      );
    }
  }

  protected async guardTableDrop(
    queryRunner: QueryRunner,
    tableName: string,
  ): Promise<void> {
    const exists = await this.tableExists(queryRunner, tableName);
    if (!exists) {
      this.logger.warn(`Table ${tableName} does not exist, skipping drop`);
      return;
    }

    const rowCount = await queryRunner.query(
      `SELECT COUNT(*) as count FROM "${tableName}"`,
    );

    if (rowCount[0]?.count > 0) {
      this.logger.warn(
        `Table ${tableName} has ${rowCount[0].count} rows that will be deleted`,
      );
    }
  }

  protected async safeAddColumn(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
    columnType: string,
    options: { nullable?: boolean; default?: any } = {},
  ): Promise<void> {
    const exists = await this.columnExists(queryRunner, tableName, columnName);
    if (exists) {
      this.logger.warn(
        `Column ${columnName} already exists in ${tableName}, skipping`,
      );
      return;
    }

    const nullable = options.nullable !== false ? 'NULL' : 'NOT NULL';
    const defaultValue = options.default ? `DEFAULT ${options.default}` : '';

    await queryRunner.query(
      `ALTER TABLE "${tableName}" ADD COLUMN "${columnName}" ${columnType} ${nullable} ${defaultValue}`,
    );
    this.logger.log(`Added column ${columnName} to ${tableName}`);
  }

  protected async safeDropColumn(
    queryRunner: QueryRunner,
    tableName: string,
    columnName: string,
  ): Promise<void> {
    await this.guardColumnDrop(queryRunner, tableName, columnName);
    await queryRunner.query(
      `ALTER TABLE "${tableName}" DROP COLUMN IF EXISTS "${columnName}"`,
    );
    this.logger.log(`Dropped column ${columnName} from ${tableName}`);
  }
}
