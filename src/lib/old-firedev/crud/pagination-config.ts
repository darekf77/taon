import { _ } from 'tnp-core/src';
import { CLASS } from 'typescript-class-helpers/src';

const DEFAULT_PAGE_SIZE = 10;

@CLASS.NAME('PaginationConfig')
export class PaginationConfig<T = any> {

  public static defaultConfig<T>() {
    return PaginationConfig.from<T>({} as any);
  }

  public static from<T>(dataObj: Partial<PaginationConfig>): PaginationConfig<T> {
    dataObj = _.omit(dataObj, ['content']);
    const instance = Object.assign(new PaginationConfig(), dataObj) as PaginationConfig;
    ([
      'totalElements',
      'totalPages',
      'number',
      'numberOfElements',
    ] as ((keyof PaginationConfig)[])).forEach((key) => {
      if (_.isUndefined(instance[key])) {
        // @ts-ignore
        instance[key] = 0;
      }
    });
    ([
      'hasNext',
      'hasPrevious',
      'first',
      'last',
      'pageable',
    ] as ((keyof PaginationConfig)[])).forEach((key) => {
      if (_.isUndefined(instance[key])) {
        // @ts-ignore
        instance[key] = false;
      }
    });
    if (_.isNil(instance.sortOrders)) {
      instance.sortOrders = [];
    }
    if (_.isNil(instance.size)) {
      instance.size = DEFAULT_PAGE_SIZE;
    }
    return instance;
  }

  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  numberOfElements?: number;
  size?: number;
  sortOrders?: any[];
  hasNext?: boolean;
  hasPrevious?: boolean;
  first?: boolean;
  last?: boolean;
  pageable?: boolean;
  private constructor() { }

  params() {
    const config = _.cloneDeep(this);
    const allowed = _.pick(config, ([
      'number',
      'size',
    ] as (keyof PaginationConfig)[]) as any);
    return Object
      .keys(allowed)
      .reduce((a, b) => {
        return _.merge(a, {
          ['page-' + b]: config[b],
        });
      }, {});
  }

  clone(): PaginationConfig {
    return _.merge(new PaginationConfig(), _.cloneDeep(this));
  }
}
