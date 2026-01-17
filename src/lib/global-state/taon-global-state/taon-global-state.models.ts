export enum TaonGlobalStateStatus {
  NORMAL = 'normal',

  /**
   * no new transactions allowed
   * existing ones may finish
   */
  DRAINING = 'draining',

  /**
   * DB is readonly
   * app is readonly (no writes, no side effects)
   */
  READONLY = 'readonly',

  /**
   * Db and app still readonly - migration in progress
   */
  MIGRATING = 'migrating',

  /**
   *  emergency stop / maintenance mode
   */
  FROZEN = 'frozen',
}

export const allowedTaonGlobalStatusOrders = {
  [TaonGlobalStateStatus.NORMAL]: [
    TaonGlobalStateStatus.DRAINING,
    TaonGlobalStateStatus.FROZEN,
  ],
  [TaonGlobalStateStatus.DRAINING]: [
    TaonGlobalStateStatus.READONLY,
    TaonGlobalStateStatus.FROZEN,
  ],
  [TaonGlobalStateStatus.READONLY]: [
    TaonGlobalStateStatus.MIGRATING,
    TaonGlobalStateStatus.NORMAL,
    TaonGlobalStateStatus.FROZEN,
  ],
  [TaonGlobalStateStatus.MIGRATING]: [
    TaonGlobalStateStatus.READONLY
  ],
  [TaonGlobalStateStatus.FROZEN]: [
    TaonGlobalStateStatus.READONLY,
    TaonGlobalStateStatus.NORMAL,
  ],
};
