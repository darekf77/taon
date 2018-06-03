import {
    ClassConfig, MethodConfig, ParamConfig, ParamType,
    CLASS_META_CONFIG, Response, isNode, isBrowser,
    ENDPOINT_META_CONFIG, SOCKET_MSG, MAPPING_CONFIG_HEADER
} from "./models";
import { HttpMethod } from "ng2-rest";

declare var require: any;

import { tryTransformParam } from "./helpers";

if (isBrowser) {
    var { Resource } = require("ng2-rest");
    var io = require('socket.io-client');
}


export function replay(model: string, method: HttpMethod) {
    if (!model || !method) {
        console.warn(`Incorrect method ${method} and model ${model}`);
        return;
    }
    console.info(`replay ${model}, ${method}`)
    const uri: URL = window['uri'];
    const endpoints = window[ENDPOINT_META_CONFIG];
    // console.log('window', window)
    // console.log('endpoints', endpoints)
    const endpoint = uri.href;
    const rest = endpoints[endpoint][model];
    // console.log('rest', rest)
    if (rest) {
        rest.replay(method);
    } else {
        console.warn(`No used method ${method} from ${endpoint}/${model}`);
    }
}

export function initRealtime() {
    const uri: URL = window['uri'];
    const socket = io(uri.href);
    socket.emit('chat message');
    socket.on(SOCKET_MSG, function (msg) {
        if (msg && Array.isArray(msg.pathes)) {
            msg.pathes.forEach(p => replay(p, msg.method))
        }
    });
}


export function initMethodBrowser(target, type: HttpMethod, m: MethodConfig, expressPath) {
    target.prototype[m.name] = function (...args) {

        const uri: URL = window['uri'];
        if (!window[ENDPOINT_META_CONFIG]) window[ENDPOINT_META_CONFIG] = {};
        if (!window[ENDPOINT_META_CONFIG][uri.href]) window[ENDPOINT_META_CONFIG][uri.href] = {};
        const endpoints = window[ENDPOINT_META_CONFIG];
        let rest;
        if (!endpoints[uri.href][expressPath]) {
            rest = Resource.create(uri.href, expressPath, MAPPING_CONFIG_HEADER);
            endpoints[uri.href][expressPath] = rest;
        } else {
            rest = endpoints[uri.href][expressPath];
        }


        const method = type.toLowerCase();
        const isWithBody = (method === 'put' || method === 'post');
        const pathPrams = {};
        const queryParams = {};
        let item = {};
        args.forEach((param, i) => {
            let currentParam: ParamConfig;
            //#region find param
            for (let pp in m.parameters) {
                let v = m.parameters[pp];
                if (v.index === i) {
                    currentParam = v;
                    break;
                }
            }
            //#endregion
            // debugger
            if (currentParam.paramType === 'Path') {
                pathPrams[currentParam.name] = param;
            }
            if (currentParam.paramType === 'Query') {
                queryParams[currentParam.name] = param;
            }
            if (currentParam.paramType === 'Header') {
                if (currentParam.name) {
                    Resource.Headers.request.set(currentParam.name, param)
                } else {
                    for (let header in param) {
                        Resource.Headers.request.set(header, param[header])
                    }
                }
            }
            if (currentParam.paramType === 'Cookie') {
                Resource.Cookies.write(currentParam.name, param, currentParam.expireInSeconds);
            }
            if (currentParam.paramType === 'Body') {
                if (currentParam.name) {
                    item[currentParam.name] = param;
                } else {
                    item = param;
                }
            }
        });
        // debugger;
        return {
            received: isWithBody ? rest.model(pathPrams)[method](item, [queryParams]) : rest.model(pathPrams)[method]([queryParams])
        }
    };
}
