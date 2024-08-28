// @ts-nocheck
//#region @browser
//#region imports
import {
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  Injector,
  Input,
  OnInit,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { Helpers, _ } from 'tnp-core/src';
import { TaonAdmin } from './taon-admin.service';
import { Stor } from 'taon-storage/src';
import {
  CdkDrag,
  CdkDragEnd,
  CdkDragMove,
  CdkDragRelease,
  Point,
} from '@angular/cdk/drag-drop';
import { BreakpointsService } from 'static-columns/src';
import { Subject, takeUntil, tap } from 'rxjs';
import { TaonAdminModeTab } from './models/taon-admin-mode-tabs';
import { TaonAdminService } from './taon-admin-control.service';

declare const ENV: any;
//#endregion

@Component({
  //#region component options
  selector: 'app-taon-admin-mode-configuration',
  templateUrl: './taon-admin-mode-configuration.component.html',
  styleUrls: ['./taon-admin-mode-configuration.component.scss'],
  //#endregion
})
export class TaonAdminModeConfigurationComponent implements OnInit {
  //#region fields & getters
  $destroy = new Subject();
  public readonly cdr = inject(ChangeDetectorRef);
  public readonly taonAdminService = inject(TaonAdminService);
  public readonly isDesktop: boolean;
  public tabs: TaonAdminModeTab[] = [];
  public admin: TaonAdmin = window['taon'] as TaonAdmin;
  public isWebSQLMode: boolean = Helpers.isWebSQL;
  public hideTaonToolsInProduction: boolean =
    ENV.hideTaonToolsInProduction && ENV.angularProd;
  public isIframe: boolean = window.location !== window.parent.location;
  public height: number = 100;
  public openedOnce = false;
  public reloading: boolean = false;
  public showPasscode: boolean =
    _.isString(ENV.passcode) || _.isObject(ENV.passcode);
  public passcode: string = _.isString(ENV.passcode)
    ? ENV.passcode
    : _.isObject(ENV.passcode)
      ? ENV.passcode.code
      : '';
  public message: string = _.isObject(ENV.passcode)
    ? ENV.passcode.message
    : void 0;

  // @ts-ignore
  @Stor.property.in.localstorage
    .for(TaonAdminModeConfigurationComponent)
    .withDefaultValue(0)
  dragPositionX: number;

  // @ts-ignore
  @Stor.property.in.localstorage
    .for(TaonAdminModeConfigurationComponent)
    .withDefaultValue(0)
  dragPositionY: number;

  dragPositionZero = { x: 0, y: 0 } as Point;
  dragPosition: Point;

  // @ts-ignore
  @Stor.property.in.localstorage
    .for(TaonAdminModeConfigurationComponent)
    .withDefaultValue(0)
  selectedIndex: number;

  @ViewChild('tabGroup') tabGroup;

  // @ts-ignore
  @Stor.property.in.localstorage
    .for(TaonAdminModeConfigurationComponent)
    .withDefaultValue(false)
  wasOpenDraggablePopup: boolean;

  @Output() taonAdminModeConfigurationDataChanged = new EventEmitter();
  @Input() taonAdminModeConfigurationData: any = {};
  public get opened() {
    return !this.isIframe && this.admin.adminPanelIsOpen;
  }
  public set opened(v) {
    if (v && !this.openedOnce) {
      this.openedOnce = true;
    }
    if (this.wasOpenDraggablePopup) {
      this.wasOpenDraggablePopup = false;
      this.admin.draggablePopupMode = true;
    }
    this.admin.adminPanelIsOpen = v;
  }
  //#endregion

  //#region constructor
  constructor(private breakpointsService: BreakpointsService) {
    this.admin.cmp = this;
    this.breakpointsService
      .listenTo()
      .pipe(takeUntil(this.$destroy))
      .subscribe(breakpoint => {
        // @ts-ignore
        this.isDesktop = breakpoint === 'desktop';
      });
    this.taonAdminService.init(this);
  }
  //#endregion

  reloadTabs() {
    this.reloading = true;
    setTimeout(() => {
      this.reloading = false;
      console.log('reloading done');
    });
  }

  //#region hooks
  async ngOnInit() {
    await Stor.awaitPendingOperatios();
    // console.log('PENDING OPERATION AWAITED ', this.selectedIndex)
    // console.log('draggablePopupModeFullScreen ', this.admin.draggablePopupModeFullScreen)

    this.dragPosition = { x: this.dragPositionX, y: this.dragPositionY };
    this.openedOnce = this.opened;
    // console.log('ONINIT',{
    //   'this.openedOnce': this.openedOnce,
    //   'this.dragPosition': this.dragPosition,
    //   this: this
    // })
  }

  ngAfterViewInit(): void {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    setTimeout(() => {
      this.height = window.innerHeight;

      // TODO QUICK_FIX for draggble popup proper first index load on tabs
      if (this.admin.draggablePopupMode) {
        this.reloadTabs();
      }

      // const tablist = (this.tabGroup?._tabHeader?._elementRef?.nativeElement as HTMLElement).querySelector('.mat-tab-list') as HTMLElement;
      // if (tablist) {
      //   tablist.style.transform = 'translateX(0px)'; // TODO QUICK_FIX
      // }
    });
  }

  ngOnDestroy(): void {
    this.$destroy.next(void 0);
    this.$destroy.complete();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.height = window.innerHeight;
  }

  //#endregion

  //#region methods
  async toogle() {
    // await stor.setItem(IS_OPEN_ADMIN, !this.opened);
    this.opened = !this.opened;
  }

  async toogleFullScreen() {
    this.admin.draggablePopupMode = true;
    this.admin.draggablePopupModeFullScreen =
      !this.admin.draggablePopupModeFullScreen;
    this.resetDrag();
  }

  resetDrag() {
    this.dragPositionX = 0;
    this.dragPositionY = 0;
    this.dragPosition = { x: this.dragPositionX, y: this.dragPositionY };
  }

  moved(c: CdkDragEnd) {
    this.dragPositionX += c.distance.x;
    this.dragPositionY += c.distance.y;
  }

  scrollTabs(event) {
    return;
    // event?.stopPropagation();
    // event?.stopImmediatePropagation(); // TODO not working
    // const children = this.tabGroup._tabHeader._elementRef.nativeElement.children;
    // const back = children[0];
    // const forward = children[2];
    // if (event.deltaY > 0) {
    //   forward.click();
    // } else {
    //   back.click();
    // }
  }

  //#endregion
}

//#endregion
