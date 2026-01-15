## Files structure

Taon has very flexible structure for build apps and libraries. Each project
can is at the same time library and app. File `taon.jsonc` tells taon cli
crucial structure information about project (when building/releasing etc.).

### Types of projects

Taon has 2 types of projects:

- **standalone** 
  + simple project with source code inside `/src` folder
  + watch mode for development
- **container** 
  + contains multiple *standalone* projects <br>
  + all projects can be init/clean/build/release together <br>
  (you have to add "all" suffix like *build:all*)
  + not possible watch mode for development with all packages

#### Standalone

Each taon project should have distinct name that follows
npm package naming convention (but without @,.,_/).

To simplify development process (in standalone project):
npm name, folder basename name and package.json name property are equal by default
(you can override npm name with property "overrideNpmName" inside `taon.jsonc`).

Command `taon init` will make sure that `package.json name property`
is the same as basename of project folder.

#### Container

Scoped/organization projects are simply standalone projects inside container
(with proper "**organization : true**" in `taon.jsonc`).

Name of publish package is taken from container name:

`@parent-container/my-package-name`

### Isomorphic compiled npm package

Isomorphic npm package contains all necessary js (or mjs) files
for backend and frontend:

```bash
# Structure of isomorphic library

/lib # all backend es5 javascript code
/browser # browser code for normal NodeJs/Angular development
/websql # special version of browser code for WEBSQL development
/scss # folder with all scss file from /src
/bin # cli related files
/assets/shared # shared assets from project /src/assets/shared folder
```

## Rules of writing taon code

During development of taon apps/libs we must know
that some files are by default only for
browser/frontend purpose or just for NodeJs/backend
purpose.

Good practice here is to write each isomorphic
files in the way that we can use it in backend
and frontend without any additional work.

### Files with special extensions

\+ Frontend only files (available also in websql backend mode)

- ***.browser.ts** (-- any file --)
- ***.component.ts** *(angular components)*
- ***.container.ts** *(angular container components)*
- ***.directive.ts**  *(angular directives)*
- ***.pipe.ts**  *(angular pipes)*
- ***.module.ts** *(angular modules)*
- ***.service.ts** *(angular services)*
- ***.store.ts** *(ngrx store)*
- ***.actions.ts**  *(ngrx actions )*
- ***.effects.ts** *(ngrx effects)*
- ***.reducers.ts** *(ngrx directives)*
- ***.selectors.ts** *(ngrx selectors)*
- ***.routes.ts** *(angular router files)*

additionally **all .css, sass, .html** are not available for NodeJS backend code

\+ Backend only files (available also in WEBSQL mode)

- ***.test.ts** *(mocha/sinon backend tests)*
- ***.spec.ts** *(jest tests files)*
- ***.cy.ts** *(cypress tests files)*

\+ Backend only files (not available in WEBSQL)

- ***.backend.ts** *(nodejs backend code)*

PLEASE REMEMBER THAT **example-file-name-backend.ts** is NOT a NodeJS backend only code.

### Code regions

Taon framework splits each *.ts to different
temporary source folder that serve different purposes. From original*.ts files code regions/lines
are removed based on region tag.

\+ **Code for NodeJs/Websql backend:**

`//#region @websql`

  /*code*/
  
   `//#endregion`

\+ **Same as above for function return :**

`//#region @websqlFunc`

  /*code*/
  
  `//#endregion`

*When you should use @websql, @websqlFunc:*
\-> generally this should be most often used
tool for striping backend code (you never know if
some of your backend files are going to be
needed on frontend for some reason)

```ts
function myFunc():string {
  //@websqlFunc
  return 'hello in backend'l
  //#endregion
}

// in browser (not WEBSQL mode) there will be
function myFunc():string {
  /**/
  /**/
  return void 0; // void 0 means undefined
}
```

\+ **Code only for NodeJS/backend:**

`//#region @backend`

  /*code*/
  
  `//#endregion`

\+ **Same as above, but returns "undefined" as result function:**

