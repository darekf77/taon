import { RealtimeNodejs } from './realtime-nodejs';
import { RealtimeBrowser } from './realtime-browser';

export const Realtime = {

  nodejs: new RealtimeNodejs(),

  browser: new RealtimeBrowser()

}
