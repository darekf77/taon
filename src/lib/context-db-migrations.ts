//#region imports
import { Helpers, UtilsMigrations, _ } from 'tnp-core/src';
import { BaseMigration } from './base-classes/base-migration';
import type { EndpointContext } from './endpoint-context';
import { Models } from './models';
import { ClassHelpers } from './helpers/class-helpers';
import {
  Column,
  DataSource,
  Entity,
  EntitySchema,
  Index,
  PrimaryGeneratedColumn,
  QueryRunner,
  Table,
  TableColumn,
  TableIndex,
} from 'taon-typeorm/src';
//#endregion

//#region models
export type MigrationStatus = 'completed' | 'pending';

export class ContextDbMigrations {
  //#region fields

  //#region fields / migration table name
  readonly DEFAULT_MIGRATION_TABLE_NAME = 'TAON_MIGRATION_META';
  //#endregion

  //#region fields / migration statuses
  readonly MIGRATION_STATUS_COMPLETED: MigrationStatus = 'completed';
  readonly MIGRATION_STATUS_PENDING: MigrationStatus = 'pending';
  //#endregion

  //#region fields / migration table schema
  readonly table = new Table({
    name: this.DEFAULT_MIGRATION_TABLE_NAME,
    columns: [
      {
        name: 'id',
        type: 'integer',
        isPrimary: true, // Mark it as the primary key
        isGenerated: true, // Enable auto-generation
        generationStrategy: 'increment', // Use auto-increment strategy
      },
      {
        name: 'name',
        type: 'varchar',
        length: '255',
        isUnique: true, // Ensure the name is unique
        isNullable: false, // Ensure this field is required
      },
      {
        // context is a part of name
        name: 'context',
        type: 'varchar',
        length: '255',
        isNullable: false, // Optional context for migrations (e.g., tenant or module name)
      },
      {
        name: 'applied_at',
        type: 'timestamp',
        default: 'CURRENT_TIMESTAMP', // Automatically set the timestamp
        isNullable: true,
      },
      {
        name: 'status',
        type: 'varchar',
        length: '50',
        default: `'${this.MIGRATION_STATUS_COMPLETED}'`,
        isNullable: false,
      },
      // { // TODO not needed for now
      //   name: 'checksum',
      //   type: 'varchar',
      //   length: '64',
      //   isNullable: true, // Optional field to store a hash/checksum of migration file
      // },
    ],
  });
  //#endregion

  //#endregion

  //#region constructor
  constructor(private ctx: EndpointContext) {}
  //#endregion

  //#region methods & getters / make sure migration table exists
  async ensureMigrationTableExists(): Promise<void> {
    //#region @websqlFunc
    if (this.ctx.isRemoteHost || !this.ctx.connection) {
      return;
    }
    const queryRunner = this.ctx.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Check if the table already exists
    const hasTable = await queryRunner.hasTable(
      this.DEFAULT_MIGRATION_TABLE_NAME,
    );
    if (hasTable) {
      this.ctx.logMigrations &&
        console.log(
          `Table ${this.DEFAULT_MIGRATION_TABLE_NAME} already exists.`,
        );
      await queryRunner.commitTransaction();
      await queryRunner.release();
      return; // Exit early if the table exists
    }

    try {
      await queryRunner.createTable(this.table);
      await queryRunner.createIndex(
        this.DEFAULT_MIGRATION_TABLE_NAME,
        new TableIndex({
          name: 'IDX_NAME',
          columnNames: ['name'],
        }),
      );

      await queryRunner.commitTransaction();
    } catch (error) {
      this.ctx.logMigrations &&
        console.error(
          `Transaction failed [ensureMigrationTableExists]` + `, rolling back:`,
          error,
        );
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }

    //#endregion
  }
  //#endregion

  //#region methods & getters / revert migration to timestamp
  private async logSelectALl(name: string, queryRunner: QueryRunner) {
    console.log(
      name,
      (
        await queryRunner.query(
          `SELECT * FROM ${this.DEFAULT_MIGRATION_TABLE_NAME} WHERE context = $1`,
          [this.ctx.contextName],
        )
      ).map(m => m.name),
    );
  }

