//#region imports
import { _, Helpers, path } from 'tnp-core/src';
import { Low } from 'tnp-core/src'; // @backend
import { JSONFilePreset } from 'tnp-core/src'; // @backend

import { TaonController } from '../decorators/classes/controller-decorator';
import { TaonRepository } from '../decorators/classes/repository-decorator';

import { TaonBaseController } from './base-controller';
import { TaonBaseCustomRepository } from './base-custom-repository';
import { TaonBaseRepository } from './base-repository';
//#endregion

type KvLowDbShape<KV extends Record<string, any>> = KV & {
  __kvMeta?: {
    expirations?: Record<string, number>;
  };
};

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

  public async getConnection(): Promise<Low<KvLowDbShape<KV>>> {
    //#region @backendFunc
    const dbLocation = this.ctx.kvDbJsonLocation;
    if (!Helpers.exists(path.dirname(dbLocation))) {
      Helpers.mkdirp(path.dirname(dbLocation));
    }
    try {
      this.lowDB = await JSONFilePreset<KvLowDbShape<KV>>(
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
      Helpers.writeJson(dbLocation, this.defaultDb);
      this.lowDB = await JSONFilePreset<KvLowDbShape<KV>>(
        dbLocation,
        this.defaultDb,
      );
    }

    _.set(
      this.lowDB.data,
      '__kvMeta.expirations',
      _.get(this.lowDB.data, '__kvMeta.expirations', {}),
    );

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
    return `__kvMeta.expirations.${this.normalizeKey(key)}`;
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

  private async isExpired<K extends keyof KV>(key: K): Promise<boolean> {
    //#region @backendFunc
    const expiresAt = await this.getExpirationTimestamp(key);

    if (!_.isNumber(expiresAt)) {
      return false;
    }

    return Date.now() >= expiresAt;
    //#endregion
  }

  private async cleanupIfExpired<K extends keyof KV>(key: K): Promise<boolean> {
    //#region @backendFunc
    const expired = await this.isExpired(key);

    if (!expired) {
      return false;
    }

    const connection = await this.getConnection();
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
}
