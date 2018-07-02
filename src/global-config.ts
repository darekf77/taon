
import { isBrowser, isNode } from "ng2-logger";

//#region @backend
import { Connection } from 'typeorm';
import { Application } from "express";
//#endregion

export class Global {

    public expressPath: string;
    public url: URL;
    public productionMode = false;
    public controllers: Function[] = []
    public __core_controllers: Function[] = []
    public entities: Function[] = []
    public __core_entities: Function[] = []
    public initFunc: { initFN: Function, target: Function }[] = [];


    public allowedHosts: URL[] = [];
    //#region @backend
    public app: Application;
    public socket: any;
    public connection: Connection;
    //#endregion


    public static vars = new Global();


    private get(key) {
        //#region @backend
        if (isNode) {
            return global[key];
        }
        //#endregion
        if (isBrowser) {
            return window[key];
        }
    }

    private set(value, key) {
        //#region @backend
        if (isNode) {
            global[key] = value;
        }
        //#endregion
        if (isBrowser) {
            window[key] = value;
        }
    }

}