`//#region @backendFunc`
  
  /*code*/
  
`//#endregion`

*When you should use @backend, @backendFunc:* ?

\-> for deleting code that can't be mocked in websql mode


```ts
function whatIsMyOs():string {
  //@backendFunc
  return os.getName();
  //#endregion
}

// in browser there will be
function myFunc():string {
  /**/
  /**/
  return void 0; // void 0 means undefined
}
```

\+ **Code only for browser:**

`//#region @browser`

 /*code*/

`//#endregion`

*When you should use @browser* ?

\-> for frontend code that for some reason can't be executed/imported in NodeJS backend

\+ **Code only for websql mode (not available for NodeJs backend):**

`//#region @websqlOnly`  

/*code*/

`//#endregion`

*When you should use @websqlOnly* ?

\-> when you are converting NodeJS only backend to websql mode friendly backend

### Inline imports/exports code removal
Taon lets you exclude from backend(or browser, or websql) code specific imports/exports by 
setting special tag at the end of import/export (not above, not below - at the end)<br>

When you automatically orders your imports/export with prettier/eslint - every tag is being preserved.
<br><br>
*Taon code*
```ts
import {
  Taon,
  Connection,
} from 'taon/src';
import fse from 'fs-extra'; // @backend
import {
  tap,
  filter,
} from 'rxjs'; // @browser

import { User } from './user';
const lodash= require('lodash'); // @backend TAG DOES NOT WORK
```
<br><br>
*backend*
```ts
import {
  Taon,
  Connection,
} from 'taon/src';
import fse from 'fs-extra'; // @backend
/* */
/* */
/* */
/* */

import { User } from './user';
const lodash= require('lodash'); // @backend TAG DOES NOT WORK
```
<br><br>
*browser*
```ts
import {
  Taon,
  Connection,
} from 'taon/src';
/* */
import {
  tap,
  filter,
} from 'rxjs'; // @browser

import { User } from './user';
const lodash= require('lodash'); // @backend TAG DOES NOT WORK
```

## Taon TypeScript building blocks

Taon powerful class based api let you build
app with robust approach.

Each building block (Context, Entity, Controller, Subscriber, Migration, Repository, Provider)
works well with inheritance and allows you to achieve the highest possible
 level of abstraction.

### Taon context

Purpose of taon context:

- There are 2 types of contexts<br>
  -> **Abstract** (abstract:true) - use in shared lib code<br>
  -> **Active** (abstract:false) - use in app code with HOST_CONFIG and automatic MIGRATIONS_FOR_your context object<br>
- aggregates all (backend + frontend bridge) building blocks
- starts TCP/Sockets/IPC server <br>
- multiple contexts === multiple servers in 1 NodeJs app in development
- **deployable config** => all detected configs from /src/app.* or /src/app/**/*.*
- each **deployable** config is automatically a seprated NodeJS process when deployed
- initialization of database (only 1 db per context allowed)

```ts
import { Taon, TaonBaseContext } from 'taon/src';

const MainAbstractContext = Taon.createContext(() => ({
  abstract: true,
  disabledRealtime: true, // childrent do not inherit this
  contextName: 'MainAbstractContext',
  contexts: { TaonBaseContext }, 
  // TaonBaseContext almost always needed
  controllers: {
    UserController,
  },
  entities: {
    User,
  },
  // ...also migrations, repositories, providers, subscribers etc. here
  database: true,
  logs: true,
}));

// automatically detected by Taon CLI
// HOST_CONFIG => generated in app.hosts.ts
const DeployableActiveContext = Taon.createContext(() => ({
  ...HOST_CONFIG['DeployableActiveContext'], 
  // generated HOST_CONFIG includes contextName, host,
  // frontendHost and more...

  contexts: { MainAbstractContext },
   // everything inherited from MainAbstractContext
}));

@TaonEntity({className:'User'})
export ExtendedUser extends User {
  @StringColumn()
  middleName:string;
}

const BiggerBackendActiveContext = Taon.createContext(() => ({
  ...HOST_CONFIG['BiggerBackendActiveContext'], 
  disabledRealtime: trie,
  contexts: { 
    TaonBaseContext,
    MainAbstractContext, 
    // classes/frameowrk building blocks
    // inherited from MainAbstractContext
  },
  entities: {
    User: ExtendedUser 
    // decorating User entity
  }
  // same for:
  // migrations, repositories, providers etc.
  database: true,
  logs: true,
}));

async function start() {

  await DeployableActiveContext.initialize(); 
  // you should initialize all your deployable configs in start function

  await BiggerBackendActiveContext.initialize(); 
  // you have to initialize you config before using


 //... 
}

```
Context can be use also as a way to accecss remote 
backend <br> (**remoteHost** property).<br>
 With context templates you can easily share code of local or remote servers.
