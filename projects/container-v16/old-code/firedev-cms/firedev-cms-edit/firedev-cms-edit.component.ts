import {
  Component,
  EventEmitter,
  HostBinding,
  Inject,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Helpers, Utils, _, CoreModels, path } from 'tnp-core/src';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FiredevCmsEditDialogData } from '../firedev-cms.models';
import { FiredevBinaryFile, FiredevFullMaterialModule } from 'firedev-ui/src';
import { MtxSplitModule } from '@ng-matero/extensions/split';
import { StaticColumnsModule } from 'static-columns/src';
import { DomSanitizer } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SafePipe } from '../../shared/safe.pipe';
import { ViewMode } from '../../shared/view-mode';
import { AceModule } from 'ngx-ace-wrapper';

@Component({
  selector: 'firedev-cms-edit',
  templateUrl: './firedev-cms-edit.component.html',
  styleUrls: ['./firedev-cms-edit.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MtxSplitModule,
    FiredevFullMaterialModule,
    StaticColumnsModule,
    SafePipe,
    AceModule,
  ],
  standalone: true,
})
export class FiredevCmsEditComponent implements OnInit {
  public ViewMode: typeof ViewMode = ViewMode;
  public height: number = window.innerHeight - 150;
  public url: string;
  public text: string;
  public mode: ViewMode;
  public readonly originalMode: ViewMode;
  public readonly mediaType: CoreModels.MediaType;

  public get filePath() {
    return this.data.entity?.src;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: FiredevCmsEditDialogData,
    public dialogRef: MatDialogRef<FiredevCmsEditComponent>
  ) {
    this.mode = data.mode;
    this.originalMode = this.mode;
    if (this.mode !== ViewMode.Add) {
      this.mediaType = Helpers.mediaTypeFromSrc(data.entity.src);
    }
  }

  //#region hooks
  public async ngOnInit() {
    if (this.mediaType === 'image' || this.mediaType === 'audio') {
      this.url = window.URL.createObjectURL(
        this.data.entity.binaryData as Blob
      );
    }
    if (this.mediaType === 'text') {
      this.text = await Utils.binary.blobToText(
        this.data.entity.binaryData as any
      );
    }
  }

  public ngOnDestroy(): void {}
  //#endregion

  //#region methods
  close() {
    this.dialogRef.close();
  }

  save() {
    console.log('saving file');
  }

  toogleMode() {
    this.mode =
      this.mode === ViewMode.Preview ? this.originalMode : ViewMode.Preview;
  }
  //#endregion
}
