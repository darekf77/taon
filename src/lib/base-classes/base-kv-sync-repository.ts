//#region imports
import { walk } from 'lodash-walk-object/src';
import { _ } from 'tnp-core/src';

import { TaonRepository } from '../decorators/classes/repository-decorator';

import { TaonBaseCustomRepository } from './base-custom-repository';
//#endregion

@TaonRepository({ className: 'TaonBaseKvSyncRepository' })
export abstract class TaonBaseKvSyncRepository<
  KV extends Record<string, any> = Record<string, any>,
> extends TaonBaseCustomRepository {
  //#region fields

  /**
   * In-memory data owned by this repository instance.
   *
   * Nothing is persisted to disk.
   */
  private readonly data: Partial<KV> = {};

  /**
   * Expiration timestamp indexed by normalized KV key.
   */
  private readonly expirations = new Map<string, number>();

  //#endregion

  //#region private helpers

  private normalizeKey(key: keyof KV): string {
    return String(key);
  }

  private getExpirationTimestamp<K extends keyof KV>(
    key: K,
  ): number | undefined {
    return this.expirations.get(this.normalizeKey(key));
  }

  private cleanupIfExpired<K extends keyof KV>(key: K): boolean {
    const normalizedKey = this.normalizeKey(key);
    const expiresAt = this.expirations.get(normalizedKey);

    if (!_.isNumber(expiresAt) || Date.now() < expiresAt) {
      return false;
    }

    _.unset(this.data, normalizedKey);
    this.expirations.delete(normalizedKey);

    return true;
  }

  //#endregion

  /**
   * Similar to set(), but when both the existing and incoming values
   * are objects, only incoming leaf properties are overwritten.
   *
   * Arrays are treated as values and replaced entirely.
   */
  merge<K extends keyof KV>(key: K, currentValue: KV[K]): void {
    //#region @backendFunc

    const existingValue = this.get(key);

    const canMerge =
      _.isObject(existingValue) &&
      !Array.isArray(existingValue) &&
      _.isObject(currentValue) &&
      !Array.isArray(currentValue);

    if (!canMerge) {
      this.set(key, currentValue);
      return;
    }

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

        _.set(existingValue as any, lodashPath, value);
      },
      {
        walkGetters: false,
      },
    );

    this.set(key, existingValue as KV[K]);

    //#endregion
  }

  set<K extends keyof KV>(key: K, value: KV[K]): void {
    //#region @backendFunc

    const normalizedKey = this.normalizeKey(key);

    _.set(this.data, normalizedKey, value);

    // Overwriting a value removes its previous expiration.
    this.expirations.delete(normalizedKey);

    //#endregion
  }

  get<K extends keyof KV>(key: K): KV[K] | undefined {
    //#region @backendFunc

    if (this.cleanupIfExpired(key)) {
      return undefined;
    }

    return _.get(this.data, this.normalizeKey(key)) as KV[K] | undefined;

    //#endregion
  }

  delete<K extends keyof KV>(key: K): void {
    //#region @backendFunc

    const normalizedKey = this.normalizeKey(key);

    _.unset(this.data, normalizedKey);
    this.expirations.delete(normalizedKey);

    //#endregion
  }

  has<K extends keyof KV>(key: K): boolean {
    //#region @backendFunc

    if (this.cleanupIfExpired(key)) {
      return false;
    }

    return _.has(this.data, this.normalizeKey(key));

    //#endregion
  }

  expire<K extends keyof KV>(key: K, ttlSeconds: number): void {
    //#region @backendFunc

    const normalizedKey = this.normalizeKey(key);

    if (!_.has(this.data, normalizedKey)) {
      return;
    }

    const expiresAt = Date.now() + ttlSeconds * 1000;

    this.expirations.set(normalizedKey, expiresAt);

    //#endregion
  }

  ttl<K extends keyof KV>(key: K): number | undefined {
    //#region @backendFunc

    if (this.cleanupIfExpired(key)) {
      return undefined;
    }

    if (!this.has(key)) {
      return undefined;
    }

    const expiresAt = this.getExpirationTimestamp(key);

    if (!_.isNumber(expiresAt)) {
      return undefined;
    }

    const diffMs = expiresAt - Date.now();

    if (diffMs <= 0) {
      this.delete(key);
      return undefined;
    }

    return Math.ceil(diffMs / 1000);

    //#endregion
  }

  getAllData(): Partial<KV> {
    //#region @backendFunc

    for (const key of this.expirations.keys()) {
      this.cleanupIfExpired(key as keyof KV);
    }

    return _.cloneDeep(this.data);

    //#endregion
  }
}