```ts
export const UserContextTemplate = Taon.createContextTemplate(() => ({
  contextName: 'TaonPortsContext',
  contexts: { TaonBaseContext },
  controllers: { UserController },
  entities: { User },
  migrations: { ...MIGRATIONS_CLASSES_FOR_TaonPortsContext },
  skipWritingServerRoutes: true,
  logs: {
    migrations: true,
  },
}));

// UserContextTemplate as any; => for now required.. TypeScript can't handle it
const localConfig = UserContextTemplate;
const remoteConfig = UserContextTemplate;

export async start() {
await localConfig.initialize(); // normal context (creates server and db)

// whole context is being reused -> only remote host added for remote requests
await remoteConfig.initialize({ // remote context
  overrideRemoteHost: `http://remote.server.com`,
});

const users = ( // remote users
  await remoteConfig.getClassInstance(UserController).getAll().request()
).body?.json;

console.log({
  'users remote backend': users,
});

}

```


### Taon entities

Entity class that can be use as Dto. Based no typeorm entites https://typeorm.io/entities

```ts
@TaonEntity({ className: 'User' })
class User extends TaonBaseAbstractEntity { // id, version included
  //#region @websql
  @StringColumn()
  //#endregion
  name?: string;
}
```


```ts
@TaonEntity({ className: 'Project' })
class Project extends TaonBaseEntity {
  //#region @websql
  @StringColumn()
  //#endregion
  location?: string;
}
```

### Taon controller

Injectable to angular's api service -
glue/bridge between backend and frontend.

```ts
@TaonController({ className: 'UserController' })
class UserController extends TaonBaseCrudController<User> {
   // This crud controllers there are methods like getAll(), update() etc.
   // Crud controller structure is similar to taon repository for entity 
   // structure.

   @GET()
    helloWorld(): Taon.Response<string> {
      //#region @websqlFunc
      return async (req, res) => 'hello world';
      //#endregion
    }
}
```

and crud controller with automatically generated REST API:

```ts
@TaonController({ className: 'UserController' })
class UserController extends TaonBaseCrudController<User> {
  entityClassResolveFn = () => User; // crud controller for quick entity rest api

  @GET() // acessible on in browser code
  whatTimeIsIt(): Taon.Response<string> {
    return async () => {
      return new Date().toString();
    };
  }
}
```
### Taon api service

Api service is a place where you can:
- inject your taon controllers 
- modify reposnse or request for backend
- keep a state (service i) 

```ts
@Injectable({
  // PLEASE DON'T USE providedIn:'root' - This should not be a singleton 
  // for whole application -> only for specyfic injected context
})
export class UserApiService extends TaonBaseAngularService {
  // for now - only injectable here are controllers
  // controllers should be a "glue" between backend and frontend
  userControlller = this.injectController(UserController);

  getAll() { // observables api
    return this.userControlller.getAll()
      .request({
        // axios request config
      })
      .observable
      .pipe(map(r => r.body.json));
  }

