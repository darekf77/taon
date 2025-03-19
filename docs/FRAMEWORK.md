## Files structure

Taon has very flexible structure for build apps and libraries. Each project
can be at the same time library and app.

### Types of projects
There 2 types of project app and libraries: 

- **standalone** (simple project with that has /src for for all source code)
- **organization** (contains multiple standalone projects that can be build together)

### Projects name <=> folder name  <=> package.json(name property)

Each taon project should have distincy name that follow
npm package naming convention (without @,.,_).
To simplyfiy development process all these tree things:
project name, folder name, package.json(name property) should 
have the same name to avoid confusion.
Command `taon init` will alwayus update `package.json(name property)`
to project folder name.

Your pacakge name,folder is at the same time you published
to npm package name.


### Isomorphic compiled npm package
Isomorphic package contains all neccessary js (or mjs) files
for backend and frontend. Usual structure:

```bash
/lib # all backend es5 javascript code
/browser # browser code for normal nodejs/angular development
/client # same thing as /browser @deprecaed now
/websql # special version of browser code from WEBSQL MODE
/bin # cli related files
/assets/shared # shared assets from project
```


## Rules of writing taon code
### Files with special extension and purpose:

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
- ***.spec.ts** *(jest tests files)*
- ***.cy.ts** *(cypress tests files)*

additionaly **all .css, sass, .html** are not available for nodej backend code

\+ Backend only files (available also in websql mode)
 
- ***.test.ts** *(mocha/sinon backend tests)*

\+ Backend only files (not available in websql mode => only nodejs)
 
- ***.backend.ts** *(nodejs backend code)*

PLEASE REMEMBER THAT **example-file-name-backend.ts** is NOT a nodejs-backend only code


### Code regions 

\+ **Code for nodejs/websql backend:** 

`//#region @websql`

  /* code */
  
   `//#endregion`

\+ **Same as above for function return :**

`//#region @websqlFunc`

  /* code */
  
   `//#endregion`

*When you should use @websql, @websqlFunc:*

\-> have in mind that this code can be mocked in browser in websql mode

\-> you should use it more often that @backend, @backendFunc

\-> ..why? => websql mode is super confortable for development

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

\+ **Code only for browser:** 

`//#region @browser` 

 /* code */

`//#endregion`

*When you should use @browser* ?

\-> for frontend code that for some reason can't be executed/imported in NodeJS backend

\+ **Code only for websql mode (not available for nodejs backend):** 

`//#region @websqlOnly`  

/* code */

`//#endregion`

*When you should use @websqlOnly* ?

\-> when you are converting NodeJS only backend to websql mode friendly backend

## Taon TypeScript building blocks

### Taon context
Purpose of taon context is to:
 - agregate all backend building block of application
 - start UDP/TCP serve
     
  + (with multiple contexts can have multiple servers in 1 nodejs app)
 - initialize databas (only 1 db per context allowed)
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

## Taon entities

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

 
## Taon repositories

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

## Taon subscribers

Injectable (service like) classes for subscribing to 
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

## Taon providers

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


### Migrations 

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