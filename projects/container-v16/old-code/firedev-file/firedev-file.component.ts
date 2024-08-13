//#region  imports
import {
  Component,
  ElementRef,
  HostBinding,
  Injector,
  Input,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { Firedev } from 'firedev/src';
import { FiredevFileHelpers } from './firedev-file.helpers';
import { crossPlatformPath, Helpers, path, _ } from 'tnp-core/src';
import { FiredevDisplayMode } from '../firedev.models';
import { FiredevFile } from './firedev-file';
import { FiredevFileDefaultAs, IFiredevFileType } from './firedev-file.models';
import { FiredevFileTypeArr } from './firedev-file.constants';
import type { FiredevAdmin } from '../firedev-admin-mode-configuration';

// import 'brace';
// import 'brace/mode/typescript';
// import 'brace/mode/json';
// import 'brace/theme/github';
// import 'brace/theme/twilight';
import { firstValueFrom, Observable, Subject } from 'rxjs';
import { DomSanitizer } from '@angular/platform-browser';
import { DEFAULT_HEIGHT, DEFAULT_WIDTH } from './firedev-file.constants';
import { FiredevFullMaterialModule } from '../firedev-full-material.module';
import { StaticColumnsModule } from 'static-columns/src';
import { FiredevInjectHTMLDirective } from '../shared/firedev-inject-html.directive';
import { Level, Log } from 'ng2-logger/src';
import { CommonModule } from '@angular/common';
const log = Log.create('firedev', Level.__NOTHING);
//#endregion

/**
 * @deprecated
 */
@Component({
  //#region component options
  selector: 'firedev-file',
  templateUrl: './firedev-file.component.html',
  styleUrls: ['./firedev-file.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FiredevFullMaterialModule,
    StaticColumnsModule,
    FiredevInjectHTMLDirective,
  ],
  //#endregion
})
export class FiredevFileComponent implements OnInit {
  //#region static
  static readonly scripts = {};
  static readonly styles = {};
  readonly scripts: any;
  readonly styles: any;

  private static cachedFiles = {} as {
    [src in string]: { [version in number]: FiredevFile };
  };
  private static cachedFilesLastVer = {} as { [src in string]: number };
  private static currentProcessing = {} as {
    [src in string]: Subject<FiredevFile>;
  };
  private static filesToCache = [
    'image',
    'html',
    'json',
    'js',
  ] as IFiredevFileType[];

  private static filesToCacheText = [
    'html',
    'json',
    'js',
  ] as IFiredevFileType[];
  //#endregion

  //#region fields & getters
  linksToRevoke = [];
  // tempFile?: File;
  tempText?: string;
  tempLink?: string;
  admin = window['firedev'] as FiredevAdmin;
  @Input() file: FiredevFile;
  @Input() insideAdmin = false;
  @Input() @HostBinding('style.width.px') @Input() width: number =
    DEFAULT_WIDTH;
  @Input() @HostBinding('style.height.px') @Input() height: number = 0;
  @Input() viewAs: FiredevFileDefaultAs;
  @Input() readonly src: string;
  @Input() offline: boolean;
  @ViewChild('audio') audio: any;
  @ViewChild('video') video: any;
  @ViewChild('image') image: any;
  @ViewChild('html') html: any;
  @ViewChild('json') json: any;
  @HostBinding('style.display') styleDisplay:
    | 'block'
    | 'inline-block'
    | 'none' = 'inline-block';

  get FiredevFile() {
    return FiredevFile;
  }

  //#region fields & getters / debouce init
  debounceInit = _.debounce(async () => {
    await this.init(false);
  }, 200);
  //#endregion

  //#region fields & getters / native element
  get nativeElement(): any {
    // const native = (this[this?.file.type] as ElementRef)?.nativeElement;
    // return native ? native : this[this?.file?.type];
    return this[this?.file?.type];
  }
  //#endregion

  //#region fields & getters / is selected in admin
  get isSelectedInAdmin() {
    return this.admin?.selectedFile?.src === this.file?.src;
  }
  //#endregion

  //#endregion

  //#region constructor
  constructor(private domSanitizer: DomSanitizer) {
    this.scripts = FiredevFileComponent.scripts;
    this.styles = FiredevFileComponent.styles;
  }
  //#endregion

  //#region hooks

  //#region hooks / on changes
  ngOnChanges(changes): void {
    // console.log(changes)
    this.debounceInit();
  }
  //#endregion

  //#region hooks / on init
  async ngOnInit() {
    if (_.isUndefined(this.offline)) {
      this.offline = true;
    }

    await this.init(true);
  }
  //#endregion

  //#region hooks / after view init
  async ngAfterViewInit() {
    //Called after ngAfterContentInit when the component's view has been initialized. Applies to components only.
    //Add 'implements AfterViewInit' to the class.
    // console.log({
    //   src: this.file?.src,
    //   type: this.file?.type,
    //   native: this.nativeElement
    // })
  }
  //#endregion

  //#region hooks / on destroy
  ngOnDestroy(): void {
    //Called once, before the instance is destroyed.
    //Add 'implements OnDestroy' to the class.
    if (this.file && this.file.src) {
      this.admin.unregister(this.file);
    }
    for (let index = 0; index < this.linksToRevoke.length; index++) {
      const link = this.linksToRevoke[index];
      URL.revokeObjectURL(link);
    }
  }
  //#endregion

  //#endregion

  //#region methods

  //#region methods / get file
  async getFile(src: string) {
    // console.log({
    //   'cachedFilesLastVer': FiredevFileComponent.cachedFiles
    // })

    if (_.isUndefined(FiredevFileComponent.currentProcessing[src])) {
      FiredevFileComponent.currentProcessing[src] = new Subject();
    } else {
      const obs = FiredevFileComponent.currentProcessing[
        src
      ] as Observable<FiredevFile>;
      const fromSubjectCache = await firstValueFrom(obs);
      // console.log('** subject cache ', fromSubjectCache);
      return fromSubjectCache;
    }

    let latestVersion: number;
    if (_.isUndefined(FiredevFileComponent.cachedFilesLastVer[src])) {
      latestVersion = await this.FiredevFile.getLatestVersion(src);
      FiredevFileComponent.cachedFilesLastVer[src] = latestVersion;
    } else {
      latestVersion = FiredevFileComponent.cachedFilesLastVer[src];
    }

    // console.log(`version for ${src}`, latestVersion)

    if (!FiredevFileComponent.cachedFiles[src]) {
      FiredevFileComponent.cachedFiles[src] = {};
    }

    if (
      // invalidate cache
      Object.keys(FiredevFileComponent.cachedFiles[src]).length > 0 &&
      _.isUndefined(FiredevFileComponent.cachedFiles[src][latestVersion])
    ) {
      //
      // console.log(`INVALIDATE CACHE FOR ${src}`)
      FiredevFileComponent.cachedFiles[src] = {};
    }

    if (_.isUndefined(FiredevFileComponent.cachedFiles[src][latestVersion])) {
      const bloblessFile = await this.FiredevFile.getBloblessBy(src);

      if (FiredevFileComponent.filesToCache.includes(bloblessFile.type)) {
        // only cache blob of images
        const fileBlob = await this.FiredevFile.getBlobOnlyBy(bloblessFile.src);
        bloblessFile.blob = fileBlob as any; // @ts-ignore
        bloblessFile.file = new File(
          [bloblessFile.blob],
          path.basename(_.first(bloblessFile.src.split('?')))
        );
        if (FiredevFileComponent.filesToCacheText.includes(bloblessFile.type)) {
          bloblessFile.text = await bloblessFile.file.text();
        }
      }
      FiredevFileComponent.cachedFiles[src][bloblessFile.version] =
        bloblessFile;
      FiredevFileComponent.cachedFilesLastVer[src] = bloblessFile.version;
      // console.log('** caching file ', bloblessFile)
      const obs = FiredevFileComponent.currentProcessing[
        src
      ] as Subject<FiredevFile>;
      obs.next(bloblessFile);
      obs.unsubscribe();
      delete FiredevFileComponent.currentProcessing[src];
      return bloblessFile; // => this file has blob
    } else {
      const fromCache = FiredevFileComponent.cachedFiles[src][latestVersion];
      // console.log('** file from cache ', fromCache)
      return fromCache;
    }
  }
  //#endregion

  //#region methods / init
  async init(firstTime: boolean) {
    if (!this.file) {
      this.file = await this.getFile(this.src);
    }

    if (FiredevFileComponent.filesToCache.includes(this.file.type)) {
      if (FiredevFileComponent.filesToCacheText.includes(this.file.type)) {
        if (!this.tempText) {
          this.tempText = await this.file.text;
        }
      } else {
        if (!this.tempLink) {
          this.tempLink = this.domSanitizer.bypassSecurityTrustUrl(
            URL.createObjectURL(this.file.file)
          ) as any;
          if (!this.linksToRevoke.includes(this.tempLink)) {
            this.linksToRevoke.push(this.tempLink);
          }
        }
      }
    }

    const isTag = this.viewAs === 'script-tag' || this.viewAs === 'css-tag';

    // if (firstTime) {

    // } else {
    //   this.viewAs = this.file.defaultViewAs;
    // }

    if (!this.viewAs || (!firstTime && !isTag)) {
      this.viewAs = this.file.defaultViewAs;
    }

    // if (this.viewAs === 'img-tag') {
    //   this.styleDisplay = 'inline-block'
    // }

    if (this.file.type === 'image' || isTag) {
      delete this.width;
    } else {
      this.width = DEFAULT_WIDTH;
    }

    if (this.viewAs === 'script-tag') {
      FiredevFileHelpers.loadScript(this.src, this);
    } else if (this.viewAs === 'css-tag') {
      FiredevFileHelpers.loadStyle(this.src, this);
    } else {
      this.styleDisplay = 'inline-block';
    }

    if (isTag) {
      this.styleDisplay = 'none';
      delete this.height;
    } else {
      this.height = DEFAULT_HEIGHT;
    }

    // console.log(`${this.src} viewas: ${this.file?.defaultViewAs}, ext ${this.file.ext}`)

    log.i(`display as ${this.viewAs}`);
    if (this.insideAdmin) {
      delete this.width;
      this.height = 300;
      this.styleDisplay = 'block';
    }

    if (this.file && !this.insideAdmin) {
      this.admin.register(this.file);
    }
  }
  //#endregion

  //#region methods / select to edit
  selectForEdit() {
    // console.log('SELECT FOR EDIT')
    this.admin.selectedFile = this.file;
  }
  //#endregion

  //#endregion
}
