## Files structure

Taon has very flexible structure for build apps and libraries. Each project
can be at the same time library and app.

### Types of projects
Taon has 2 types of projects: 

- **standalone** (simple project with source code inside /src folder)
- **container** (contains multiple standalone projects that can be build/release together)

#### Standalone

Each taon project should have distinct name that follows
npm package naming convention (without @,.,_).

To simplify development process (in standalone project):
npm name, folder name and package.json(name property) are equal by default (you can override it with property "overrideNpmName" inside taon.jsonc).

Command `taon init` will make sure that `package.json(name property)` is the same as basename of project folder.

#### Container

Scoped/organization projects are simply standalone projects inside container (with proper "isOrganization" in taon.jsonc).

Name of publish package is taken from container name:

`@parent-container/my-package-name`


### Isomorphic compiled npm package
Isomorphic npm package contains all necessary js (or mjs) files
for backend and frontend. Usual structure:

```bash
/lib # all backend es5 javascript code
/browser # browser code for normal nodejs/angular development
/websql # special version of browser code from WEBSQL MODE
/bin # cli related files
/assets/shared # shared assets from project
```


## Rules of writing taon code

During development of taon apps/libs we must know 
that some files are by default only for 
browser frontend purpose or just for NodeJs backend 
purpose. 

Good practice here is to write each isomorphic 
files in the way that we can use it in backend
and frontend without any additional work.

### Files with special extensions:

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
temporary source folder that serve different purposes. From original *.ts files code regions/lines
are removed based on region tag. 

\+ **Code for NodeJs/Websql backend:** 

`//#region @websql`

  /* code */
  
   `//#endregion`

\+ **Same as above for function return :**

`//#region @websqlFunc`

  /* code */
  
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
  return void 0;
}
```

\+ **Code only for nodejs backend:**

`//#region @backend`

  /* code */ 
  
  `//#endregion`

\+ **Same as above for function return:**

`//#region @backendFunc`
  
  /* code */
  
`//#endregion`

*When you should use @backend, @backendFunc:* ?

\-> for deleting code that can't be mocked in websql mode

*When you should use @websql, @websqlFunc:*

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
  return void 0;
}
```

\+ **Code only for browser:** 

`//#region @browser` 

 /* code */

`//#endregion`

*When you should use @browser* ?

\-> for frontend code that for some reason can't be executed/imported in NodeJS backend

\+ **Code only for websql mode (not available for NodeJs backend):** 

`//#region @websqlOnly`  

/* code */

`//#endregion`

*When you should use @websqlOnly* ?

\-> when you are converting NodeJS only backend to websql mode friendly backend

## Taon TypeScript building blocks

Taon powerful class based api let you build
app with robust approach (never seen before).

Each building block: Context, Entity, Controller, Migration, Repository, Provider - works with inheritance and allows you to achieve the highest possible level of abstraction.

### Taon context
Purpose of taon context:
 - aggregate all backend building block of application
 - start UDP/TCP server<br>
   (multiple contexts === multiple servers in 1 NodeJs app)
 - initialization of database (only 1 db per context allowed)
```ts
import { Taon, BaseContext } from 'taon/src';

const MainContext = Taon.createContext(() => ({
  host,
  disabledRealtime: true,
  contextName: 'MainContext',
  contexts: { BaseContext },
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

async function start() {
  await MainContext.initialize(); // you have to initialize you config before using
 //... 
}

const BiggerBackendContext = Taon.createContext(() => ({
  host: secondHost,
  disabledRealtime: false,
  contexts: { 
    BaseContext,
    MainContext, // EVERYTHING inherited from MainContext
  },
  // ...also migrations, repositories, providers, subscribers etc. here
  database: true,
  logs: true,
}));

```

### Taon entities

Entity class that can be use as Dto.
```ts
@Taon.Entity({ className: 'User' })
class User extends Taon.Base.AbstractEntity {
  //#region @websql
  @Taon.Orm.Column.String()
  //#endregion
  name?: string;
}
```

### Taon controller

Injectable to angular's api service -
glue between backend and frontend.
```ts
@Taon.Controller({ className: 'UserController' })
class UserController extends Taon.Base.CrudController<User> {
  entityClassResolveFn = () => User;
  //#region @websql
  async initExampleDbData(): Promise<void> {
    const superAdmin = new User();
    superAdmin.name = 'super-admin';
    await this.db.save(superAdmin);
  }
  //#endregion
}
```

 
### Taon repositories

Injectable (service like) classes for backend db communication
(similar to https://typeorm.io/custom-repository).
```ts
@Taon.Repository({
  className: 'UserRepository',
})
export class UserRepository extends Taon.Base.Repository<User> {
  entityClassResolveFn = () => User;
  amCustomRepository = 'testingisnoin';
  async findByEmail(email: string) {
    //#region @websqlFunc
    return this.repo.findOne({ where: { email } });
    //#endregion
  }
}
```

### Taon subscribers

Injectable classes for subscribing to 
entity events (just like in subscribers in https://typeorm.io/listeners-and-subscribers)

```ts
@Taon.Subscriber({
  className: 'RealtimeClassSubscriber',
})
export class RealtimeClassSubscriber extends Taon.Base.SubscriberForEntity {
  listenTo() {
    return MainContext.getClass(UserEntity);
  }

  afterInsert(entity: any) {
    console.log(`AFTER INSERT: `, entity);
    MainContext.realtime.server.triggerEntityTableChanges(UserEntity);
  }
}

```

### Taon providers

Injectable (service like) classes singleton classes.
```ts
@Taon.Provider({
  className: 'TaonConfigProvier',
})
export class TaonConfigProvier extends Taon.Base.Provider {
  config = {
    lang: 'en',
    country: 'Poland'
  }
}
```


### Taon migrations 
Auto generated migration class files for
convenient CI/CD.

```ts
@Taon.Migration({
  className: 'MainContext_1735315075962_firstMigration',
})
export class MainContext_1735315075962_firstMigration extends Taon.Base
  .Migration {
  async up(queryRunner: QueryRunner): Promise<any> {
    // do "something" in db
  }

  async down(queryRunner: QueryRunner): Promise<any> {
    // revert this "something" in db
  }
}
```
