import { CoreModels } from 'tnp-core/src';

import type { EndpointContext } from './endpoint-context';

export class ContextsEndpointStorage {
  SPECIAL_APP_READY_MESSAGE = CoreModels.SPECIAL_APP_READY_MESSAGE;
  private taonEndpointContexts = new Map<string, EndpointContext>();

  //#region singleton
  private static instance: ContextsEndpointStorage;

  private constructor() {
    // Private constructor to prevent direct instantiation
  }

  public static get Instance(): ContextsEndpointStorage {
    if (!ContextsEndpointStorage.instance) {
      ContextsEndpointStorage.instance = new ContextsEndpointStorage();
    }
    return ContextsEndpointStorage.instance;
  }
  //#endregion

  set(context: EndpointContext): void {
    if (!this.taonEndpointContexts.has(context.contextName)) {
      this.taonEndpointContexts.set(context.contextName, context);
    }
  }

  get arr(): EndpointContext[] {
    return Array.from(this.taonEndpointContexts.values()).filter(
      f => f.contextType === 'normal',
    );
  }

  getBy(
    context: Partial<EndpointContext> | string,
  ): EndpointContext | undefined {
    if (typeof context === 'string') {
      return this.taonEndpointContexts.get(context) as any;
    }
    return this.taonEndpointContexts.get(context.contextName) as any;
  }
}

// TODO QUICK_FIX @LAST encapsulate this => move to separate package
globalThis['$$$ContextsEndpointStorage$$$'] = ContextsEndpointStorage.Instance;
