import { vi } from 'vitest/cjs';

import { TaonBaseKvSyncRepository } from './base-kv-sync-repository';

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

class TestKvRepository extends TaonBaseKvSyncRepository<TestKv> {}

describe('TaonBaseKvSyncRepository', () => {
  function createRepository(): TestKvRepository {
    return new TestKvRepository();
  }

  describe('set / get', () => {
    it('stores and returns a value synchronously', () => {
      const repository = createRepository();

      repository.set('name', 'Taon');

      expect(repository.get('name')).toBe('Taon');
    });

    it('returns undefined for a missing key', () => {
      const repository = createRepository();

      expect(repository.get('name')).toBeUndefined();
    });

    it('overwrites an existing value', () => {
      const repository = createRepository();

      repository.set('counter', 1);
      repository.set('counter', 2);

      expect(repository.get('counter')).toBe(2);
    });

    it('can store null as a value', () => {
      const repository = createRepository();

      repository.set('nullable', null);

      expect(repository.has('nullable')).toBe(true);
      expect(repository.get('nullable')).toBeNull();
    });
  });

  describe('has', () => {
    it('returns true when a key exists', () => {
      const repository = createRepository();

      repository.set('name', 'Taon');

      expect(repository.has('name')).toBe(true);
    });

    it('returns false when a key does not exist', () => {
      const repository = createRepository();

      expect(repository.has('name')).toBe(false);
    });
  });

  describe('delete', () => {
    it('removes an existing value', () => {
      const repository = createRepository();

      repository.set('name', 'Taon');
      repository.delete('name');

      expect(repository.has('name')).toBe(false);
      expect(repository.get('name')).toBeUndefined();
    });

    it('does not throw when deleting a missing key', () => {
      const repository = createRepository();

      expect(() => repository.delete('name')).not.toThrow();
    });

    it('also removes expiration metadata', () => {
      const repository = createRepository();

      repository.set('name', 'Taon');
      repository.expire('name', 100);
      repository.delete('name');
      repository.set('name', 'New Taon');

      expect(repository.ttl('name')).toBeUndefined();
      expect(repository.get('name')).toBe('New Taon');
    });
  });

  describe('merge', () => {
    it('merges object properties without removing existing properties', () => {
      const repository = createRepository();

      repository.set('settings', {
        theme: 'light',
        nested: {
          enabled: false,
          label: 'original',
        },
        tags: ['one'],
      });

      repository.merge('settings', {
        theme: 'dark',
        nested: {
          enabled: true,
        },
        tags: ['two', 'three'],
      });

      expect(repository.get('settings')).toEqual({
        theme: 'dark',
        nested: {
          enabled: true,
          label: 'original',
        },
        tags: ['two', 'three'],
      });
    });

    it('replaces arrays instead of merging their indexes', () => {
      const repository = createRepository();

      repository.set('settings', {
        theme: 'light',
        nested: {
          enabled: false,
        },
        tags: ['one', 'two', 'three'],
      });

      repository.merge('settings', {
        theme: 'light',
        nested: {
          enabled: false,
        },
        tags: ['replacement'],
      });

      expect(repository.get('settings')?.tags).toEqual(['replacement']);
    });

    it('sets the value when the key does not exist yet', () => {
      const repository = createRepository();

      repository.merge('settings', {
        theme: 'dark',
        nested: {
          enabled: true,
        },
        tags: [],
      });

      expect(repository.get('settings')).toEqual({
        theme: 'dark',
        nested: {
          enabled: true,
        },
        tags: [],
      });
    });

    it('overwrites primitive values', () => {
      const repository = createRepository();

      repository.set('counter', 1);
      repository.merge('counter', 2);

      expect(repository.get('counter')).toBe(2);
    });

    it('ignores undefined leaf values during an object merge', () => {
      const repository = createRepository();

      repository.set('settings', {
        theme: 'light',
        nested: {
          enabled: false,
          label: 'keep me',
        },
        tags: [],
      });

      repository.merge('settings', {
        theme: 'dark',
        nested: {
          enabled: true,
          label: undefined,
        },
        tags: [],
      });

      expect(repository.get('settings')).toEqual({
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
    it('sets TTL for an existing key', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-12T12:00:00.000Z'));

      const repository = createRepository();

      repository.set('name', 'Taon');
      repository.expire('name', 10);

      expect(repository.ttl('name')).toBe(10);

      vi.useRealTimers();
    });

    it('returns rounded-up TTL seconds', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-12T12:00:00.000Z'));

      const repository = createRepository();

      repository.set('name', 'Taon');
      repository.expire('name', 10);

      vi.advanceTimersByTime(1_500);

      expect(repository.ttl('name')).toBe(9);

      vi.useRealTimers();
    });

    it('removes a key after its TTL expires', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-12T12:00:00.000Z'));

      const repository = createRepository();

      repository.set('name', 'Taon');
      repository.expire('name', 5);

      vi.advanceTimersByTime(5_000);

      expect(repository.get('name')).toBeUndefined();
      expect(repository.has('name')).toBe(false);
      expect(repository.ttl('name')).toBeUndefined();

      vi.useRealTimers();
    });

    it('does nothing when expire is called for a missing key', () => {
      vi.useFakeTimers();

      const repository = createRepository();

      repository.expire('name', 10);

      expect(repository.ttl('name')).toBeUndefined();
      expect(repository.has('name')).toBe(false);

      vi.useRealTimers();
    });

    it('removes the previous expiration when set is called again', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-12T12:00:00.000Z'));

      const repository = createRepository();

      repository.set('name', 'Old value');
      repository.expire('name', 5);

      vi.advanceTimersByTime(2_000);

      repository.set('name', 'New value');

      vi.advanceTimersByTime(10_000);

      expect(repository.get('name')).toBe('New value');
      expect(repository.ttl('name')).toBeUndefined();

      vi.useRealTimers();
    });

    it('supports immediate expiration with zero TTL', () => {
      vi.useFakeTimers();

      const repository = createRepository();

      repository.set('name', 'Taon');
      repository.expire('name', 0);

      expect(repository.get('name')).toBeUndefined();
      expect(repository.has('name')).toBe(false);

      vi.useRealTimers();
    });
  });

  describe('getAllData', () => {
    it('returns all stored values', () => {
      const repository = createRepository();

      repository.set('name', 'Taon');
      repository.set('counter', 5);

      expect(repository.getAllData()).toEqual({
        name: 'Taon',
        counter: 5,
      });
    });

    it('removes expired entries before returning data', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-07-12T12:00:00.000Z'));

      const repository = createRepository();

      repository.set('name', 'Taon');
      repository.set('counter', 5);
      repository.expire('name', 2);

      vi.advanceTimersByTime(2_000);

      expect(repository.getAllData()).toEqual({
        counter: 5,
      });

      vi.useRealTimers();
    });

    it('returns a deep clone and does not expose internal state', () => {
      const repository = createRepository();

      repository.set('settings', {
        theme: 'light',
        nested: {
          enabled: true,
        },
        tags: ['one'],
      });

      const result = repository.getAllData();

      result.settings!.theme = 'changed';
      result.settings!.nested.enabled = false;
      result.settings!.tags.push('two');

      expect(repository.get('settings')).toEqual({
        theme: 'light',
        nested: {
          enabled: true,
        },
        tags: ['one'],
      });
    });
  });

  describe('repository isolation', () => {
    it('keeps data separate between repository instances', () => {
      const firstRepository = createRepository();
      const secondRepository = createRepository();

      firstRepository.set('name', 'First');

      expect(firstRepository.get('name')).toBe('First');
      expect(secondRepository.get('name')).toBeUndefined();
    });
  });
});