  async getTime() { // proimses api
    const data = await this.userControlller.whatTimeIsIt().request();
    // old api uses .received instead .request()
    // const data = await this.userControlller.whatTimeIsIt().received; 
    return data.body.text;
  }
}
```

### Taon repositories

Injectable (service like) classes for backend db communication
(similar to <https://typeorm.io/custom-repository>). 

You should use Repositories only inside server code.

```ts
@TaonRepository({
  className: 'UserRepository',
}) 
export class UserRepository extends TaonBaseRepository<User> {
  entityClassResolveFn = () => User;
  
  async findByEmail(email: string) {
    //#region @websqlFunc
    return this.repo.findOne({ where: { email } });
    //#endregion
  }
}
```
There is also a way to create custom repository without crud methods
```ts

@TaonRepository({ className: 'TaonBaseCustomRepository' })
export abstract class TaonBaseCustomRepository extends TaonBaseInjector {
  // your custom methods
}

```

### Taon subscribers

Injectable classes for subscribing to
entity events base on <https://typeorm.io/listeners-and-subscribers>

You should use Subscribers only inside server code.

```ts
@TaonSubscriber({
  className: 'TaonSubscriber',
})
export class TaonSubscriber extends TaonBaseSubscriberForEntity {
  listenTo() {
    return UserEntity;
  }

  afterInsert(entity: any) {
    console.log(`AFTER INSERT: `, entity);
    MainContext.realtime.server.triggerEntityTableChanges(UserEntity);
  }
}
```

### Taon providers

Injectable (service like) classes singleton (in context) classes.


```ts
@TaonProvider({
  className: 'TaonConfigProvier',
})
export class TaonConfigProvier extends TaonBaseProvider {
  config = {
    lang: 'en',
    country: 'Poland'
  }
}
```

### Taon middlewares

Taon middlewares/interceptor are inspired by express js middlewares
and angular http interceptors. Isomorphic nature of middlewares 
gives you great control over you backend and frontend requests.
Middlewares just like other taon building blocks are injectable
(singleton classes) and works well with inheritance.

There are 3 way of using taon middlewares/interceptors:

- in whole context (implement interceptServer or interceptServer)

- in specific controller for all methods 
(implement only interceptServerMethod or interceptClientMethod)

- in specific controller method  
(implement only interceptServerMethod or interceptClientMethod)

```ts
@TaonMiddleware({
  className: 'MyMiddlewareInterceptor',
})
export class MyMiddlewareInterceptor extends TaonBaseMiddleware {

  /**
   * if you want your interceptor to NOT BE global in context.. set:
   * interceptServer = undefined
   */
  interceptServer({ req, res, next, }: TaonServerMiddlewareInterceptOptions): Promise<void> | void {
    console.log('intercepting server request in whole context', req?.url);
    next();
  }

  /**
   * if you want your interceptor to NOT BE global in context.. set:
   * interceptClient = undefined
   */
  interceptClient({
    req,
    next,
  }: TaonClientMiddlewareInterceptOptions): Observable<AxiosResponse<any>> {
    console.log('intercepting evert client request in whole context', req?.url);
    return next.handle(req);
  }

  /**
   * Similar to express js middleware
   */
  interceptServerMethod(
    { req, res, next }: TaonServerMiddlewareInterceptOptions,
    {
      methodName,
      expressPath,
      httpRequestType,
    }: TaonAdditionalMiddlewareMethodInfo,
  ): Promise<void> | void {
    console.log(
      `Intercepting server method: ${methodName} as ${expressPath}`,
    );
    // async/await supported
    next();
  }

