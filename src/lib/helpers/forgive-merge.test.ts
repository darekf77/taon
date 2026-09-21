import { forgiveMerge } from './forgive-merge';

describe('forgiveMerge()', () => {
  it('should merge primitive values', () => {
    const target = {
      name: 'before',
      count: 10,
      enabled: false,
    };

    const result = forgiveMerge(target, {
      name: 'after',
      count: 20,
      enabled: true,
    });

    expect(result).toEqual({
      name: 'after',
      count: 20,
      enabled: true,
    });
  });

  it('should preserve values not present in source', () => {
    const target = {
      name: 'hello',
      count: 10,
      enabled: true,
    };

    const result = forgiveMerge(target, {
      count: 20,
    });

    expect(result).toEqual({
      name: 'hello',
      count: 20,
      enabled: true,
    });
  });

  it('should deeply merge nested objects', () => {
    const target = {
      config: {
        enabled: true,
        clientId: 'abc',
        nested: {
          one: 1,
          two: 2,
        },
      },
    };

    const result = forgiveMerge(target, {
      config: {
        enabled: false,
        nested: {
          one: 100,
        },
      },
    } as any);

    expect(result).toEqual({
      config: {
        enabled: false,
        clientId: 'abc',
        nested: {
          one: 100,
          two: 2,
        },
      },
    });
  });

  it('should replace arrays instead of merging their indexes', () => {
    const target = {
      items: ['one', 'two', 'three'],
    };

    const result = forgiveMerge(target, {
      items: ['replacement'],
    });

    expect(result.items).toEqual(['replacement']);
  });

  it('should replace array with empty array', () => {
    const target = {
      items: ['one', 'two', 'three'],
    };

    const result = forgiveMerge(target, {
      items: [],
    });

    expect(result.items).toEqual([]);
  });

  it('should clone source arrays', () => {
    const sourceItems = ['one', 'two'];

    const target = {
      items: ['old'],
    };

    const result = forgiveMerge(target, {
      items: sourceItems,
    });

    expect(result.items).toEqual(['one', 'two']);
    expect(result.items).not.toBe(sourceItems);
  });

  it('should replace primitive with object', () => {
    const target: any = {
      value: 'primitive',
    };

    const source = {
      value: {
        nested: true,
      },
    };

    const result = forgiveMerge(target, source);

    expect(result.value).toEqual({
      nested: true,
    });

    expect(result.value).not.toBe(source.value);
  });

  it('should replace object with primitive', () => {
    const target: any = {
      value: {
        nested: true,
      },
    };

    const result = forgiveMerge(target, {
      value: 'primitive',
    });

    expect(result.value).toBe('primitive');
  });

  it('should override with null', () => {
    const target: any = {
      value: {
        nested: true,
      },
    };

    const result = forgiveMerge(target, {
      value: null,
    });

    expect(result.value).toBeNull();
  });

  it('should override with undefined', () => {
    const target: any = {
      value: 'something',
    };

    const result = forgiveMerge(target, {
      value: undefined,
    });

    expect(result.value).toBeUndefined();
  });

  it('should return target when source is undefined', () => {
    const target = {
      value: 123,
    };

    const result = forgiveMerge(target, undefined);

    expect(result).toBe(target);
    expect(result.value).toBe(123);
  });

  it('should mutate and return target', () => {
    const target = {
      value: 1,
    };

    const result = forgiveMerge(target, {
      value: 2,
    });

    expect(result).toBe(target);
    expect(target.value).toBe(2);
  });

  it('should forgive getter-only property assignment', () => {
    class Example {
      get readonlyValue(): string {
        return 'getter-value';
      }

      normalValue = 'before';
    }

    const target = new Example();

    expect(() => {
      forgiveMerge(target, {
        readonlyValue: 'attempted-override',
        normalValue: 'after',
      } as any);
    }).not.toThrow();

    expect(target.readonlyValue).toBe('getter-value');
    expect(target.normalValue).toBe('after');
  });

  it('should continue merging after getter-only property assignment fails', () => {
    class Example {
      first = 'before-first';

      get readonlyValue(): string {
        return 'readonly';
      }

      last = 'before-last';
    }

    const target = new Example();

    forgiveMerge(target, {
      first: 'after-first',
      readonlyValue: 'cannot-set',
      last: 'after-last',
    } as any);

    expect(target.first).toBe('after-first');
    expect(target.readonlyValue).toBe('readonly');
    expect(target.last).toBe('after-last');
  });

  it('should forgive a throwing source getter', () => {
    const target = {
      good: 'before',
      broken: 'original',
      after: 'before-after',
    };

    const source = {
      good: 'after',

      get broken(): string {
        throw new Error('Getter exploded');
      },

      after: 'after-after',
    };

    expect(() => {
      forgiveMerge(target, source);
    }).not.toThrow();

    expect(target.good).toBe('after');

    // Source getter could not be read, so preserve target.
    expect(target.broken).toBe('original');

    // Merge must continue.
    expect(target.after).toBe('after-after');
  });

  it('should forgive a throwing target getter', () => {
    class Target {
      normal = 'before';

      get broken(): any {
        throw new Error('Target getter exploded');
      }
    }

    const target = new Target();

    expect(() => {
      forgiveMerge(target, {
        normal: 'after',
        broken: {
          nested: true,
        },
      } as any);
    }).not.toThrow();

    expect(target.normal).toBe('after');
  });

  it('should preserve class instances when deeply merging them', () => {
    class Config {
      enabled = false;
      clientId = '';
    }

    const config = new Config();
    config.enabled = true;
    config.clientId = 'original';

    const target = {
      config,
    };

    const result = forgiveMerge(target, {
      config: {
        enabled: false,
      },
    } as any);

    expect(result.config).toBeInstanceOf(Config);
    expect(result.config).toBe(config);

    expect(result.config.enabled).toBe(false);
    expect(result.config.clientId).toBe('original');
  });

  it('should deeply merge multiple nested class instances', () => {
    class GoogleConfig {
      enabled = false;
      googleClientId = '';
    }

    class SocialLoginConfig {
      google = new GoogleConfig();
    }

    const socialLogin = new SocialLoginConfig();

    socialLogin.google.enabled = true;
    socialLogin.google.googleClientId = 'my-google-id';

    const target = {
      socialLogin,
    };

    const result = forgiveMerge(target, {
      socialLogin: {
        google: {
          enabled: false,
        },
      },
    } as any);

    expect(result.socialLogin).toBeInstanceOf(SocialLoginConfig);
    expect(result.socialLogin.google).toBeInstanceOf(GoogleConfig);

    expect(result.socialLogin.google.enabled).toBe(false);

    expect(result.socialLogin.google.googleClientId).toBe('my-google-id');
  });

  it('should not mutate source objects', () => {
    const source = {
      nested: {
        value: 123,
      },
      items: ['one', 'two'],
    };

    const target = {
      nested: {
        value: 0,
      },
      items: ['old'],
    };

    forgiveMerge(target, source);

    expect(source).toEqual({
      nested: {
        value: 123,
      },
      items: ['one', 'two'],
    });
  });
});
