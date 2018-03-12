<div align="center">
  
![MorphiJSlogo](logo_github.png)


  <h1>Morphi</h1>
  <p>
    Iso<b>morphi</b>c framework in TypeScript for NodeJS back-end and browser (web/mobile) front-end. 
    <br><br><br>
   <strong > Do no repeat yourself anymore, never !!! </strong>
    <br>    
    <br>
    <ul style="list-style-type:none;" >
      <li style="margin-top:20px" >-<strong>NO MORE SEPARATION BETWEEN BACKEND AND FRONTEND !</strong></li>
      <li style="margin-top:20px" >- <strong>Isomorphic classes</strong> as Angular/Ionic Services and ExpressJS controllers. </li>
      <li style="margin-top:20px"><strong>One <u>node_modules</u> folder</strong> for browser, mobile and server.</li>
      <li style="margin-top:20px">-<strong> Write everything in TypeScript</strong> 
      all the time and <br> automaticly strip off server code for browser/ionic versions.</li>
      <li style="margin-top:20px">- Use power of  <a style="color:red;" href="https://github.com/typeorm/typeorm">TypeORM</a>
       framwork to write awesome, robust, clean NodeJS backend <br>
       connected to SQLite, Mysql, WebSQL, MongoDB and many others... </li>
      <li style="margin-top:20px">- <strong>Keep amazing code consistency</strong>
        thanks to isomorphic entities classes, that you can use to<br>
        create backend tables and also inside frontend-angular templates with type checking.        
      </li>
       <li style="margin-top:20px">- <strong>Change business logic in the fastest possible way!</strong>
       </li>
      <li  style="margin-top:20px;font-size:90%" >Support project to develop only amazing, creative things
      in the future... 
      </li>
      <li  style="margin-top:20px;font-size:90%" > Project is under development, but every 
        juicy features just works... try example.
      </li>
      <li>
        <br>
        <br>
        TODO: <br>
        - firebase like... realtime update of backend/frontend (in progress) <br>
        - extended authentication based on isomorphic decorators metadata and db roles (in progress) <br>
        - isomoprhic unit tests (with inheritance) in mocha/jasmine  <br>
        - vscode extension to support @backend, @backendFunc #regions <br>
        - optimized isomorphic build <br>
        - extended global cli tool <br>
        - patch, head methods rest api <br>
      </li>
    </ul>
  <p>
</div>


# Instalation
### Global CLI
First install global tool:
```
npm install -g morphi
```
### Create new isomorphic project ( mobile, web, server + sqlite db + basic rest authentication ) 
```
morphi new myAwesomeIsomrphicApp
```
### Visual Studio Code (recommended editor)
Open your project in *VSCode* to get the maximum of development experience.
```
code myAwesomeIsomrphicApp
```
### Link one version of node_modules
Once you have your app opened... 

![files](files.png)

run:
```
npm install && npm run link
```
to install and link *node_module* folder for each subproject.
### Build and run sub-projects with auto-reload
- isomorphic-lib: `npm run build:watch` + F5 to run server
- angular-client: `npm run build:watch` + open browser [http:\\\\localhost:4200](http:%5C%5Clocalhost:4200)
- ionic-client: `npm run build:watch` + open browser [http:\\\\localhost:8100](http:%5C%5Clocalhost:8100)

Instead of `npm run build:watch` you can also open each sub-project in separated vscode window `code <sub-project-name>`
and press: **ctrl(cmd) + shift + b**.

# Backend controllers, entities directly in the frontend
## Isomorphic TypeScript Classes

The main reason why this framework has huge potential is that you can use your backend code 
( usualy ExpressJS, REST controllers ) as Anguar 2+ services, to access your RESTfull backend.

This will allow you to change business login very quickly, without confusion and keep
no separation between your frontend/backend application.

**Morphi CLI tool** is responsible for magic behing stripping of backend code for browser version ( web app or ionic mobile app).

#### Example Isomorphic (ExpressJS controller) class with morphi *@backend,@backendFunc* regions
The difference between @backend and @backendFunc is that @backendFunc will replace code with 'return undefined' (it is needed for typescript compilation) and @backend
will precisely delete all lines between.

## BACKEND VERSION 

- Typeorm isomorphic ENTITY in NodeJS backend:
```ts
import { Entity } from 'morphi'; // or "import { Entity } from 'typeorm';"

@Entity('user_table')
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    surname: string;

    fullName() {
      return `${this.name} ${this.surname}`
    }
    
    #region @backend  // backend code invisible for frontend
    password: string
    #endregion

}
```

- Morphi isomorphic CONTROLLER in NodeJS backend:
```ts
import { Endpoint, GET } from 'morphi'

@Endpoint('/users')  // or "@Endpoint()" to use class name as part of endpoint path
class UserController {
	
	#region @backend // backend code invisible for frontend
	private @OrmConnection  connection:  Connection;
	private  repository:  Repository<User>;
	#endregion
	
	@GET('/all')
	getAllUser() {
		#region @backendFunc // backend code invisible for frontend
		this.repository  =  this.connection.getRepository(User) as  any;
		return  async (req, res) => {
			return await  this.repository.findAll();
		}
		#endregion
	}	
}

```
After **isomorphic compilation** by morphi;
```
morphi build
```

