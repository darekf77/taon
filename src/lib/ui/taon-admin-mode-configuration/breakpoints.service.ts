//#region imports

import { // TODO somehow backend build is touching this...
  BreakpointObserver,
  // @ts-ignore
} from '@angular/cdk/layout';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { _ } from 'tnp-core/src';
//#endregion

const BRK = {
  mobile: '(max-width: 599.98px)',
  // tablet: obsvious
  desktop: '(min-width: 840.00px)',
};

@Injectable({ providedIn: 'root' })
export class BreakpointsService {
  private sub = new Subject<'mobile' | 'tablet' | 'desktop'>();

  public listenTo() {
    setTimeout(() => {
      this.sub.next(this.current);
    });
    return this.sub.asObservable();
  }

  private current: 'mobile' | 'tablet' | 'desktop';

  constructor(breakpointObserver: BreakpointObserver) {
    breakpointObserver.observe([BRK.mobile, BRK.desktop]).subscribe(state => {
      if (!_.isUndefined([BRK.mobile].find(f => state.breakpoints[f]))) {
        this.current = 'mobile';
        this.sub.next('mobile');
      } else if (
        !_.isUndefined([BRK.desktop].find(f => state.breakpoints[f]))
      ) {
        this.current = 'desktop';
        this.sub.next('desktop');
      } else {
        this.current = 'tablet';
        this.sub.next('tablet');
      }
    });

    setTimeout(() => {
      if (breakpointObserver.isMatched([BRK.mobile])) {
        this.current = 'mobile';
        this.sub.next('mobile');
      } else if (breakpointObserver.isMatched([BRK.desktop])) {
        this.current = 'desktop';
        this.sub.next('desktop');
      } else {
        this.current = 'tablet';
        this.sub.next('tablet');
      }
    });
  }
}
