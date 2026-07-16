import { vi } from 'vitest/cjs';

import { TaonBaseKvRepository } from './base-kv-repository';

type TestKv = {
  name: string;
  counter: number;
  settings: {
    theme: string;
    nested: {
      enabled: boolean;
      label?: string;
    };
    tags: string[];
  };
  nullable: string | null;
};

class TestKvRepository extends TaonBaseKvRepository<TestKv> {
  protected override useInMemoryDB(): boolean {
    return true;
  }
}

describe('TaonBaseKvRepository', () => {
  let repository: TestKvRepository;

  function createRepository(): TestKvRepository {
    const instance = new TestKvRepository();

    Object.defineProperty(instance, 'ctx', {
      configurable: true,
      writable: true,
      value: {
        logDb: false,

        kvDbJsonLocationForClass: vi.fn(
          (className: string) => `/tmp/${className}.json`,
        ),
      },
    });

    return instance;
  }

  beforeEach(() => {
    repository = createRepository();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('set / get', () => {
    it('stores and returns a value asynchronously', async () => {
      await repository.set('name', 'Taon');

      await expect(repository.get('name')).resolves.toBe('Taon');
    });

    it('returns undefined for a missing key', async () => {
      await expect(repository.get('name')).resolves.toBeUndefined();
    });

    it('overwrites an existing value', async () => {
      await repository.set('counter', 1);
      await repository.set('counter', 2);

      await expect(repository.get('counter')).resolves.toBe(2);
    });

    it('can store null as a value', async () => {
      await repository.set('nullable', null);

      await expect(repository.has('nullable')).resolves.toBe(true);
      await expect(repository.get('nullable')).resolves.toBeNull();
    });
  });

  describe('has', () => {
    it('returns true when a key exists', async () => {
      await repository.set('name', 'Taon');

      await expect(repository.has('name')).resolves.toBe(true);
    });

    it('returns false when a key does not exist', async () => {
      await expect(repository.has('name')).resolves.toBe(false);
    });
  });

  describe('delete', () => {
    it('removes an existing value', async () => {
      await repository.set('name', 'Taon');
      await repository.delete('name');

      await expect(repository.has('name')).resolves.toBe(false);
      await expect(repository.get('name')).resolves.toBeUndefined();
    });

    it('does not throw when deleting a missing key', async () => {
      await expect(repository.delete('name')).resolves.toBeUndefined();
    });

    it('also removes expiration metadata', async () => {
      await repository.set('name', 'Taon');
      await repository.expire('name', 100);
      await repository.delete('name');
      await repository.set('name', 'New Taon');

      await expect(repository.ttl('name')).resolves.toBeUndefined();
      await expect(repository.get('name')).resolves.toBe('New Taon');
    });
  });

  describe('merge', () => {
    it('merges object properties without removing existing properties', async () => {
      await repository.set('settings', {
        theme: 'light',
        nested: {
          enabled: false,
          label: 'original',
        },
        tags: ['one'],
      });

      await repository.merge('settings', {
        theme: 'dark',
        nested: {
          enabled: true,
        },
        tags: ['two', 'three'],
      });

      await expect(repository.get('settings')).resolves.toEqual({
        theme: 'dark',
        nested: {
          enabled: true,
          label: 'original',
        },
        tags: ['two', 'three'],
      });
    });

    it('replaces arrays instead of merging their indexes', async () => {
      await repository.set('settings', {
        theme: 'light',
        nested: {
          enabled: false,
        },
        tags: ['one', 'two', 'three'],
      });

      await repository.merge('settings', {
        theme: 'light',
        nested: {
          enabled: false,
        },
        tags: ['replacement'],
      });

      expect((await repository.get('settings'))?.tags).toEqual(['replacement']);
    });

    it('sets the value when the key does not exist yet', async () => {
      await repository.merge('settings', {
        theme: 'dark',
        nested: {
          enabled: true,
        },
        tags: [],
      });

      await expect(repository.get('settings')).resolves.toEqual({
        theme: 'dark',
        nested: {
          enabled: true,
        },
        tags: [],
      });
    });

    it('overwrites primitive values', async () => {
      await repository.set('counter', 1);
      await repository.merge('counter', 2);

      await expect(repository.get('counter')).resolves.toBe(2);
    });

    it('ignores undefined leaf values during an object merge', async () => {
      await repository.set('settings', {
        theme: 'light',
        nested: {
          enabled: false,
          label: 'keep me',
        },
        tags: [],
      });

      await repository.merge('settings', {
        theme: 'dark',
        nested: {
          enabled: true,
          label: undefined,
        },
        tags: [],
      });

      await expect(repository.get('settings')).resolves.toEqual({
        theme: 'dark',
        nested: {
          enabled: true,
          label: 'keep me',
        },
        tags: [],
      });
    });
  });

  describe('expire / ttl', () => {
    it('sets TTL for an existing key', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-12T12:00:00.000Z'));

      await repository.set('name', 'Taon');
      await repository.expire('name', 10);

      await expect(repository.ttl('name')).resolves.toBe(10);
    });

    it('returns rounded-up TTL seconds', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-12T12:00:00.000Z'));

      await repository.set('name', 'Taon');
      await repository.expire('name', 10);

      vi.advanceTimersByTime(1_500);

      await expect(repository.ttl('name')).resolves.toBe(9);
    });

    it('removes a key after its TTL expires', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-12T12:00:00.000Z'));

      await repository.set('name', 'Taon');
      await repository.expire('name', 5);

      vi.advanceTimersByTime(5_000);

      await expect(repository.get('name')).resolves.toBeUndefined();
      await expect(repository.has('name')).resolves.toBe(false);
      await expect(repository.ttl('name')).resolves.toBeUndefined();
    });

    it('does nothing when expire is called for a missing key', async () => {
      vi.useFakeTimers();

      await repository.expire('name', 10);

      await expect(repository.ttl('name')).resolves.toBeUndefined();
      await expect(repository.has('name')).resolves.toBe(false);
    });

    it('removes the previous expiration when set is called again', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-12T12:00:00.000Z'));

      await repository.set('name', 'Old value');
      await repository.expire('name', 5);

      vi.advanceTimersByTime(2_000);

      await repository.set('name', 'New value');

      vi.advanceTimersByTime(10_000);

      await expect(repository.get('name')).resolves.toBe('New value');
      await expect(repository.ttl('name')).resolves.toBeUndefined();
    });

    it('supports immediate expiration with zero TTL', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-12T12:00:00.000Z'));

      await repository.set('name', 'Taon');
      await repository.expire('name', 0);

      await expect(repository.get('name')).resolves.toBeUndefined();
      await expect(repository.has('name')).resolves.toBe(false);
    });

    it('does not expire the value before its TTL', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-12T12:00:00.000Z'));

      await repository.set('name', 'Taon');
      await repository.expire('name', 10);

      vi.advanceTimersByTime(9_999);

      await expect(repository.get('name')).resolves.toBe('Taon');
      await expect(repository.ttl('name')).resolves.toBe(1);
    });
  });

  describe('getAllData', () => {
    it('returns all stored values without KV metadata', async () => {
      await repository.set('name', 'Taon');
      await repository.set('counter', 5);
      await repository.expire('name', 100);

      const result = await repository.getAllData();

      expect(result).toEqual({
        name: 'Taon',
        counter: 5,
      });

      expect(result).not.toHaveProperty('__kvMeta');
    });

    it('removes expired entries before returning data', async () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-12T12:00:00.000Z'));

      await repository.set('name', 'Taon');
      await repository.set('counter', 5);
      await repository.expire('name', 2);

      vi.advanceTimersByTime(2_000);

      await expect(repository.getAllData()).resolves.toEqual({
        counter: 5,
      });
    });

    it('returns a deep clone and does not expose internal state', async () => {
      await repository.set('settings', {
        theme: 'light',
        nested: {
          enabled: true,
        },
        tags: ['one'],
      });

      const result = await repository.getAllData();

      result.settings!.theme = 'changed';
      result.settings!.nested.enabled = false;
      result.settings!.tags.push('two');

      await expect(repository.get('settings')).resolves.toEqual({
        theme: 'light',
        nested: {
          enabled: true,
        },
        tags: ['one'],
      });
    });
  });

  describe('repository isolation', () => {
    it('keeps in-memory databases separate between repository instances', async () => {
      const firstRepository = createRepository();
      const secondRepository = createRepository();

      await firstRepository.set('name', 'First');

      await expect(firstRepository.get('name')).resolves.toBe('First');
      await expect(secondRepository.get('name')).resolves.toBeUndefined();
    });
  });

  describe('ctx mock', () => {
    it('does not request a JSON location when using the in-memory database', async () => {
      const ctx = (repository as any).ctx;

      await repository.set('name', 'Taon');

      expect(ctx.kvDbJsonLocationForClass).not.toHaveBeenCalled();
    });
  });
});