  async revertMigrationToTimestamp(timestamp: number) {
    //#region @websqlFunc
    if (this.ctx.isRemoteHost || !this.ctx.connection) {
      return;
    }
    if (!UtilsMigrations.isValidTimestamp(timestamp)) {
      Helpers.throw(
        `Invalid timestamp provided for migration revert: ${timestamp}`,
      );
    }

    // Get all migration class functions and reverse the order
    const migrationsClassFns: Function[] = this.ctx
      .getClassFunByArr(Models.ClassType.MIGRATION)
      .reverse();

    // Filter migrations that need to be reverted
    const migrationClassesInstancesToRevert: BaseMigration[] =
      migrationsClassFns
        .map(classFn => {
          const timestampFromClassName = Number(
            UtilsMigrations.getTimestampFromClassName(
              ClassHelpers.getName(classFn),
            ),
          );

          if (timestampFromClassName <= timestamp) {
            // this.ctx.logMigrations &&
            //   console.log(
            //     `Stopping migration filter at: ${ClassHelpers.getName(classFn)} ` +
            //       `with timestamp ${timestampFromClassName}`,
            //   );
            return null;
          }

          return this.ctx.getInstanceBy(classFn as any) as any;
        })
        .filter(f => !!f)
        .map(f => f as BaseMigration)
        .filter(migrationInstance => migrationInstance.isReadyToRun());

    const queryRunner = this.ctx.connection.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      // Fetch applied migrations from the database
      const appliedMigrationsForContext = await queryRunner.query(
        `SELECT name FROM ${this.DEFAULT_MIGRATION_TABLE_NAME}
         WHERE status = $1 AND context = $2`,
        [this.MIGRATION_STATUS_COMPLETED, this.ctx.contextName],
      );

      const appliedMigrationsForContextNames = appliedMigrationsForContext.map(
        m => m.name,
      );
      // console.log({ appliedMigrationsForContextNames });

      for (const migrationClassInstance of migrationClassesInstancesToRevert) {
        const migrationName = ClassHelpers.getName(migrationClassInstance);

        if (!appliedMigrationsForContextNames.includes(migrationName)) {
          this.ctx.logMigrations &&
            console.warn(
              `Skipping migration not marked as applied: ${migrationName}`,
            );
          continue;
        }

        this.ctx.logMigrations &&
          console.log(
            `Reverting migration: ${migrationName} , context: ${this.ctx.contextName}`,
          );
        await migrationClassInstance.down(queryRunner);

        // Remove the reverted migration from the tracking table
        await queryRunner.query(
          `DELETE FROM ${this.DEFAULT_MIGRATION_TABLE_NAME} WHERE name = $1`,
          [migrationName],
        );
      }

      await queryRunner.commitTransaction();
      this.ctx.logMigrations &&
        console.log(
          `Migrations successfully reverted ` +
            `to the specified timestamp ${timestamp} .`,
        );
    } catch (error) {
      this.ctx.logMigrations &&
        console.error('Transaction failed, rolling back:', error);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
    //#endregion
  }
  //#endregion

  //#region methods & getters / clear migration table
  async clearMigrationTable() {
    //#region @websqlFunc
    if (this.ctx.isRemoteHost || !this.ctx.connection) {
      return;
    }
    const queryRunner = this.ctx.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.clearTable(this.DEFAULT_MIGRATION_TABLE_NAME);
      await queryRunner.commitTransaction();
    } catch (error) {
      this.ctx.logMigrations &&
        console.error('Transaction failed, rolling back:', error);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
    //#endregion
  }
  //#endregion

