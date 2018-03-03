


import {     ENDPOINT, GET, POST, PUT, DELETE, isNode,     PathParam, QueryParam, CookieParam, HeaderParam, BodyParam,     Response, OrmConnection, Errors, isBrowser } from 'morphi/browser';

import { Connection } from "typeorm/browser/connection/Connection";


import { Resource, HttpResponse, HttpResponseError } from "ng2-rest/browser";
export { HttpResponse } from "ng2-rest/browser";
import { Log, Level } from 'ng2-logger/browser';
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject";
const log = Log.create('AuthController');

import { USER, IUSER } from '../entities/USER';
import { SESSION } from '../entities/SESSION';
import { EMAIL } from '../entities/EMAIL';
import { EMAIL_TYPE, EMAIL_TYPE_NAME } from '../entities/EMAIL_TYPE';
import { __ } from '../helpers';

const entity = {
    USER: __(USER),
    EMAIL: __(EMAIL),
    SESSION: __(SESSION),
    EMAIL_TYPE: __(EMAIL_TYPE),
};


export interface IHelloJS {
    authResponse: {
        state: string;
        access_token: string;
        expires_in: number;
        client_id: string;
        network: string;
        display: string;
        redirect_uri: string;
        scope: string;
        expires: number;
    };
    network: 'facebook' | 'google' | 'twitter';
    data: IFacebook;
}

export interface IFacebook {
    email: string;
    firstname: string;
    lastname: string;
    name: string;
    timezone: number;
    verified: boolean;
    id: string;
    picture: string;
    thumbnail: string;
}


@ENDPOINT({
    auth: (method) => {
return undefined;    }
})
export class AuthController {

    @OrmConnection connection: Connection;

    constructor() {
        this.browser.init()
    }

    private _subIsLggedIn = new Subject<boolean>();
    isLoggedIn = this._subIsLggedIn.asObservable();

    public get browser() {
        const self = this;
        return {
            async init() {
                if (isNode) {
                    return;
                }
                const session = SESSION.fromLocalStorage()
                if (!session) {
                    self.browser.logout();
                    return
                }
                if (session.isExpired()) {
                    self.browser.logout(session);
                    return
                }
                self.browser.authorize(session)
            },
            async login({ username, password }) {
                log.i('username', username)
                log.i('password', password)
                try {
                    const session = await self.login({
                        username, password
                    } as any).received
                    log.i('session', session.body.json)
                    self.browser.authorize(session.body.json);
                } catch (error) {
                    log.er(error)
                }
            },
            async authorize(session: SESSION) {
                session.saveInLocalStorage();
                session.activateBrowserToken();
                try {
                    const info = await self.info().received
                    log.i('info', info)
                    self._subIsLggedIn.next(true)
                } catch (error) {
                    const err: HttpResponseError = error;
                    log.er(error)
                    if (err.statusCode === 401) {
                        self.browser.logout(session);
                    }
                }
            },
            async logout(session?: SESSION) {
                self._subIsLggedIn.next(false)
                if (session) {
                    try {
                        const data = await self.logout()
                        log.i('Is proper logout ?', data)
                    } catch (error) {
                        log.er(error)
                    }
                }
                SESSION.removeFromLocalStorage();
            }
        }

    }


    @GET('/')
    info(): Response<USER> {
return undefined;    }

    @GET('/check/exist/:username_or_email')
    checkExist( @PathParam('username_or_email') param: string): Response<Boolean> {
return undefined;    }

    @POST('/logout')
    logout(): Response<boolean> {
return undefined;    }

    @POST('/login')
    login( @BodyParam() body: IHelloJS & IUSER): Response<SESSION> {
return undefined;    }

    get __authorization() {
return undefined;    }

    
    get __handle() {
return undefined;    }

    
    private get __validate() {     
return undefined;    }
    

    
    get __check() {
return undefined;    }
    

    private async __repos() {
return undefined;    }

    private async  __token(user: USER, ip: string) {
return undefined;    }

    private async __createUser(formData: IUSER, EmailTypeName: EMAIL_TYPE_NAME) {
return undefined;    }

    private async __mocks() {
return undefined;    }

    private async __init() {
return undefined;    }


}

export default AuthController;
