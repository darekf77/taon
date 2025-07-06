//#region import
import { Subject } from 'rxjs';
// TODO @LAST fix taon storage for ssr
// import { Stor } from 'taon-storage/src';
import { Helpers, _ } from 'tnp-core/src';

//#endregion

const ENV = globalThis['ENV'];

// @Injectable({ providedIn: 'root' }) TODO make it angular service
export class TaonAdminService {
  //#region singleton
  private static _instance: TaonAdminService;
  public static get Instance() {
    if (!this._instance) {
      this._instance = new TaonAdminService();
    }
    return this._instance;
  }
  //#endregion

  //#region fields & getters
  public scrollableEnabled = false; // TOOD false by default
  private onEditMode = new Subject();
  onEditMode$ = this.onEditMode.asObservable();

  //#region fields & getters / popup is open

  // TODO @LAST fix taon storage for ssr
  // @(Stor.property.in.localstorage.for(TaonAdminService).withDefaultValue(false))
  public adminPanelIsOpen: boolean;
  //#endregion

  //#region fields & getters / draggable popup instead side view for admin

  // @(Stor.property.in.localstorage.for(TaonAdminService).withDefaultValue(false))
  public draggablePopupMode: boolean;
  //#endregion

  //#region fields & getters / draggable popup instead side view for admin

  // @(Stor.property.in.localstorage.for(TaonAdminService).withDefaultValue(false))
  public draggablePopupModeFullScreen: boolean;
  //#endregion

  //#region fields & getters / keep websql database data after reload
  /**
   * Property used in taon
   */
  // @(Stor.property.in.localstorage.for(TaonAdminService).withDefaultValue(false))
  public keepWebsqlDbDataAfterReload: boolean;
  //#endregion

  //#endregion

  //#region constructor
  constructor() {
    TaonAdminService._instance = this;
    this.scrollableEnabled = !!ENV?.useGlobalNgxScrollbar;
  }
  //#endregion

  //#region methods
  setEditMode(value: boolean) {
    this.onEditMode.next(value);
  }

  setKeepWebsqlDbDataAfterReload(value: boolean) {
    // if (value && !this.keepWebsqlDbDataAfterReload) {
    //   this.firstTimeKeepWebsqlDbDataTrue = true;
    // }
    this.keepWebsqlDbDataAfterReload = value;
  }

  enabledTabs = [];

  hide() {
    this.draggablePopupMode = false;
    this.adminPanelIsOpen = false;
  }

  show() {
    this.draggablePopupMode = false;
    this.adminPanelIsOpen = true;
  }

  logout() {}
  //#endregion
}
