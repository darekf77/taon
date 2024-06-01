//#region import
import { Stor } from 'firedev-storage/src';
import { _ } from 'tnp-core/src';
import { Subject, take, takeUntil, tap } from 'rxjs';
import { Helpers } from 'tnp-core/src';
import { config } from 'tnp-config/src';
import { globalPublicStorage } from './storage';
//#endregion

const ENV = Helpers.isBrowser ? window['ENV'] : global['ENV'];

export class FiredevAdmin {
  public scrollableEnabled = false; // TOOD @LAST false by default

  //#region singleton
  private constructor() {
    // Private constructor ensures the class cannot be instantiated from outside
    this.scrollableEnabled = !!ENV?.useGlobalNgxScrollbar;
  }

  public static get Instance(): FiredevAdmin {
    if (!globalPublicStorage[config.frameworkNames.firedev]) {
      globalPublicStorage[config.frameworkNames.firedev] = new FiredevAdmin();
    }
    return globalPublicStorage[config.frameworkNames.firedev];
  }
  //#endregion

  //#region @browser
  enabledTabs = [];

  private onEditMode = new Subject()
  onEditMode$ = this.onEditMode.asObservable();

  @Stor.property.in.localstorage.for(FiredevAdmin).withDefaultValue('')
  selectedFileSrc: string

  //#region fields & getters / files edit mode
  /**
   * Enable edit mode for each element on page
   */
  @Stor.property.in.localstorage.for(FiredevAdmin).withDefaultValue(false)
  public filesEditMode: boolean;
  //#endregion

  //#region fields & getters / popup is open
  @Stor.property.in.localstorage.for(FiredevAdmin).withDefaultValue(false)
  public adminPanelIsOpen: boolean;
  //#endregion

  //#region fields & getters / draggable popup instead side view for admin
  @Stor.property.in.localstorage.for(FiredevAdmin).withDefaultValue(false)
  public draggablePopupMode: boolean;
  //#endregion

  //#region fields & getters / draggable popup instead side view for admin
  @Stor.property.in.localstorage.for(FiredevAdmin).withDefaultValue(false)
  public draggablePopupModeFullScreen: boolean;
  //#endregion



  //#region methods / set edit mode
  setEditMode(value: boolean) {
    this.filesEditMode = value;
    this.onEditMode.next(value);
  }
  //#endregion




  hide() {
    this.draggablePopupMode = false;
    this.adminPanelIsOpen = false;
  }

  show() {
    this.draggablePopupMode = false;
    this.adminPanelIsOpen = true;
  }
  //#endregion

  //#region  kepp websql database data after reload
  /**
   * Property used in firedev
   */
  //#region @browser
  @Stor.property.in.localstorage.for(FiredevAdmin).withDefaultValue(false)
  //#endregion
  public keepWebsqlDbDataAfterReload: boolean;
  //#endregion

  //#region set keep websql db data after reload
  setKeepWebsqlDbDataAfterReload(value: boolean) {
    // if (value && !this.keepWebsqlDbDataAfterReload) {
    //   this.firstTimeKeepWebsqlDbDataTrue = true;
    // }
    this.keepWebsqlDbDataAfterReload = value;
  }
  //#endregion
}
