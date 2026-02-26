import { MigrationInterface, QueryRunner } from 'typeorm';
import { SafeMigration } from '../migration-framework/safe-migration.base';

export class ExampleSafeMigration1700000000000
  extends SafeMigration
  implements MigrationInterface
{
  name = 'ExampleSafeMigration1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    this.logger.log('Starting safe migration example');

    // Example: Add a new column safely
    await this.safeAddColumn(
      queryRunner,
      'users',
      'email_verified',
      'BOOLEAN',
      { nullable: true, default: false },
    );

    // Example: Check before dropping
    const tableExists = await this.tableExists(queryRunner, 'old_table');
    if (tableExists) {
      await this.guardTableDrop(queryRunner, 'old_table');
      // await queryRunner.query(`DROP TABLE "old_table"`);
    }

    this.logger.log('Migration completed successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    this.logger.log('Rolling back safe migration example');

    await this.safeDropColumn(queryRunner, 'users', 'email_verified');

    this.logger.log('Rollback completed');
  }
}
