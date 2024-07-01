import {
  ApplicationRef,
  ChangeDetectorRef,
  Injectable,
  TemplateRef,
  inject,
} from '@angular/core';
import type { FiredevAdmin } from './firedev-admin';
import type { FiredevAdminModeConfigurationComponent } from './firedev-admin-mode-configuration.component';

@Injectable({ providedIn: 'root' })
export class FiredevAdminService {
  firedevAdminModeConfigurationComponent: FiredevAdminModeConfigurationComponent;

  private readonly admin: FiredevAdmin;

  /**
   * @deprecated
   */
  disableScroll() {
    // this.admin.scrollableEnabled = false;
    // this.firedevAdminModeConfigurationComponent.cdr.detectChanges();
  }

  constructor(private cdr: ApplicationRef) {
    this.admin = window['firedev'] as FiredevAdmin;
  }

  public addTab(name: string, template: TemplateRef<any>): void {
    this.admin.cmp.tabs.push({
      name,
      template,
    });
  }

  init(
    firedevAdminModeConfigurationComponent: FiredevAdminModeConfigurationComponent
  ) {
    this.firedevAdminModeConfigurationComponent =
      firedevAdminModeConfigurationComponent;
  }
}
