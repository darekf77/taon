//#region imports
import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FiredevBinaryFileHelpers } from './firedev-binary-file.helpers';
import { FiredevBinaryFile } from './firedev-binary-file';
//#endregion

/**
 * FiredevBinaryFile angular standalone component
 *
 * + component for entity can be dummy or with backend
 * + use this.api.getAllOrWhatever() to access backend => not FiredevBinaryFile.getAllOrWhatever()
 */
@Component({
  //#region component data
  selector: 'firedev-binary-file',
  templateUrl: './firedev-binary-file.component.html',
  styleUrls: ['./firedev-binary-file.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    // FiredevFullMaterialModule,
    // StaticColumnsModule,
  ],
  //#endregion
})
export class FiredevBinaryFileComponent {
  //#region fileds & getters & inputs & output
  @Input() model: FiredevBinaryFile;
  private api: typeof FiredevBinaryFile = FiredevBinaryFile;
  @Input() set FiredevBinaryFile(firedevBinaryFile: typeof FiredevBinaryFile) {
    this.api = firedevBinaryFile ? firedevBinaryFile : this.api;
  }
  //#endregion

  //#region hooks
  ngOnInit() {
    FiredevBinaryFileHelpers.helloWorldFiredevBinaryFile();
  }
  //#endregion
}