## BROWSER VERSION 

The result for browser client will be like below:

- Typeorm isomorphic ENTITY in browser version:
```ts
import { Entity } from 'morphi/browser'; // or "import { Entity } from 'typeorm/browser';"

@Entity('user_table') // you can you "@Entity(User.name)"
export class User {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    surname: string;

    fullName() {
      return `${this.name} ${this.surname}`
    }
}
```
- Morphi isomorphic CONTROLLER in browser version:
```ts
import { Endpoint, GET } from 'morphi/browser'

@Endpoint('/users')  // or "@Endpoint()" to use class name as part of endpoint path
class UserController {
	 // 'return undefined' is for purpose on the browser side
	 // The function body will be replaced through decorate
	 // to access REST endpoint '/users/all'
	@GET('/all')
	getAllUser() { return undefined; }	
}
```
In reality you can keep above examples (BACKEND/BROWSER VERSION) in one *.ts file. 


# Backend classes as browser RESTfull services

And that kind of class you can use as **Angular 2+ service**:
```ts
@Component({
	selector:  'app-test',
	templateUrl:'app-test.html'
})
class  AppTestComponent  implements  OnInit {

	// Inject isomorphic class as service into component
	constructor(public users: UserController) { } 
	
	ngOnInit() {
		this.users.getAllUsers().received.observable.subscribe( users => {
        console.log(users) 
        // USERS FROM BACKEND as CLASS OBJECTS - not just plain objects ....
        // thanks to the framework you can use class objects to really
        // make you backend/frontend code tight
		}) 
	}
}
```
To simplify object receiving from backend you can use **async** pipes (available with Angular4+) 
and really make you MVVM amazing.

Morphi and Angular4+ lets you use backend functions in html frontend template.

This gives huge possibility of **UNIVERSAL BACKEND/FRONTEND VALIDATORS**.

**app-test.html**  
```html
Users:
<ul   *ngIf="users.getAllUsers().received.observable | async; else loader; let users" >

  <li  *ngFor="let user of users"> 
  		{{user.id}} {{user.fullName()}} <!-- BACKEND FUNCTION IN FRONTEND TEMPLATE ! -->
		  <br>
		<input type="name" [(NgModel)]="user.name" >
  </li>

</ul>

<ng-template #loader> loading users...  </ng-template>

```


Of course Angular services can be used inside Angular web and Ionic mobile apps. 


# REST API

With morphi you can have amzing types hints thanks to strong relation between backend
end frontend. 


Avaliable REST methods: **PUT, GET, POST, DELETE**.

If you find any problems with REST API please check my another, responsible for it project - 
[ng2-rest](https://github.com/darekf77/ng2-rest).


- backend
```ts
  import { Endpoint, Entity, PUT, Response } from 'morphi'

  @Entity(Book.name)
  class User {
      id:number;
      name:string;
  }


  @Endpoint('/books')  // or "@Endpoint()" to use class name as part of endpoint path
  class BooksController {
    
    @PUT()
    save(user:User):Response<User>
    {
      //#region @backendFund
      ...
      //#endregion
    }	
  }

```


- frontend
```ts
  import { Endpoint, Entity, PUT, Response } from 'morphi/browser'

  @Entity(Book.name)
  class User {
      id:number;
      name:string;
  }


  @Endpoint('/books')  // or "@Endpoint()" to use class name as part of endpoint path
  class BooksController {
    
    @PUT()
    save(user:User):Response<User> { return undefined; }	
  }

  @Component({
	  selector:  'books-test',
    template: '...'
  })
  class  BooksComponent  implements  OnInit {

    // Inject isomorphic class as service into component
    constructor(public books: BooksController) { } 
    
    async save(book:Book) {
      await this.books.save(book).received

      // you can also use observable if you want
      // await this.books.save(book).received.observable
    }
  }

```


# Inheritance of entities and controllers
## Fast CRUD

With morphi there is very nice possiblity of writing CRUD (Create,Read,Update,Delete).

Again... do not repeat yourself writing controllers and entities - inherit classes as you want.

```ts

  import { Entity, Endpoint, BaseCRUD, BaseCRUDEntity } from 'morphi'
  
  @Entity(BaseEntity.name)
  abstract class BaseEntity {
    id:string;
  }


  @Entity(Email.name)
  class Email extends BaseEntity {  // ENTITIES INHERITANCE
    id:number;
    address:string;
  }

  @Endpoint(EmailsController.name)
  class EmailsController extends BaseCRUD<Email> { // CONTROLLERS INHERITANCE
    @BaseCRUDEntity(Email) public entity: Email;

    constructor() {
      super()
      this.methodsTest()
    }


    // frontend method
    async methodsTest() {

      // __model as object for public universal api

      await this.__model.getAll().received //  as emails from db 

      await this.__model.getBy(1).received //  get one email by id

      await this.__model.getBy(1).received //  get one email by id

      const newEmail = await this.__model.create(new Email()).received // create email
      newEmail.address = 'test@test.pl'

      await  this.__model.updateById(12,newEmail).received
    }

  }

```

