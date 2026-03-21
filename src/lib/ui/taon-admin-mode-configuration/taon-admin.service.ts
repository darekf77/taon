//#region import
import { computed, inject, Injectable, signal } from '@angular/core'; // @browser
import { TaonStor } from 'taon-storage/src';
import { Helpers, _ } from 'tnp-core/src';

import { BreakpointsService } from './breakpoints.service';
//#endregion

export enum TaonAdminPanelMode {
  NONE = 'NONE',
  ICON = 'ICON',
  POPUP = 'POPUP',
  SIDE = 'SIDE',
  FULL_SCREEN = 'FULL_SCREEN',
}

//#region @browser
@Injectable({ providedIn: 'root' })
//#endregion
export class TaonAdminService {
  //#region singleton + constructor
  private static _instance: TaonAdminService;

  public readonly isIframe: boolean =
    window.location !== window.parent.location;

  private breakpointsService = inject(BreakpointsService);

  constructor() {
    TaonAdminService._instance = this;
    window['Taon'] = this;
    window['taon'] = this;

    this.breakpointsService.listenTo().subscribe(breakpoint => {
      console.log({ breakpoint });
      this.isDesktop.set(breakpoint === 'desktop');
      if (this.isDesktop()) {
        //
      } else {
        this.adminPanelMode.set(TaonAdminPanelMode.NONE);
      }
    });
  }

  static get Instance(): TaonAdminService {
    if (!this._instance) {
      throw new Error(
        'TaonAdminService not initialized yet. Make sure Angular bootstrapped first.',
      );
    }
    return this._instance;
  }
  //#endregion

  public isDesktop = signal(true);

  //#region fields & getters / admin panel mode

  public adminPanelMode = TaonStor.inLocalstorage(
    {
      defaultValue: TaonAdminPanelMode.NONE,
      keyOrPath: 'adminPanelMode',
    },
    TaonAdminService,
  );
  //#endregion

  //#region fields & getters / keep websql database data after reload
  /**
   * Property used in taon
   */
  public keepWebsqlDbDataAfterReload = TaonStor.inLocalstorage(
    {
      defaultValue: false,
      keyOrPath: 'keepWebsqlDbDataAfterReload',
    },
    TaonAdminService,
  );
  //#endregion

  show(): void {
    this.adminPanelMode.set(TaonAdminPanelMode.POPUP);
  }

  private devTapCount = 0;

  private devTapTimeout: any;

  enableDeveloperIf5Timetap(): void {
    this.devTapCount++;

    // reset timer every tap
    clearTimeout(this.devTapTimeout);

    this.devTapTimeout = setTimeout(() => {
      this.devTapCount = 0;
    }, 2000); // 2s window to complete taps

    if (this.devTapCount >= 5) {
      this.devTapCount = 0;

      this.show()
    }
  }
}
