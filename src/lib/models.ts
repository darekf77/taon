import { Response, RequestHandler } from 'express';
import { Response as ExpressResponse, Request as ExpressRequest } from 'express';
import { Models as ModelsNg2Rest } from 'ng2-rest';


import { CLASS } from 'typescript-class-helpers';


export namespace Models {

  export import Rest = ModelsNg2Rest;

  export type ContextENDPOINT = { target: Function; initFN: Function; };

  export type FormlyFromType = 'material' | 'bootstrap';


  export type ExpressContext<T> = (req: ExpressRequest, res: ExpressResponse) => T;

  export type SyncResponse<T> = string | T;

  export type ResponseFuncOpt<T> = {
    limitSize?: (enties: Function | Function[], include: string[], exclude: string[]) => void;
  }

  export type SyncResponseFunc<T> = (options?: ResponseFuncOpt<T>) => SyncResponse<T>;
  export type MixResponse<T> = SyncResponse<T> | ExpressContext<T>;

  export interface ClientAction<T> {
    received?: Rest.PromiseObservableMix<Rest.HttpResponse<T>>;
  }

  export interface __Response<T> {
    //#region @websql
    send?: MixResponse<T>;
    //#endregion
  }

  export interface AsyncResponse<T> {
    (req?: ExpressRequest, res?: ExpressResponse): Promise<SyncResponse<T> | SyncResponseFunc<T>>;
  }

  export type Response<T = string> = (__Response<T> | AsyncResponse<T>) & ClientAction<T> & __Response<T>;

  export class Errors {

    public toString = (): string => {
      return this.message
    }

    private constructor(public message: string, private code: ModelsNg2Rest.HttpCode = 400) {

    }

    private static create(message: string, code: ModelsNg2Rest.HttpCode = 400) {
      return new Errors(message, code);
    }

    public static entityNotFound(entity?: Function) {
      return Errors.create(`Entity ${CLASS.getName(entity)} not found`);
    }

    public static custom(message: string, code: ModelsNg2Rest.HttpCode = 400) {
      return Errors.create(message, code);
    }

  }

  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types

  // export enum MimeTypes {
  //   ".aac" = "audio/aac",
  //   ".abw" = "application/x-abiword",
  //   ".arc" = "application/x-freearc",
  //   ".avi" = "video/x-msvideo",
  //   ".azw" = "application/vnd.amazon.ebook",
  //   ".bin" = "application/octet-stream",
  //   ".bmp" = "image/bmp",
  //   ".bz" = "application/x-bzip",
  //   ".bz2" = "application/x-bzip2",
  //   ".csh" = "application/x-csh",
  //   ".css" = "text/css",
  //   ".csv" = "text/csv",
  //   ".doc" = "application/msword",
  //   ".docx" = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  //   ".eot" = "application/vnd.ms-fontobject",
  //   ".epub" = "application/epub+zip",
  //   ".gz" = "application/gzip",
  //   ".gif" = "image/gif",
  //   ".htm" = "text/html",
  //   ".html" = "text/html",
  //   ".ico" = "image/vnd.microsoft.icon",
  //   ".ics" = "text/calendar",
  //   ".jar" = "application/java-archive",
  //   ".jpeg" = ".jpg",
  //   ".js" = "text/javascript",
  //   ".json" = "application/json",
  //   ".jsonld" = "application/ld+json",
  //   ".mid" = ".midi",
  //   ".mjs" = "text/javascript",
  //   ".mp3" = "audio/mpeg",
  //   ".mpeg" = "video/mpeg",
  //   ".mpkg" = "application/vnd.apple.installer+xml",
  //   ".odp" = "application/vnd.oasis.opendocument.presentation",
  //   ".ods" = "application/vnd.oasis.opendocument.spreadsheet",
  //   ".odt" = "application/vnd.oasis.opendocument.text",
  //   ".oga" = "audio/ogg",
  //   ".ogv" = "video/ogg",
  //   ".ogx" = "application/ogg",
  //   ".opus" = "audio/opus",
  //   ".otf" = "font/otf",
  //   ".png" = "image/png",
  //   ".pdf" = "application/pdf",
  //   ".php" = "application/php",
  //   ".ppt" = "application/vnd.ms-powerpoint",
  //   ".pptx" = "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  //   ".rar" = "application/vnd.rar",
  //   ".rtf" = "application/rtf",
  //   ".sh" = "application/x-sh",
  //   ".svg" = "image/svg+xml",
  //   ".swf" = "application/x-shockwave-flash",
  //   ".tar" = "application/x-tar",
  //   ".tif" = "image/tiff",
  //   ".tiff" = "image/tiff",
  //   ".ts" = "video/mp2t",
  //   ".ttf" = "font/ttf",
  //   ".txt" = "text/plain",
  //   ".vsd" = "application/vnd.visio",
  //   ".wav" = "audio/wav",
  //   ".weba" = "audio/webm",
  //   ".webm" = "video/webm",
  //   ".webp" = "image/webp",
  //   ".woff" = "font/woff",
  //   ".woff2" = "font/woff2",
  //   ".xhtml" = "application/xhtml+xml",
  //   ".xls" = "application/vnd.ms-excel",
  //   ".xlsx" = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  //   ".xml" = "XML",
  //   ".xul" = "application/vnd.mozilla.xul+xml",
  //   ".zip" = "application/zip",
  //   ".3gp" = "video/3gpp",
  //   ".3g2" = "video/3gpp2",
  //   ".7z" = "application/x-7z-compressed"
  // }


