import { RealtimeBase } from '../realtime';


export class FrameworkContextBase {

  realtime: RealtimeBase;
  initRealtime() {
    throw '[FrameworkContextBase][initRealtime] Please override and call this funciton';
  }

}
