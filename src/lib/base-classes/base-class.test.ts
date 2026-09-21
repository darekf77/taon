import { CLASS } from 'typescript-class-helpers/src';

import { TaonBaseClass } from './base-class';

class GoogleConfig extends TaonBaseClass<GoogleConfig> {
  enabled = false;

  googleClientId = '';
}

class SocialLoginConfig extends TaonBaseClass<SocialLoginConfig> {
  google = new GoogleConfig();

  github = {
    enabled: false,
  };
}

@CLASS.NAME('Example')
class Example extends TaonBaseClass<Example> {
  name = 'default';

  count = 10;

  tags = ['one', 'two', 'three'];

  socialLogin = new SocialLoginConfig();

  get readonlyValue(): string {
    return 'readonly';
  }
}

describe('TaonBaseClass.clone()', () => {
  it('should preserve current runtime values', () => {
    const instance = new Example();

    instance.name = 'changed';
    instance.count = 123;
    instance.socialLogin.google.enabled = true;
    instance.socialLogin.google.googleClientId = 'google-id';

    const cloned = instance.clone();

    expect(cloned.name).toBe('changed');
    expect(cloned.count).toBe(123);

    expect(cloned.socialLogin.google.enabled).toBe(true);

    expect(cloned.socialLogin.google.googleClientId).toBe('google-id');
  });

  it('should return an instance of the original class', () => {
    const instance = new Example();

    const cloned = instance.clone();

    expect(cloned).toBeInstanceOf(Example);
    expect(cloned.constructor).toBe(Example);
  });

  it('should create a different instance', () => {
    const instance = new Example();

    const cloned = instance.clone();

    expect(cloned).not.toBe(instance);
  });

  it('should override values with an object', () => {
    const instance = new Example();

    instance.name = 'before';
    instance.count = 123;

    const cloned = instance.clone({
      name: 'after',
    });

    expect(cloned.name).toBe('after');

    // Existing runtime value must survive.
    expect(cloned.count).toBe(123);
  });

  it('should deep merge nested overrides', () => {
    const instance = new Example();

    instance.socialLogin.google.enabled = true;
    instance.socialLogin.google.googleClientId = 'original-id';
    instance.socialLogin.github.enabled = true;

    const cloned = instance.clone({
      socialLogin: {
        google: {
          enabled: false,
        },
      },
    } as any);

    expect(cloned.socialLogin.google.enabled).toBe(false);

    // Must not disappear because another nested property
    // was overridden.
    expect(cloned.socialLogin.google.googleClientId).toBe('original-id');

    // Sibling object must survive as well.
    expect(cloned.socialLogin.github.enabled).toBe(true);
  });

  it('should support function overrides', () => {
    const instance = new Example();

    instance.count = 10;
    instance.name = 'hello';

    const cloned = instance.clone(old => ({
      count: old.count! + 5,
    }));

    expect(cloned.count).toBe(15);
    expect(cloned.name).toBe('hello');
  });

  it('should replace arrays with empty array instead of merging indexes', () => {
    const instance = new Example();

    instance.tags = ['one', 'two', 'three'];

    const cloned = instance.clone({
      tags: [],
    });

    expect(cloned.tags).toEqual([]);
  });

  it('should allow replacing an array with an empty array', () => {
    const instance = new Example();

    instance.tags = ['one', 'two', 'three'];

    const cloned = instance.clone({
      tags: [],
    });

    expect(cloned.tags).toEqual([]);
  });

  it('should not throw when class contains getter-only properties', () => {
    const instance = new Example();

    expect(() => instance.clone()).not.toThrow();

    const cloned = instance.clone();

    expect(cloned.readonlyValue).toBe('readonly');
  });

  it('should not mutate the original instance', () => {
    const instance = new Example();

    instance.name = 'original';
    instance.socialLogin.google.enabled = true;

    const cloned = instance.clone({
      name: 'cloned',
      socialLogin: {
        google: {
          enabled: false,
        },
      },
    } as any);

    expect(instance.name).toBe('original');
    expect(instance.socialLogin.google.enabled).toBe(true);

    expect(cloned.name).toBe('cloned');
    expect(cloned.socialLogin.google.enabled).toBe(false);
  });

  it('should reject string passed accidentally to clone()', () => {
    const instance = new Example();

    expect(() => {
      instance.clone('wrong' as any);
    }).toThrow('String is not supported as .clone() method argument');
  });
});
