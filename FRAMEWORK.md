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


### Organization project



## Taon config

Config of application

## Taon controller

Injectable to angular's api service.
Glue between backend and frontend.

## Taon entities

Entity class that can be use as Dto 

## Taon providers

Injectable (service like) classes

## Taon repositories

Injectable (service like) classes

