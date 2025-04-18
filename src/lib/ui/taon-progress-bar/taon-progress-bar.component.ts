//#region @browser
import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Observable, Subject, Subscription } from 'rxjs';
import { _ } from 'tnp-core/src';

import axios from 'axios';
// import {
//   NgProgressConfig,
//   NgProgressModule,
//   NgProgressRef,
// } from 'ngx-progressbar';
import { Taon } from 'taon/src';
// import { Models } from 'tnp-models';
// import type { TaonAdmin } from '../taon-admin-mode-configuration';

const calculatePercentage = (loaded, total) => Math.floor(loaded * 1.0) / total;
declare const ENV: any;

@Component({
  selector: 'taon-progress-bar',
  templateUrl: './taon-progress-bar.component.html',
  styleUrls: ['./taon-progress-bar.component.scss'],
  standalone: false,
})
export class TaonProgressBarComponent implements OnInit {
  @ViewChild('labProgress') labProgress: any; // NgProgressRef;
  @Input() isDesktop: boolean;
  admin: any;
  handlers: Subscription[] = [];
  // options: NgProgressConfig = _.merge(
  //   {
  //     min: 8,
  //     max: 100,
  //     speed: 200,
  //     trickleSpeed: 300,
  //     debounceTime: 0,
  //     ease: 'linear',
  //     spinnerPosition: 'right',
  //     direction: 'ltr+',
  //     color: 'gray',
  //     fixed: true,
  //     meteor: true,
  //     spinner: true,
  //     thick: false,
  //   },
  //   _.get(ENV, `plugins['ngx-progressbar']`),
  // );

  constructor() {}

  ngOnInit() {}

  ngOnDestroy(): void {
    this.handlers.forEach(h => h.unsubscribe());
  }

  ngAfterViewInit(): void {
    // this.labProgress.set(20)
    this.loadProgressBar(void 0, axios);
  }

  loadProgressBar(config, instance = axios) {
    // let requestsCounter = 0;

    // const setupStartProgress = () => {
    //   instance.interceptors.request.use(config => {
    //     requestsCounter++;
    //     this.labProgress.start();
    //     return config;
    //   });
    // };

    // const setupUpdateProgress = () => {
    //   const update = e => {
    //     // NProgress.inc(calculatePercentage(e.loaded, e.total))

    //     const percentage = calculatePercentage(e.loaded, e.total) * 100;
    //     // console.log(`loaded: ${e.loaded}, total: ${e.total} , pecent: ${percentage}`)
    //     this.labProgress.inc(percentage);
    //   };
    //   instance.defaults.onDownloadProgress = update;
    //   instance.defaults.onUploadProgress = update;
    // };

    // const setupStopProgress = () => {
    //   const responseFunc = response => {
    //     if (--requestsCounter === 0) {
    //       this.labProgress.complete();
    //       // NProgress.done()
    //     }
    //     return response;
    //   };

    //   const errorFunc = error => {
    //     if (--requestsCounter === 0) {
    //       this.labProgress.complete();
    //       // NProgress.done()
    //     }
    //     return Promise.reject(error);
    //   };

    //   instance.interceptors.response.use(responseFunc, errorFunc);
    // };

    // setupStartProgress();
    // setupUpdateProgress();
    // setupStopProgress();

    // //#region @websqlOnly
    // const SYMBOL = Taon.symbols;
    // let updateFun: Observable<number> = window[SYMBOL.WEBSQL_REST_PROGRESS_FUN];
    // if (!window[SYMBOL.WEBSQL_REST_PROGRESS_FUN]) {
    //   window[SYMBOL.WEBSQL_REST_PROGRESS_FUN] = new Subject();
    // }
    // updateFun = window[SYMBOL.WEBSQL_REST_PROGRESS_FUN];

    // let startFun: Subject<void> = window[SYMBOL.WEBSQL_REST_PROGRESS_FUN_START];
    // if (!window[SYMBOL.WEBSQL_REST_PROGRESS_FUN_START]) {
    //   window[SYMBOL.WEBSQL_REST_PROGRESS_FUN_START] = new Subject();
    // }
    // startFun = window[SYMBOL.WEBSQL_REST_PROGRESS_FUN_START];

    // let doneFun: Subject<void> = window[SYMBOL.WEBSQL_REST_PROGRESS_FUN_DONE];
    // if (!window[SYMBOL.WEBSQL_REST_PROGRESS_FUN_DONE]) {
    //   window[SYMBOL.WEBSQL_REST_PROGRESS_FUN_DONE] = new Subject();
    // }
    // doneFun = window[SYMBOL.WEBSQL_REST_PROGRESS_FUN_DONE];

    // this.handlers.push(
    //   updateFun.subscribe(loaded => {
    //     // console.log(`update: ${loaded}`)
    //     const total = 100;
    //     const percentage = calculatePercentage(loaded, total) * 100;
    //     // console.log(`set pecentage: ${percentage}`)
    //     this.labProgress.set(percentage);
    //   }),
    // );
    // this.handlers.push(
    //   startFun.subscribe(() => {
    //     // requestsCounter++;
    //     // console.log('START WEBSQL REQUEST')
    //     this.labProgress.start();
    //   }),
    // );

    // this.handlers.push(
    //   doneFun.subscribe(() => {
    //     // if ((--requestsCounter) === 0) {
    //     // console.log('DONE WEBSQL REQUEST')
    //     this.labProgress.complete();
    //     // NProgress.done()
    //     // }
    //   }),
    // );


    //#endregion
  }
}
//#endregion
