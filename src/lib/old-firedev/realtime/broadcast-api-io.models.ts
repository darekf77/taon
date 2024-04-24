export class BroadcastApiClient {
  static from(callback?) {
    const ins = new BroadcastApiClient(callback);
    return ins;
  }

  constructor(
    protected callback: () => any,
  ) {

  }
}

export interface BroadcastApiIoOptionsClient {
  path: string,
}


export interface BroadcastApiIoOptions extends BroadcastApiIoOptionsClient {

  //#region @browser
  /**
   * only for websql mode
   */
  href: string;
  //#endregion
}
