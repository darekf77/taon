<div align="center">
  
![MorphiJSlogo](logo_github.png)


  <h1>Morphi</h1>
  <p>
    Iso<b>morphi</b>c framework in TypeScript for NodeJS back-end and browser front-end. 
    <br><br><br>
   <strong > Do no repeat yourself anymore, never !!! </strong>
    <br>
    <br>
    <ul>
      <li> <strong>Isomorphic classes</strong> as Angular/Ionic Services and ExpressJS controllers. </li>
      <li><strong>One node_modules folder</strong> for browser, mobile and server.</li>
      <li><strong> Write everything in TypeScript</strong> all the time and strip off server code for browser/ionic versions.</li>
      <li>Use power of  <a style="color:red;" href="https://github.com/typeorm/typeorm">TypeORM</a> framwork to write awesome, robust, clean NodeJS backend connected to SQLite, Mysql and many others... </li>
      <li> <strong>Keep amazing code consistency</strong>
        thanks to isomorphic entities classes, that you can use to
        create backend tables and also inside frontend-angular templates with type checking.        
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
### Create new isomorphic project ( mobile, web, server + sqlite db ) 
```
morphi new myAwesomeIsomrphicApp
```
### Visual Studio Code
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

# Main idea - Isomorphic TypeScript Classes
The main reason why this framework has huge potential is that you can use your backend code 
( usualy ExpressJS, REST controllers ) as Anguar 2+ services, to access your RESTfull backend.

This will allow you to change business login very quickly, without confusion.

**Morphi CLI tool** is responsible for magic behing stripping of backend code for browser version ( web app or ionic mobile app).

#### Example Isomorphic (ExpressJS controller) class with morphi *@backend,@backendFunc* regions
The difference between @backend and @backendFunc is that @backendFunc will replace code with 'return undefined' (it is needed for typescript compilation) and @backend
will precisely delete all lines between.

- Typeorm isomorphic ENTITY in NodeJS backend:
```ts
import { Entity } from 'typeorm';

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

// you can even omiit '/users' and use default class name as endpoint
@Endpoint('/users') 
class UserController {
	
	#region @backend // backend code invisible for frontend
	private @OrmConnection  connection:  Connection;
	private  repository:  Repository<TestUser>;
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
The result for browser will be like below:

- Typeorm isomorphic ENTITY in browser version:
```ts
import { Entity } from 'typeorm/browser';

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
}
```
- Morphi isomorphic CONTROLLER in browser version:
```ts
import { Endpoint, GET } from 'morphi/browser'

@Endpoint('/users') 
class UserController {
	 // 'return undefined' is for purpose on the browser side
	 // The function body will be replaced through decorate
	 // to now access REST endpoint '/users/all'
	@GET('/all')
	getAllUser() { return undefined; }	
}
```
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
			console.log(users) // USERS FROM BACKEND
		}) 
	}
}
```
To simplify object receiving from backend you can use **async** pipes from (available from angular4) 
and really keep you MVVM amazing.

**app-test.html**  
```html
Users:
<ul   *ngIf="users.getAllUsers().received.observable | async; else loader; let users" >

  <li  *ngFor="let user of users"> 
  		{{user.id}} {{user.fullName()}} 
		  <br>
		<input type="name" [(NgModel)]="user.name" >
  </li>

</ul>

<ng-template #loader> loading users...  </ng-template>

```


Of course Angular services can be used inside Angular web and Ionic mobile apps. 


