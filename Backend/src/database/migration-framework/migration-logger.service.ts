import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

export interface MigrationLog {
  migrationName: string;
  status: 'started' | 'success' | 'failed' | 'rolled_back';
  startTime: Date;
  endTime?: Date;
  duration?: number;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class MigrationLoggerService {
  private readonly logger = new Logger(MigrationLoggerService.name);
  private logs: Map<string, MigrationLog> = new Map();

  async logMigrationStart(migrationName: string): Promise<void> {
    const log: MigrationLog = {
      migrationName,
      status: 'started',
      startTime: new Date(),
    };

    this.logs.set(migrationName, log);
    this.logger.log(`Migration started: ${migrationName}`);
  }

  async logMigrationSuccess(
    migrationName: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const log = this.logs.get(migrationName);
    if (log) {
      log.status = 'success';
      log.endTime = new Date();
      log.duration = log.endTime.getTime() - log.startTime.getTime();
      log.metadata = metadata;

      this.logger.log(
        `Migration completed: ${migrationName} (${log.duration}ms)`,
      );
    }
  }

  async logMigrationFailure(
    migrationName: string,
    error: Error,
  ): Promise<void> {
    const log = this.logs.get(migrationName);
    if (log) {
      log.status = 'failed';
      log.endTime = new Date();
      log.duration = log.endTime.getTime() - log.startTime.getTime();
      log.errorMessage = error.message;

      this.logger.error(
        `Migration failed: ${migrationName} - ${error.message}`,
        error.stack,
      );
    }
  }

  async logRollback(migrationName: string): Promise<void> {
    const log = this.logs.get(migrationName);
    if (log) {
      log.status = 'rolled_back';
      this.logger.warn(`Migration rolled back: ${migrationName}`);
    }
  }

  async persistLogs(dataSource: DataSource): Promise<void> {
    const tableExists = await dataSource.query(
      `SELECT table_name FROM information_schema.tables WHERE table_name = 'migration_logs'`,
    );

    if (tableExists.length === 0) {
      await dataSource.query(`
        CREATE TABLE migration_logs (
          id SERIAL PRIMARY KEY,
          migration_name VARCHAR(255) NOT NULL,
          status VARCHAR(50) NOT NULL,
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP,
          duration INTEGER,
          error_message TEXT,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
    }

    for (const [name, log] of this.logs.entries()) {
      await dataSource.query(
        `INSERT INTO migration_logs (migration_name, status, start_time, end_time, duration, error_message, metadata) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          log.migrationName,
          log.status,
          log.startTime,
          log.endTime,
          log.duration,
          log.errorMessage,
          JSON.stringify(log.metadata || {}),
        ],
      );
    }

    this.logger.log(`Persisted ${this.logs.size} migration logs`);
  }

  getMigrationLog(migrationName: string): MigrationLog | undefined {
    return this.logs.get(migrationName);
  }

  getAllLogs(): MigrationLog[] {
    return Array.from(this.logs.values());
  }
}
