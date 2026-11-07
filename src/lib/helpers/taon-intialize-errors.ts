export const INIT_TIMEOUT_MS = 5_000;

export class TaonInitializationTimeoutError extends Error {
  constructor() {
    super(`Taon initialization exceeded ${INIT_TIMEOUT_MS}ms`);
    this.name = 'TaonInitializationTimeoutError';
  }
}

export class TaonInitializationFailedError extends Error {
  constructor() {
    super('Taon initialization failed');
    this.name = 'TaonInitializationFailedError';
  }
}

export class TaonInitializationDbNotInitedRetryError extends Error {
  constructor() {
    super('Taon db not inited retry');
    this.name = 'TaonInitializationDbNotInitedRetryError';
  }
}
