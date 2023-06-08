
export type PROGRESS_DATA_TYPE = 'info' | 'error' | 'warning' | 'event';

export interface IProgressData {
  /**
   * How man percent of
   */
  value?: number;
  msg?: string;
  type?: PROGRESS_DATA_TYPE;
  date?: Date;
}


export class ProgressData implements IProgressData {

  public static resolveFrom(chunk: string,
    callbackOnFounded?: (json: ProgressData) => any, checkSplit = true): ProgressData[] {

    let progress;
    let res: ProgressData[] = [];
    if (typeof chunk !== 'string') {
      return [];
    }
    chunk = chunk.trim();

    if (checkSplit) {
      const split = chunk.split(/\r\n|\n|\r/);
      if (split.length > 1) {
        // console.log('split founded', split)
        split.forEach(s => {
          res = res.concat(this.resolveFrom(s, callbackOnFounded, false));
        });
        return res;
      }
    }

    if (/\[\[\[.*\]\]\]/g.test(chunk)) {
      chunk = chunk.replace(/^\[\[\[/g, '').replace(/\]\]\]$/g, '');
      progress = chunk;
    }
    if (typeof progress !== 'undefined') {
      try {
        const p = JSON.parse(progress);
        const single = Object.assign(new ProgressData(), p);
        res = res.concat([single]);
        if (typeof callbackOnFounded === 'function') {
          callbackOnFounded(single);
        }
      } catch (err) {
        console.log(err);
        console.error(`ProgresssBarData: fail to parse "${progress}"`)
      }
    }
    return res;
  }



  constructor(
    public value: number = 0,
    public msg: string = '',

    public type: PROGRESS_DATA_TYPE = 'event',

    public date: Date = new Date()
  ) {

  }


}
