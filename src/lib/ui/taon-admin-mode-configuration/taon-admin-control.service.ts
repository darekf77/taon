import {
  ApplicationRef,
  ChangeDetectorRef,
  Injectable,
  TemplateRef,
  inject,
} from '@angular/core';
import type { TaonAdmin } from './taon-admin.service';
import type { TaonAdminModeConfigurationComponent } from './taon-admin-mode-configuration.component';

@Injectable({ providedIn: 'root' })
export class TaonAdminService {
  taonAdminModeConfigurationComponent: TaonAdminModeConfigurationComponent;

  private readonly admin: TaonAdmin;

  /**
   * @deprecated
   */
  disableScroll() {
    // this.admin.scrollableEnabled = false;
    // this.taonAdminModeConfigurationComponent.cdr.detectChanges();
  }

  constructor(private cdr: ApplicationRef) {
    this.admin = window['taon'] as TaonAdmin;
  }

  public addTab(name: string, template: TemplateRef<any>): void {
    this.admin.cmp.tabs.push({
      name,
      template,
    });
  }

  init(
    taonAdminModeConfigurationComponent: TaonAdminModeConfigurationComponent
  ) {
    this.taonAdminModeConfigurationComponent =
      taonAdminModeConfigurationComponent;
  }
}
