//#region imports
import type {
  KVNamespace,
  KVNamespaceListKey,
} from '@cloudflare/workers-types';
import { walk } from 'lodash-walk-object/src';
import { Helpers, UtilsOs, _, path } from 'tnp-core/src';
import { Low } from 'tnp-core/src'; // @backend
import { JSONFilePreset } from 'tnp-core/src'; // @backend

import { TaonRepository } from '../decorators/classes/repository-decorator';
import { ClassHelpers } from '../helpers/class-helpers';

import { TaonBaseCustomRepository } from './base-custom-repository';
//#endregion

//#region kv lowdb shape model
type KvLowDbShape<KV extends Record<string, any>> = KV & {
  __kvMeta?: {
    expirations?: Record<string, number>;
  };
};
//#endregion

export const KVexpirationsDbMetaKey = '__kvMeta.expirations';

@TaonRepository({ className: 'TaonBaseKvRepository' })
export abstract class TaonBaseKvRepository<
  KV extends Record<string, any> = Record<string, any>,
> extends TaonBaseCustomRepository {
  //#region lowdb for development
  private get isCloudflareKV(): boolean {
    return UtilsOs.isRunningInCloudflareWorker();
  }

  private get cloudflareKeyPrefix(): string {
    return `${this.ctx.contextName}:${ClassHelpers.getName(this)}:`;
  }

  //#region @backend
  private lowDB: Low<KvLowDbShape<KV>>;

  private defaultDb = {} as KvLowDbShape<KV>;

  private get cloudflareKV(): KVNamespace {
    return this.ctx.KV;
  }

  protected useInMemoryDB(): boolean {
    if (UtilsOs.isRunningInCloudflareWorker()) {
      return false;
    }
    return false;
  }

  public get jsonDbLocation() {
    if (UtilsOs.isRunningInCloudflareWorker()) {
      return void 0;
    }
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

      try {
        this.lowDB = await JSONFilePreset<KvLowDbShape<KV>>(
          dbLocation,
          this.defaultDb,
          this.useInMemoryDB(),
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

        this.lowDB = await JSONFilePreset<KvLowDbShape<KV>>(
          dbLocation,
          this.defaultDb,
          this.useInMemoryDB(),
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
    const keyString = String(key);

    if (this.isCloudflareKV) {
      return `${this.cloudflareKeyPrefix}${keyString}`;
    }

    return keyString;
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

  //#region api / merge
  /**
   * similar to set BUT it will override
   * only new properies
   */
  async merge<K extends keyof KV>(key: K, currentValue: KV[K]): Promise<void> {
    //#region @backendFunc
    const existingValue = await this.get(key);

    const canMerge =
      _.isObject(existingValue) &&
      !Array.isArray(existingValue) &&
      _.isObject(currentValue) &&
      !Array.isArray(currentValue);

    if (!canMerge) {
      await this.set(key, currentValue);
      return;
    }

    const ttlSeconds = await this.ttl(key);

    walk.Object(
      currentValue,
      (value, lodashPath) => {
        if (
          _.isNil(value) ||
          _.isFunction(value) ||
          (_.isObject(value) && !Array.isArray(value))
        ) {
          return;
        }

        _.set(existingValue, lodashPath, value);
      },
      {
        walkGetters: false,
      },
    );

    await this.set(
      key,
      existingValue as KV[K],
      ttlSeconds
        ? {
            ttlSeconds,
          }
        : undefined,
    );
    //#endregion
  }
  //#endregion

  //#region api / set
  async set<K extends keyof KV>(
    key: K,
    value: KV[K],
    options?: {
      ttlSeconds?: number;
    },
  ): Promise<void> {
    //#region @backendFunc
    options = options || {};

    const normalizedKey = this.normalizeKey(key);

    if (this.isCloudflareKV) {
      await this.cloudflareKV.put(
        normalizedKey,
        JSON.stringify(value),
        options?.ttlSeconds
          ? {
              expirationTtl: options.ttlSeconds,
            }
          : undefined,
      );
      return;
    }

    const connection = await this.getConnection();

    _.set(connection.data, normalizedKey, value);

    if (_.isNumber(options.ttlSeconds)) {
      const expiresAt = Date.now() + options.ttlSeconds * 1000;

      _.set(connection.data, this.expirationPath(key), expiresAt);
    } else {
      // overwrite removes previous expiration
      _.unset(connection.data, this.expirationPath(key));
    }

    await connection.write();

    //#endregion
  }
  //#endregion

  //#region api / get
  async get<K extends keyof KV>(key: K): Promise<KV[K] | undefined> {
    //#region @backendFunc

    const normalizedKey = this.normalizeKey(key);

    if (this.isCloudflareKV) {
      const value = await this.cloudflareKV.get(normalizedKey, 'json');

      return value === null ? undefined : (value as KV[K]);
    }

    const expired = await this.cleanupIfExpired(key);

    if (expired) {
      return undefined;
    }

    const connection = await this.getConnection();

    return _.get(connection.data, normalizedKey) as KV[K] | undefined;

    //#endregion
  }
  //#endregion

  //#region api / delete
  async delete<K extends keyof KV>(key: K): Promise<void> {
    //#region @backendFunc

    const normalizedKey = this.normalizeKey(key);

    if (this.isCloudflareKV) {
      await this.cloudflareKV.delete(normalizedKey);
      return;
    }

    const connection = await this.getConnection();

    _.unset(connection.data, normalizedKey);
    _.unset(connection.data, this.expirationPath(key));

    await connection.write();

    //#endregion
  }
  //#endregion

  //#region api / has
  async has<K extends keyof KV>(key: K): Promise<boolean> {
    //#region @backendFunc

    if (this.isCloudflareKV) {
      const value = await this.cloudflareKV.get(this.normalizeKey(key));

      return value !== null;
    }

    const expired = await this.cleanupIfExpired(key);

    if (expired) {
      return false;
    }

    const connection = await this.getConnection();

    return _.has(connection.data, this.normalizeKey(key));

    //#endregion
  }
  //#endregion

  //#region api / expire
  async expire<K extends keyof KV>(key: K, ttlSeconds: number): Promise<void> {
    //#region @backendFunc

    const normalizedKey = this.normalizeKey(key);

    if (this.isCloudflareKV) {
      const value = await this.cloudflareKV.get(normalizedKey);

      if (value === null) {
        return;
      }

      await this.cloudflareKV.put(normalizedKey, value, {
        expirationTtl: ttlSeconds,
      });

      return;
    }

    const connection = await this.getConnection();

    if (!_.has(connection.data, normalizedKey)) {
      return;
    }

    const expiresAt = Date.now() + ttlSeconds * 1000;

    _.set(connection.data, this.expirationPath(key), expiresAt);

    await connection.write();

    //#endregion
  }
  //#endregion

  //#region api / ttl
  async ttl<K extends keyof KV>(key: K): Promise<number | undefined> {
    //#region @backendFunc

    const normalizedKey = this.normalizeKey(key);

    if (this.isCloudflareKV) {
      const result = await this.cloudflareKV.list({
        prefix: normalizedKey,
      });

      const item = result.keys.find(item => item.name === normalizedKey);

      if (!item) {
        return undefined;
      }

      if (!item.expiration) {
        return undefined;
      }

      return Math.max(0, Math.ceil(item.expiration - Date.now() / 1000));
    }

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
  //#endregion

  //#region api / get all data
  async getAllData(): Promise<Partial<KV>> {
    //#region @backendFunc

    if (this.isCloudflareKV) {
      const result: Partial<KV> = {};
      const prefix = this.cloudflareKeyPrefix;

      let cursor: string | undefined;

      do {
        const page = (await this.cloudflareKV.list({
          prefix,
          cursor,
        })) as {
          list_complete: false;
          keys: KVNamespaceListKey<any, string>[];
          cursor: string;
          cacheStatus: string | null;
        };

        for (const item of page.keys) {
          const value = await this.cloudflareKV.get(item.name, 'json');

          if (value !== null) {
            const logicalKey = item.name.slice(prefix.length);

            (result as any)[logicalKey] = value;
          }
        }

        if (page.list_complete) {
          cursor = undefined;
        } else {
          cursor = page.cursor;
        }
      } while (cursor);

      return result;
    }

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
  //#endregion
}
