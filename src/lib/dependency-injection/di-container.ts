export class DITaonContainer {
  private static instances = new Map();

  static resolve<T>(target: Function): T {
    if (DITaonContainer.instances.has(target)) {
      return DITaonContainer.instances.get(target);
    }

    // const tokens = Reflect.getMetadata('design:paramtypes', target) || [];
    const injections = []; //  tokens.map(token => Container.inject<any>(token));

    const instance = new (target as any)(...injections);
    DITaonContainer.instances.set(target, instance);
    return instance;
  }

  static inject<T>(target: new (...args: any[]) => T): T {
    return new Proxy(
      {},
      {
        get: (_, propName) => {
          let instance: T =
            DITaonContainer.instances.get(target) ||
            DITaonContainer.resolve(target);
          return typeof instance[propName] === 'function'
            ? instance[propName].bind(instance)
            : instance[propName];
        },
        set: (_, propName, value) => {
          let instance: T =
            DITaonContainer.instances.get(target) ||
            DITaonContainer.resolve(target);
          instance[propName] = value;
          return true;
        },
      },
    ) as T;
  }
}