  /**
   * Similar to angular http interceptor (but axios based)
   */
  interceptClientMethod(
    { req, next }: TaonClientMiddlewareInterceptOptions,
    {
      methodName,
      expressPath,
      httpRequestType,
    }: TaonAdditionalMiddlewareMethodInfo,
  ): Observable<AxiosResponse<any>> {
    console.log(
      `Intercepting client method: ${methodName} at ${expressPath}`,
    );
    // user rxjs just like in angular http interceptor
    return next.handle(req).pipe(
      map(r => {
        console.log('data', r.data);
        r.data = `!!!${r.data}!!`;
        return r;
      }),
    );
  }
}
```
Example of using middlewares in controller and method:
```ts
@TaonController({
  className: 'SessionController',
  middlewares: ({ parentMiddlewares }) => ({
      ...parentMiddlewares,
      SessionMiddleware,
  }),
})
export class SessionController extends TaonBaseController {
  @PUT({
    middlewares: ({ parentMiddlewares }) => ({
      ...parentMiddlewares,
      AuthorizationMiddleware,
    }),
  })
  helloWorld(): Taon.Response<string> {
    //#region @websqlFunc
    return async (req, res) => {
      return 'hello world';
    };
    //#endregion
  }
}
```

#### Error handling inside controllers
```ts
@TaonController({
  className: 'SampleController'
})
export class SampleController extends TaonBaseController {
  @GET()
  helloWorld(
    @Query('errorType')
    errorType?: 'short' | 'stack' | 'customCode' | 'taonError',
  ): Taon.Response<string> {
    //#region @websqlFunc
    return async (req, res) => {

      // 1. (RECOMMENDED) Method -> Clean & simple error message
      if (errorType === 'short') {
        throw 'short error message here';
      }

      // 2. (RECOMMENDED) Method -> Error message with stack trace
      if (errorType === 'stack') {
        throw new Error('message with stack trace here');
      }

      // 3. (RECOMMENDED) Method -> Taon way of custom errors 
      if (errorType === 'taonError') {
        Taon.error({
          message: 'This is custom Taon error',
          code: "CUSTOM_ERR",
          status: 499,
        });
        // 'return' function not needed here, error throws automatically
      }
      

      // (NOT RECOMMENDED) ExpressJS way of custom errors
      if (errorType === 'customCode') {
        res.status(444).json({
            customErrorMessage: 'Helo my friend'
        });
        return; // NEEDED for this method
      }

      
      return `hello world`;
    };
    //#endregion
  }
```

### Taon migrations

Auto generated migration class files for
convenient CI/CD. Work with normal NodeJs backend and Websql browser backend.

Taon migration can be shipped with library code.

```ts
@TaonMigration({
  className: 'MainContext_1735315075962_firstMigration',
})
export class MainContext_1735315075962_firstMigration extends TaonBaseMigration {
  async up(queryRunner: QueryRunner): Promise<any> {
    // do "something" in db
  }

  async down(queryRunner: QueryRunner): Promise<any> {
    // revert this "something" in db
  }
}
```

## Realtime communication

Depending on where you use you backend/frontend - taon framework uses different
mechanism for realtime communication:

- normal NodeJs backend => TCP(upgrade) socket communication based on socket.io (UDP in future)
- electron backend => IPC for realtime communication
- websql browser backend => mock of realtime communication based on RxJS library

You can listen/subscribe to custom events or entities events in every simple fashion.

```ts
@TaonSubscriber({
  className: 'RealtimeClassSubscriber',
})
export class RealtimeClassSubscriber extends TaonBaseSubscriberForEntity {
  listenTo() {
    return UserEntity;
  }

  afterInsert(entity: any) {
    console.log(`AFTER INSERT: `, entity);
    MainContext.realtime.server.triggerEntityTableChanges(UserEntity);
  }
}

// listen change on backend
async function start() {
 MainContext.realtime.server
  .listenChangesCustomEvent(saveNewUserEventKey)
  .subscribe(async () => {
    console.log('save new user event');
    await realtimeUserController.saveNewUser();
  });
}

  // listen changes on frontend
export class RealtimeClassSubscriberComponent {  
  ngOnInit(): void {
    console.log('realtime client subscribers start listening!');

    MainContext.realtime.client
      .listenChangesEntityTable(UserEntity)
      .pipe(untilDestroyed(this), debounceTime(1000))
      .subscribe(message => {
        console.log('realtime message from class subscriber ', message);
      });
  }
}
```