  // or as object

  export const mimeTypes = {

    ".aac": "audio/aac",
    ".abw": "application/x-abiword",
    ".arc": "application/x-freearc",
    ".avi": "video/x-msvideo",
    ".azw": "application/vnd.amazon.ebook",
    ".bin": "application/octet-stream",
    ".bmp": "image/bmp",
    ".bz": "application/x-bzip",
    ".bz2": "application/x-bzip2",
    ".csh": "application/x-csh",
    ".css": "text/css",
    ".csv": "text/csv",
    ".doc": "application/msword",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".eot": "application/vnd.ms-fontobject",
    ".epub": "application/epub+zip",
    ".gz": "application/gzip",
    ".gif": "image/gif",
    ".htm": "text/html",
    ".html": "text/html",
    ".ico": "image/vnd.microsoft.icon",
    ".ics": "text/calendar",
    ".jar": "application/java-archive",
    ".jpeg": ".jpg",
    ".js": "text/javascript",
    ".json": "application/json",
    ".jsonld": "application/ld+json",
    ".mid": ".midi",
    ".mjs": "text/javascript",
    ".mp3": "audio/mpeg",
    ".mpeg": "video/mpeg",
    ".mpkg": "application/vnd.apple.installer+xml",
    ".odp": "application/vnd.oasis.opendocument.presentation",
    ".ods": "application/vnd.oasis.opendocument.spreadsheet",
    ".odt": "application/vnd.oasis.opendocument.text",
    ".oga": "audio/ogg",
    ".ogv": "video/ogg",
    ".ogx": "application/ogg",
    ".opus": "audio/opus",
    ".otf": "font/otf",
    ".png": "image/png",
    ".pdf": "application/pdf",
    ".php": "application/php",
    ".ppt": "application/vnd.ms-powerpoint",
    ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    ".rar": "application/vnd.rar",
    ".rtf": "application/rtf",
    ".sh": "application/x-sh",
    ".svg": "image/svg+xml",
    ".swf": "application/x-shockwave-flash",
    ".tar": "application/x-tar",
    ".tif": "image/tiff",
    ".tiff": "image/tiff",
    ".ts": "video/mp2t",
    ".ttf": "font/ttf",
    ".txt": "text/plain",
    ".vsd": "application/vnd.visio",
    ".wav": "audio/wav",
    ".weba": "audio/webm",
    ".webm": "video/webm",
    ".webp": "image/webp",
    ".woff": "font/woff",
    ".woff2": "font/woff2",
    ".xhtml": "application/xhtml+xml",
    ".xls": "application/vnd.ms-excel",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xml": "XML",
    ".xul": "application/vnd.mozilla.xul+xml",
    ".zip": "application/zip",
    ".3gp": "video/3gpp",
    ".3g2": "video/3gpp2",
    ".7z": "application/x-7z-compressed"

  }

  //#region @websql
  export interface AuthCallBack {
    (methodReference: Function): RequestHandler;
  }

  //#endregion

}
