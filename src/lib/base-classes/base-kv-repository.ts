//#region imports
import { MemorySync } from 'tnp-core/src'; // @backend
import { Helpers, _, path } from 'tnp-core/src';
import { Low } from 'tnp-core/src'; // @backend
import { JSONFilePreset } from 'tnp-core/src'; // @backend

import { TaonController } from '../decorators/classes/controller-decorator';
import { TaonRepository } from '../decorators/classes/repository-decorator';

import { TaonBaseController } from './base-controller';
import { TaonBaseCustomRepository } from './base-custom-repository';
import { TaonBaseRepository } from './base-repository';
import { ClassHelpers } from '../helpers/class-helpers';
//#endregion

type KvLowDbShape<KV extends Record<string, any>> = KV & {
  __kvMeta?: {
    expirations?: Record<string, number>;
  };
};

export const KVexpirationsDbMetaKey = '__kvMeta.expirations';

/**
 * Please override property entityClassFn with entity class.
 */
@TaonRepository({ className: 'TaonBaseKvRepository' })
export abstract class TaonBaseKvRepository<
  KV extends Record<string, any> = Record<string, any>,
> extends TaonBaseCustomRepository {
  //#region lowdb for development
  //#region @backend
  private lowDB: Low<KvLowDbShape<KV>>;

  private defaultDb = {} as KvLowDbShape<KV>;

  protected useInMemoryDB(): boolean {
    return false;
  }

  public get jsonDbLocation() {
    //#region @backendFunc
    return this.ctx.kvDbJsonLocationForClass(ClassHelpers.getName(this));
    //#endregion
  }

  protected async getConnection(): Promise<Low<KvLowDbShape<KV>>> {
    //#region @backendFunc]
    if (!this.lowDB) {
      //#region initialize connection
      let dbLocation: string;

      if (!this.useInMemoryDB()) {
        dbLocation = this.jsonDbLocation;

        if (!Helpers.exists(path.dirname(dbLocation))) {
          Helpers.mkdirp(path.dirname(dbLocation));
        }
      }

      if (this.useInMemoryDB()) {
        this.ctx.logDb && console.log(`USING IN MEMORY DB FROM`);
      } else {
        this.ctx.logDb && console.log(`USING KV DB FROM ${dbLocation}`);
      }

      const startegy: typeof JSONFilePreset = this.useInMemoryDB()
        ? (MemorySync as any)
        : JSONFilePreset;

      try {
        this.lowDB = await startegy<KvLowDbShape<KV>>(
          dbLocation,
          this.defaultDb,
        );
      } catch (error) {
        console.error(error);
        Helpers.error(
          `[taon-helpers] Cannot use db.json file for projects in location, restoring default db.`,
          true,
          true,
        );
        if (!this.useInMemoryDB()) {
          Helpers.writeJson(dbLocation, this.defaultDb);
        }

        this.lowDB = await startegy<KvLowDbShape<KV>>(
          dbLocation,
          this.defaultDb,
        );
      }

      _.set(
        this.lowDB.data,
        KVexpirationsDbMetaKey,
        _.get(this.lowDB.data, KVexpirationsDbMetaKey, {}),
      );
      //#endregion
    }

    if (!this.useInMemoryDB()) {
      await this.lowDB.read();
    }
    return this.lowDB;
    //#endregion
  }
  //#endregion
  //#endregion

  //#region private helpers
  private normalizeKey(key: keyof KV): string {
    return `${String(key)}`;
  }

  private expirationPath(key: keyof KV): string {
    return `${KVexpirationsDbMetaKey}.${this.normalizeKey(key)}`;
  }

  private async getExpirationTimestamp<K extends keyof KV>(
    key: K,
  ): Promise<number | undefined> {
    //#region @backendFunc
    const connection = await this.getConnection();
    const expiresAt = _.get(connection.data, this.expirationPath(key));
    return typeof expiresAt === 'number' ? expiresAt : undefined;
    //#endregion
  }

  private async cleanupIfExpired<K extends keyof KV>(key: K): Promise<boolean> {
    //#region @backendFunc
    const connection = await this.getConnection();
    const expiresAt = _.get(connection.data, this.expirationPath(key));

    if (!_.isNumber(expiresAt) || Date.now() < expiresAt) {
      return false;
    }

    _.unset(connection.data, this.normalizeKey(key));
    _.unset(connection.data, this.expirationPath(key));
    await connection.write();

    return true;
    //#endregion
  }

  //#endregion

  async set<K extends keyof KV>(key: K, value: KV[K]): Promise<void> {
    //#region @backendFunc
    const connection = await this.getConnection();
    _.set(connection.data, this.normalizeKey(key), value);

    // overwrite should remove previous expiration unless expire() is called again
    _.unset(connection.data, this.expirationPath(key));

    await connection.write();
    //#endregion
  }

  async get<K extends keyof KV>(key: K): Promise<KV[K] | undefined> {
    //#region @backendFunc
    const expired = await this.cleanupIfExpired(key);
    if (expired) {
      return undefined;
    }

    const connection = await this.getConnection();
    return _.get(connection.data, this.normalizeKey(key)) as KV[K] | undefined;
    //#endregion
  }

  async delete<K extends keyof KV>(key: K): Promise<void> {
    //#region @backendFunc
    const connection = await this.getConnection();
    _.unset(connection.data, this.normalizeKey(key));
    _.unset(connection.data, this.expirationPath(key));
    await connection.write();
    //#endregion
  }

  async has<K extends keyof KV>(key: K): Promise<boolean> {
    //#region @backendFunc
    const expired = await this.cleanupIfExpired(key);
    if (expired) {
      return false;
    }

    const connection = await this.getConnection();
    return _.has(connection.data, this.normalizeKey(key));
    //#endregion
  }

  async expire<K extends keyof KV>(key: K, ttlSeconds: number): Promise<void> {
    //#region @backendFunc
    const connection = await this.getConnection();

    if (!_.has(connection.data, this.normalizeKey(key))) {
      return;
    }

    const expiresAt = Date.now() + ttlSeconds * 1000;
    _.set(connection.data, this.expirationPath(key), expiresAt);

    await connection.write();
    //#endregion
  }

  async ttl<K extends keyof KV>(key: K): Promise<number | undefined> {
    //#region @backendFunc
    const expired = await this.cleanupIfExpired(key);
    if (expired) {
      return undefined;
    }

    const connection = await this.getConnection();

    if (!_.has(connection.data, this.normalizeKey(key))) {
      return undefined;
    }

    const expiresAt = _.get(connection.data, this.expirationPath(key));

    if (!_.isNumber(expiresAt)) {
      return undefined;
    }

    const diffMs = expiresAt - Date.now();

    if (diffMs <= 0) {
      await this.delete(key);
      return undefined;
    }

    return Math.ceil(diffMs / 1000);
    //#endregion
  }

  async getAllData(): Promise<Partial<KV>> {
    //#region @backendFunc
    const connection = await this.getConnection();

    const expirations = _.get(
      connection.data,
      KVexpirationsDbMetaKey,
      {},
    ) as Record<string, number>;

    let changed = false;
    const now = Date.now();

    for (const [key, expiresAt] of Object.entries(expirations)) {
      if (_.isNumber(expiresAt) && now >= expiresAt) {
        _.unset(connection.data, key);
        _.unset(connection.data, `${KVexpirationsDbMetaKey}.${key}`);
        changed = true;
      }
    }

    if (changed) {
      await connection.write();
    }

    const data = _.cloneDeep(connection.data || {});
    delete (data as any).__kvMeta;

    return data as Partial<KV>;
    //#endregion
  }
}
