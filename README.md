<p style="text-align: center;"><img src="./__images/logo-header-bold.png" ></p>

( BETA VERSION - MAJOR REFACTOR IN PROGRESS )

**Firedev** 🔥🔥🔥 is a solution (**global cli tool** & **framework**) for

\+
[TypesSript](https://www.typescriptlang.org/)  

\+
[Angular](https://angular.io/) (PWA)

\+
[RxJs](https://rxjs.dev/)  / [NgRx](https://ngrx.io/) (optional) 

\+
[NodeJS](https://nodejs.org/en/)

\+ [TypeORM](https://typeorm.io/)
- [sql.js](https://sql.js.org) - NODEJS SERVER MODE
- [sql.js](https://sql.js.org) - *WEBSQL SERVER MODE
- [mysql](https://www.mysql.com/) - SERVER IN DOCKER (work in progress)

\+
[Electron](https://www.electronjs.org/) desktop apps (work in progress)

\+
[Storybook](https://storybook.js.org/docs/get-started/angular) showcase (work in progress)

<ins>backend/frontend [*isomorphic](https://en.wikipedia.org/wiki/Isomorphic_JavaScript)  apps/libs.</ins>

**[READ DOCUMENTATION](https://firedev.io/#/docs)**

<br>
<br>

### Initial requirements of firedev
1. Installed git


(for windows only git bash supported https://gitforwindows.org)


2. (linux only) Increased watchers limit:
```
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf && sudo sysctl -p
```

<br>
<br>

### Projects that are part of firedev:
- firedev https://github.com/darekf77/firedev
    + framework library
- tnp https://github.com/darekf77/tnp
    + main cli / code structuring tool
- firedev-core https://github.com/darekf77/tnp-core
    + essential/core helpers for all projects
- firedev-class-helpers https://github.com/darekf77/typescript-class-helpers
    + helpers for OOP class names based
- firedev-config https://github.com/darekf77/tnp-config
    + config/models for general purpose
- firedev-cli https://github.com/darekf77/tnp-cli
    + helpers/abstraction for global cli tools NodeJS based
- firedev-helpers https://github.com/darekf77/tnp-helpers
    + extended core helpers
- firedev-json https://github.com/darekf77/json10
    + handle JSON in better way
- firedev-logger https://github.com/darekf77/ng2-logger
    + logging in isomorphic apps
- firedev-typeorm https://github.com/darekf77/firedev-typeorm
    + TypeOrm fork 
- firedev-type-sql https://github.com/darekf77/firedev-type-sql
    + strongly type sql
- firedev-rest https://github.com/darekf77/ng2-rest
    + easy rest api
- firedev-incremental-watcher https://github.com/darekf77/incremental-compiler
    + abstraction for incremental builders NodeJS based 
- firedev-storage https://github.com/darekf77/firedev-storage
    + ts decorators based storage solution
- firedev-walk-object https://github.com/darekf77/lodash-walk-object
    + iterate over deep properties in object
- firedev-ui https://github.com/darekf77/firedev-ui
    + open source UI for firedev based projects



### Global npm dependencies installed with firedev 
Installation happens when you first time use firedev

<pre>
{ name: 'ncc', version: '0.36.0', installName: '@vercel/ncc' },
{ name: 'extract-zip', version: '1.6.7' },
{ name: 'cpr' },
{ name: 'check-node-version' },
{ name: 'npm-run', version: '4.1.2' },
{ name: 'rimraf', version: '3.0.2' },
{ name: 'mkdirp' },
{ name: 'renamer', version: '2.0.1' },
{ name: 'nodemon' },
{ name: 'madge' },
{ name: 'yarn' },
{ name: 'firedev-http-server' },
{ name: 'prettier' },
{ name: 'fkill', installName: 'fkill-cli' },
{ name: 'mocha' },
{ name: 'jest' },
{ name: 'ts-node' },
{ name: 'firedev-vsce' },
{ name: 'webpack-bundle-analyzer' },
{ name: 'babel', installName: 'babel-cli' },
{ name: 'javascript-obfuscator', version: '4' },
{ name: 'uglifyjs', installName: 'uglify-js' },
</pre>
