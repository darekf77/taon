<p style="text-align: center;"><img src="./images/logo-header-bold-taon.png" ></p>

<!-- cspell: disable-next-line  -->
TAON  **T**ypescript **A**ngular **O**rm **N**ode )


( ALPHA VERSION - For early testing and feedback only. )

**Taon** 🔥🔥🔥 is a:<br>
1. **CLI** <br>
2. **Framework**<br>
3. **Cloud**<br>

<br>
for building/testing/deploying modern:<br>
<br>

\+
[TypesScript](https://www.typescriptlang.org/) isomorphic libraries/backends/frontends

\+
[Angular](https://angular.io/) libraries and PWA apps

\+ Databases with Orm ([TypeORM](https://typeorm.io/)) <br>
&nbsp;- [sql.js](https://sql.js.org)<br>
&nbsp;&nbsp;&nbsp;->  local development mode<br>
&nbsp;&nbsp;&nbsp;->  local development with backend in browser mode (WEBSQL) <br>
&nbsp;&nbsp;&nbsp;->  production dockerized mode <br>
&nbsp;&nbsp;&nbsp;->  production backend in browser mode (WEBSQL) <br>
&nbsp;- [mysql](https://www.mysql.com/)  
&nbsp;&nbsp;&nbsp;-> production dockerized mode (NOT READY YET) <br>

\+
[NodeJS](https://nodejs.org/en/) backends deployable on any server with on command
  
\+
[Electron](https://www.electronjs.org/) desktop apps

\+
[Ionic](https://www.electronjs.org/) mobile apps (NOT READY YET)

\+
[Visual Studio Code](https://www.electronjs.org/) plugins

\+ Documentation websites with:<br>
- [MkDocs](https://www.mkdocs.org/) beautifull material wrapper for *.md docs files <br>
- [Storybook](https://storybook.js.org/docs/get-started/angular) ui elements documentation (NOT READY YET)<br>
- [Compodoc](https://compodoc.app/) docs from comments (NOT READY YET) <br>



**[READ DOCUMENTATION](https://taon.dev/#/docs)**

### Initial requirements of taon
1. Installed git 
 (on windows only supported [gitbash](https://gitforwindows.org) or [pwsh](https://github.com/PowerShell/PowerShell))

2. Increased watchers limit (only on linux):
```bash
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```


## Supported OS-es:
- Win10, Win11 (gitbash, pwsh)
- MacOS 
- Linux


## Required version of NodeJS
- Windows 10/11 >= v18
- MacOS: >= v18
- Linux: >= v18


## How to install taon
```
npm i -g taon
```


##  How to uninstall taon from local machine
Taon stores a big global container (in ~/.taon) for npm packages <br>
that are being shared across all taon projects.

```bash
npm uninstall -g taon
rm -rf ~/.taon  # taon local repositories, databases, settings, caches.
```


## Projects that are part of taon.dev:
- taon https://github.com/darekf77/taon
    + framework library
- tnp https://github.com/darekf77/tnp
    + main cli / code structuring tool
- taon-core https://github.com/darekf77/tnp-core
    + essential/core helpers for all projects
- taon-helpers https://github.com/darekf77/tnp-helpers
    + extended core helpers
- taon-rest https://github.com/darekf77/ng2-rest
    + easy rest api
- taon-json https://github.com/darekf77/json10
    + handle JSON in better way
- taon-logger https://github.com/darekf77/ng2-logger
    + logging in isomorphic apps
- taon-typeorm https://github.com/darekf77/taon-typeorm
    + TypeOrm fork 
- taon-type-sql https://github.com/darekf77/taon-type-sql
    + strongly type sql
- taon-incremental-watcher https://github.com/darekf77/incremental-compiler
    + abstraction for incremental builders NodeJS based 
- taon-storage https://github.com/darekf77/taon-storage
    + ts decorators based storage solution
- taon-walk-object https://github.com/darekf77/lodash-walk-object
    + iterate over deep properties in object
- taon-class-helpers https://github.com/darekf77/typescript-class-helpers
    + helpers for OOP class names based


## Global npm dependencies installed with taon 
Installation happens when you first time use taon
```jsonc
[
  // alternative to npx ( it wil not download package from npm if is not installed )
  { name: 'npm-run', version: '4.1.2' },
  //handy for removing files
  { name: 'rimraf', version: '3.0.2' },
  //handy for recreating catalogs
  { name: 'mkdirp' },
  // package manager
  { name: 'yarn' },
  // https server with --base-href
  { name: 'taon-http-server' },
  // code formatter
  { name: 'prettier' },
  // process killer
  { name: 'fkill', installName: 'fkill-cli' },
  // for unit tests runner 
  { name: 'mocha' },
  // for unit tests runner
  { name: 'jest' },
  // run ts like js
  { name: 'ts-node' },
  // fork of vsce package without npm dependencies restrictions
  { name: 'taon-vsce' },
  // analyze you final bundle
  { name: 'webpack-bundle-analyzer' }
]
```
