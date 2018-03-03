

const controllers = {};
const entities = {};
function addController(controller: Function) {
    controllers[controller.name] = controller;
}
function addEntity(entity: Function) {
    entities[entity.name] = entity;
}

import { UsersController } from './controllers/examples/UsersController';
export { UsersController } from './controllers/examples/UsersController';
addController(UsersController);

import { HelloController } from './controllers/examples/HelloController';
export { HelloController } from './controllers/examples/HelloController';
addController(HelloController);

import { TestController } from './controllers/examples/TestController';
export { TestController } from './controllers/examples/TestController';
addController(TestController);

import { ParentClass } from './controllers/examples/ParentControllers';
export { ParentClass } from './controllers/examples/ParentControllers';
addController(ParentClass);

import { ChildClass } from './controllers/examples/Child1Controller';
export { ChildClass } from './controllers/examples/Child1Controller';
addController(ChildClass);

import { ChildClass2 } from './controllers/examples/Child2Controller';
export { ChildClass2 } from './controllers/examples/Child2Controller';
addController(ChildClass2);

import { AuthController } from './controllers/AuthController';
export { AuthController } from './controllers/AuthController';
addController(AuthController);


import { TestUser } from './entities/examples/User';
export { TestUser } from './entities/examples/User';
addEntity(TestUser);

import { Book } from './entities/examples/Book';
export { Book } from './entities/examples/Book';
addEntity(Book);

import { Author } from './entities/examples/Author';
export { Author } from './entities/examples/Author';
addEntity(Author);

import { EMAIL_TYPE } from './entities/EMAIL_TYPE';
export { EMAIL_TYPE } from './entities/EMAIL_TYPE';
addEntity(EMAIL_TYPE);

import { EMAIL } from './entities/EMAIL';
export { EMAIL } from './entities/EMAIL';
addEntity(EMAIL);

import { USER } from './entities/USER';
export { USER } from './entities/USER';
addEntity(USER);

import { SESSION } from './entities/SESSION';
export { SESSION } from './entities/SESSION';
addEntity(SESSION);


export const Controllers = controllers;
export const Entities = entities;


