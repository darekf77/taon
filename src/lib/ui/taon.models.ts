import { CoreModels } from 'tnp-core/src';

// export type TaonModeSimple = 'view' | 'edit' | 'add';

// export type TaonModeUser = `user-${TaonModeSimple}`
// export type TaonModeAdmin = `admin-${TaonModeSimple}`
export type TaonDisplayMode = 'view' | 'edit';

export interface TaonUploadedFile {
  data: Buffer;
  encoding: string;
  md5: string;
  mimetype: CoreModels.ContentType;
  mv: (path, callback) => any;
  name: string;
  truncated: boolean;
}
