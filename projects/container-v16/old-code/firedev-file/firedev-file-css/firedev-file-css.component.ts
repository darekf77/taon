//#region @browser
//#region imports
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FiredevFileCssHelpers } from './firedev-file-css.helpers';
import { FiredevFileCss } from './firedev-file-css';
//#endregion

/**
 * FiredevFileCss angular standalone component
 *
 * + component for entity can be dummy or with backend
 * + use this.api.getAllOrWhatever() to access backend => not FiredevFileCss.getAllOrWhatever()
 */
@Component({
  //#region component data
  selector: 'firedev-file-css',
  templateUrl: './firedev-file-css.component.html',
  styleUrls: ['./firedev-file-css.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    // FiredevFullMaterialModule,
    // StaticColumnsModule,
  ],
  //#endregion
})
export class FiredevFileCssComponent {
  @Input() model: FiredevFileCss;
  private api: typeof FiredevFileCss = FiredevFileCss;
  @Input() set FiredevFileCss(firedevFileCss: typeof FiredevFileCss) {
    this.api = firedevFileCss ? firedevFileCss : this.api;
  }

  ngOnInit() {
    FiredevFileCssHelpers.helloWorldFiredevFileCss();
  }
}
//#endregion
