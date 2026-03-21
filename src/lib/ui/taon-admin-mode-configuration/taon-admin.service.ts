//#region import
import {
  computed,
  inject,
  Injectable,
  signal,
  TemplateRef,
  WritableSignal,
} from '@angular/core'; // @browser
import { StorSignal, TaonStor } from 'taon-storage/src';
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

export interface TaonAdminTab {
  name: string;
  templateOrIframeLink?: string | TemplateRef<any>;
}

export class TaonAdmin {
  private static _instance: TaonAdmin;

  static init(): void {
    TaonAdmin.Instance;
  }

  static get Instance(): TaonAdmin {
    if (!this._instance) {
      this._instance = new TaonAdmin();
    }
    return this._instance;
  }

  private constructor() {
    // console.log('TAON ADMIN INSTANCE CREATED');
  }

  public additionalTabs = signal([] as TaonAdminTab[]);

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
}

//#region @browser
@Injectable({ providedIn: 'root' })
//#endregion
export class TaonAdminService {
  //#region singleton + constructor

  public readonly isIframe: boolean =
    window.location !== window.parent.location;

  private breakpointsService = inject(BreakpointsService);

  constructor() {
    window['Taon'] = this;
    window['taon'] = this;

    this.breakpointsService.listenTo().subscribe(breakpoint => {
      // console.log({ breakpoint });
      this.isDesktop.set(breakpoint === 'desktop');
      if (this.isDesktop()) {
        //
      } else {
        this.adminPanelMode.set(TaonAdminPanelMode.NONE);
      }
    });
  }

  //#endregion

  public isDesktop = signal(true);

  public get adminPanelMode(): StorSignal<TaonAdminPanelMode> {
    return TaonAdmin.Instance.adminPanelMode;
  }

  public get keepWebsqlDbDataAfterReload(): StorSignal<boolean> {
    return TaonAdmin.Instance.keepWebsqlDbDataAfterReload;
  }

  public get additionalTabs(): WritableSignal<TaonAdminTab[]> {
    return TaonAdmin.Instance.additionalTabs;
  }

  admin(): void {
    this.adminPanelMode.set(TaonAdminPanelMode.FULL_SCREEN);
  }

  show(): void {
    this.adminPanelMode.set(TaonAdminPanelMode.POPUP);
  }

  hide(): void {
    this.adminPanelMode.set(TaonAdminPanelMode.NONE);
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

      this.show();
    }
  }
}
