import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export interface BackupMetadata {
  timestamp: string;
  tableName: string;
  rowCount: number;
  backupPath: string;
}

@Injectable()
export class MigrationBackupService {
  private readonly logger = new Logger(MigrationBackupService.name);
  private readonly backupDir = path.join(process.cwd(), 'backups', 'migrations');

  constructor() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  async backupTable(
    dataSource: DataSource,
    tableName: string,
  ): Promise<BackupMetadata> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupTableName = `${tableName}_backup_${timestamp}`;

    this.logger.log(`Creating backup of table ${tableName} as ${backupTableName}`);

    await dataSource.query(
      `CREATE TABLE "${backupTableName}" AS SELECT * FROM "${tableName}"`,
    );

    const rowCount = await dataSource.query(
      `SELECT COUNT(*) as count FROM "${backupTableName}"`,
    );

    const metadata: BackupMetadata = {
      timestamp,
      tableName,
      rowCount: rowCount[0]?.count || 0,
      backupPath: backupTableName,
    };

    this.logger.log(
      `Backup created: ${backupTableName} with ${metadata.rowCount} rows`,
    );

    return metadata;
  }

  async restoreFromBackup(
    dataSource: DataSource,
    backupTableName: string,
    targetTableName: string,
  ): Promise<void> {
    this.logger.warn(
      `Restoring ${targetTableName} from backup ${backupTableName}`,
    );

    await dataSource.query(`TRUNCATE TABLE "${targetTableName}" CASCADE`);
    await dataSource.query(
      `INSERT INTO "${targetTableName}" SELECT * FROM "${backupTableName}"`,
    );

    this.logger.log(`Restore completed for ${targetTableName}`);
  }

  async cleanupBackup(
    dataSource: DataSource,
    backupTableName: string,
  ): Promise<void> {
    this.logger.log(`Cleaning up backup table ${backupTableName}`);
    await dataSource.query(`DROP TABLE IF EXISTS "${backupTableName}"`);
  }

  async listBackups(dataSource: DataSource): Promise<string[]> {
    const tables = await dataSource.query(
      `SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%_backup_%'`,
    );
    return tables.map((t) => t.table_name);
  }
}