  //#region methods & getters / mark all migrations as applied
  async markAllMigrationsAsApplied() {
    //#region @websqlFunc
    if (this.ctx.isRemoteHost || !this.ctx.connection) {
      return;
    }
    const migrationsClassFns: Function[] = this.ctx.getClassFunByArr(
      Models.ClassType.MIGRATION,
    );

    const migrationClassesInstances: BaseMigration[] = migrationsClassFns
      .map(classFn => this.ctx.getInstanceBy(classFn as any))
      .map(f => f as BaseMigration)
      .filter(migrationInstance => migrationInstance.isReadyToRun());

    const queryRunner = this.ctx.connection.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      // Fetch already applied migrations from the database
      const allMigrationsInDb = await queryRunner.query(
        `SELECT name FROM ${this.DEFAULT_MIGRATION_TABLE_NAME}`,
      );

      const allMigrationInDBNames = allMigrationsInDb.map(m => m.name);

      for (const instance of migrationClassesInstances) {
        const migrationName = ClassHelpers.getName(instance);

        if (allMigrationInDBNames.includes(migrationName)) {
          this.ctx.logMigrations &&
            console.log(`Skipping already applied migration: ${migrationName}`);
          continue;
        }

        this.ctx.logMigrations &&
          console.log(`Marking migration as applied: ${migrationName}`);

        // Insert migration as 'complete' without running
        await queryRunner.query(
          `INSERT INTO ${this.DEFAULT_MIGRATION_TABLE_NAME} (name, status, context, applied_at) ` +
            `VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
          [
            migrationName,
            this.MIGRATION_STATUS_COMPLETED,
            instance.ctx.contextName,
          ],
        );
      }

      // update all pending migrations to completed
      await queryRunner.query(
        `UPDATE ${this.DEFAULT_MIGRATION_TABLE_NAME}
         SET status = $1, applied_at = CURRENT_TIMESTAMP
         WHERE status = $2`,
        [this.MIGRATION_STATUS_COMPLETED, this.MIGRATION_STATUS_PENDING],
      );

      await queryRunner.commitTransaction();
      this.ctx.logMigrations &&
        console.log('All migrations marked as applied.');
    } catch (error) {
      this.ctx.logMigrations &&
        console.error(
          'Failed to mark all migrations as applied, rolling back:',
          error,
        );
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
    //#endregion
  }
  //#endregion

  //#region methods & getters / run all migrations
  async runAllNotCompletedMigrations() {
    //#region @websqlFunc
    if (this.ctx.isRemoteHost || !this.ctx.connection) {
      return;
    }
    const migrationsClassFns: Function[] = this.ctx.getClassFunByArr(
      Models.ClassType.MIGRATION,
    );

    // console.log({
    //   migrationClassesALl: migrationsClassFns.map(f => ClassHelpers.getName(f)),
    // });

    const migrationClassesInstances: BaseMigration[] = migrationsClassFns
      .map(classFn => this.ctx.getInstanceBy(classFn as any))
      .map(f => f as BaseMigration)
      .filter(migrationInstance => migrationInstance.isReadyToRun());

    // console.log({
    //   migrationClassesInstances: migrationsClassFns.map(f =>
    //     ClassHelpers.getName(f),
    //   ),
    // });

    const queryRunner = this.ctx.connection.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

      // Check if the migrations table exists
      // TODO: Implement check for migrations table existence here

      // Fetch applied migrations from the database
      const appliedMigrationsForContext = await queryRunner.query(
        `SELECT name, status FROM ${this.DEFAULT_MIGRATION_TABLE_NAME} ` +
          `WHERE context = $1`,
        [this.ctx.contextName],
      );

      //#region check and update pending migrations
      const pendingMigrationsForContext = appliedMigrationsForContext.filter(
        m => m.status === this.MIGRATION_STATUS_PENDING,
      );

      // Run pending migrations first
      for (const pendingContextMigration of pendingMigrationsForContext) {
        const migrationInstance = migrationClassesInstances.find(
          instance =>
            ClassHelpers.getName(instance) === pendingContextMigration.name,
        );

        if (!migrationInstance) {
          this.ctx.logMigrations &&
            console.warn(
              `Pending migration ${pendingContextMigration.name} not found in loaded migrations.`,
            );
          continue;
        }

        this.ctx.logMigrations &&
          console.log(
            `Completing pending migration: ${pendingContextMigration.name}`,
          );
        await migrationInstance.up(queryRunner);

        // Update migration status to 'complete'
        await queryRunner.query(
          `UPDATE ${this.DEFAULT_MIGRATION_TABLE_NAME}
           SET status = $1, applied_at = CURRENT_TIMESTAMP
           WHERE name = $2`,
          [this.MIGRATION_STATUS_COMPLETED, pendingContextMigration.name],
        );
      }
      //#endregion

      //#region run new migrations
      for (const instance of migrationClassesInstances) {
        const migrationName = ClassHelpers.getName(instance);

        if (appliedMigrationsForContext.some(m => m.name === migrationName)) {
          this.ctx.logMigrations &&
            console.log(`Skipping already applied migration: ${migrationName}`);
          continue;
        }

        this.ctx.logMigrations &&
          console.log(`Applying new migration: ${migrationName}`);
        // Insert migration as 'pending' before execution
        await queryRunner.query(
          `INSERT INTO ${this.DEFAULT_MIGRATION_TABLE_NAME} (name, status, context, applied_at) ` +
            `VALUES ($1, $2, $3, NULL)`,
          [migrationName, this.MIGRATION_STATUS_PENDING, this.ctx.contextName],
        );

        try {
          // Apply migration
          await instance.up(queryRunner);

          // Update migration to 'complete' after successful execution
          await queryRunner.query(
            `UPDATE ${this.DEFAULT_MIGRATION_TABLE_NAME} ` +
              `SET status = '${this.MIGRATION_STATUS_COMPLETED}', applied_at = CURRENT_TIMESTAMP ` +
              `WHERE name = $1`,
            [migrationName],
          );
        } catch (error) {
          this.ctx.logMigrations &&
            console.error(`Failed to apply migration: ${migrationName}`, error);

          // Rollback pending migration entry
          await queryRunner.query(
            `DELETE FROM ${this.DEFAULT_MIGRATION_TABLE_NAME} WHERE name = $1`,
            [migrationName],
          );

          throw error; // Rethrow to ensure the transaction is rolled back
        }
      }

      //#endregion

      await queryRunner.commitTransaction();
    } catch (error) {
      this.ctx.logMigrations &&
        console.error('Transaction failed, rolling back:', error);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
    //#endregion
  }
  //#endregion
}
