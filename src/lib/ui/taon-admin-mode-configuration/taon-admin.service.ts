//#region import
import {
  computed,
  inject,
  Injectable,
  signal,
  TemplateRef,
  WritableSignal,
} from '@angular/core'; // @browser
import { HttpStatusEnum } from 'taon/src';
import { StorSignal, TaonStor } from 'taon-storage/src';
import { Helpers, _ } from 'tnp-core/src';

import { BreakpointsService } from './breakpoints.service';
//#endregion

//#region models / taon admin panel mode
export enum TaonAdminPanelMode {
  NONE = 'NONE',
  ICON = 'ICON',
  POPUP = 'POPUP',
  SIDE = 'SIDE',
  FULL_SCREEN = 'FULL_SCREEN',
}
//#endregion

//#region models / taon admin tab
export interface TaonAdminTab {
  name: string;
  templateOrIframeLink?: string | TemplateRef<any>;
}
//#endregion

//#region models / taon admin class singleton
export class TaonAdmin {
  private static _instance: TaonAdmin;

  //#region methods / init
  static init(): void {
    TaonAdmin.Instance;
  }
  //#endregion

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

  public skipShowingErrors = TaonStor.inLocalstorage(
    {
      defaultValue: [HttpStatusEnum.NO_TOKEN] as HttpStatusEnum[],
      keyOrPath: 'skipShowingErrors',
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
//#endregion

//#region @browser
@Injectable({ providedIn: 'root' })
//#endregion
export class TaonAdminService {
  //#region fields & getters
  public readonly isIframe: boolean =
    window.location !== window.parent.location;

  public readonly breakpointsService = inject(BreakpointsService);

  public isDesktop = signal(true);

  private devTapCount = 0;

  private devTapTimeout: any;

  public get adminPanelMode(): StorSignal<TaonAdminPanelMode> {
    return TaonAdmin.Instance.adminPanelMode;
  }

  public get keepWebsqlDbDataAfterReload(): StorSignal<boolean> {
    return TaonAdmin.Instance.keepWebsqlDbDataAfterReload;
  }

  public get additionalTabs(): WritableSignal<TaonAdminTab[]> {
    return TaonAdmin.Instance.additionalTabs;
  }

  public get skipShowingErrors(): StorSignal<HttpStatusEnum[]> {
    return TaonAdmin.Instance.skipShowingErrors;
  }
  //#endregion

  //#region constructor
  constructor() {
    // @ts-ignore
    window['Taon'] = this;
    // @ts-ignore
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

  //#region methods / should skip showing error
  shouldSkipShowingError(status: HttpStatusEnum): boolean {
    const toSkip = this.skipShowingErrors();
    return toSkip.includes(status);
  }
  //#endregion

  //#region methods / set skip showing error
  setSkipShowingError(status: HttpStatusEnum, skip: boolean): void {
    this.skipShowingErrors.update(current => {
      if (skip) {
        return current.includes(status) ? current : [...current, status];
      }

      return current.filter(x => x !== status);
    });
  }
  //#endregion

  //#region methods / admin
  admin(): void {
    this.adminPanelMode.set(TaonAdminPanelMode.FULL_SCREEN);
  }
  //#endregion

  //#region methods / show
  show(): void {
    this.adminPanelMode.set(TaonAdminPanelMode.POPUP);
  }
  //#endregion

  //#region methods / hide
  hide(): void {
    this.adminPanelMode.set(TaonAdminPanelMode.NONE);
  }
  //#endregion

  //#region methods / enable developer if5 timetap
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
  //#endregion
}
