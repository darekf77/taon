<div align="center">
  
![MorphiJSlogo](logo_github.png)


  <h1>Morphi</h1>
  <p>
    Iso<b>morphi</b> framework in TypeScript for NodeJS back-end and browser front-end. 
    <br><br><br>
   <strong > Do no repeat yourself anymore, never !!! </strong>
    <br>
    <br>
    <ul>
      <li> <strong>Isomorphic class</strong> - as Angular/Ionic Services and ExpressJS controllers. </li>
      <li><strong>One node_modules folder</strong> for browser and server and mobile </li>
      <li><strong> Write everything in typescript</strong> all the time and strip off server code for browser/ionic versions.</li>
      <li>Use power of  <a style="color:red;" href="https://github.com/typeorm/typeorm">TypeORM</a> entities to write awesome, robust, clean backend NodeJS conected to SQLite, Mysql and many other... </li>
      <li> <strong>Keep amazing code consistency</strong>
        thanks to isomorphic entities classes that you can use to
        create backend table and inside frontend template.        
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
Open you project in *VSCode* to get the maximum of development experience.
```
code myAwesomeIsomrphicApp
```
### Linking one version of node_modules
Once you have your app opened... 
!\[files\](files.png)
link *node_module* for each subproject:
```
npm run link
```
### Build and run sub-projects with auto-reload
- isomorphic-lib: `npm run build:watch` + F5 to run server
- angular-client: `npm run build:watch` + open browser [http:\\localhost:4200](http:%5C%5Clocalhost:4200)
- ionic-client: `npm run build:watch` + open browser [http:\\localhost:8100](http:%5C%5Clocalhost:8100)

# Main idea - Isomorphic TypeScript Classes
The main reason why this framework has huge potential is that you can you your backend code classes ( usualy ExpressJS REST controllers ) as Anguar 2+ services, to access you backend.
**Morphi CLI tool** is responsible for magic behing stripping of backend code for browser ( web app or ionic mobile app).

#### Example Isomporphic (ExpressJS controller) class with morphi *@backend,@backendFunc* regions
The difference between @backend and @backendFunc is that @backendFunc will replace code with 'return undefined', it is needed for typescript compilation.
```ts
import { Endpoint, GET } from 'morphi'

// you can even omiit '/users' and use default class name as endpoint
@Endpoint('/users') 
class UserController {
	
	#region backend // backend code invisible for frontend
	private @OrmConnection  connection:  Connection;
	private  repository:  Repository<TestUser>;
	#endregion
	
	@GET('/all')
	getAllUser() {
		#region @backendFunc // backend code invisible for frontend
		this.repository  =  this.connection.getRepository(TestUser) as  any;
		return  async (req, res) => {
			return await  this.repository.findAll();
		}
		#endregino
	}	
}
```
After isomorphic compilation by morphi;
```
morphi build
```
The result for browser will be like below:
```ts
import { Endpoint, GET } from 'morphi/browser'

@Endpoint('/users') 
class UserController {
	 // 'return undefined' is for purpose on the browser side
	 // The function body will be replaced throught decorate
	 // to now access REST endpoint '/users/all'
	@GET('/all')
	getAllUser() { return undefined; }	
}
```
And that kind of class you can use as **Angular 2+ service**:
```ts
@Component({
	selector:  'app-test',
	templateUrl:  '...',
	styleUrls: ['...'\]
})
class  AppTestComponent  implements  OnInit {

	// Inject isomorphic class as service into component
	constructor(public UserController users) { } 
	
	ngOnInit() {
		this.users.getAllUsers().received.observable.subscribe( users => {
			console.log(users) // USERS FROM BACKEND
		}) 
	}
}
```
Of course Angular services can be used inside Angular web apps and Ionic framwork app.  To simplify object receiving from backend you can use **async** pipes from (available from angular4) 
and really keep you MVVM amazing.


