//#region imports
//#region @browser
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriberInjectComponent } from './app/user.component';
export { SubscriberInjectModule } from './app/user.module';
//#endregion
import { Firedev } from 'firedev/src';
import { AppContext } from './app.context';
import { UserController } from './app/user.controller';
import { UserSubscriber } from './app/user.subscriber';
//#endregion

async function start() {
  await AppContext.initialize();

  if (Firedev.isBrowser) {
    const userController = AppContext.getClassInstance(UserController);
    const users = (await userController.getAll().received).body?.json;
    console.log({
      'users from backend': users,
    });

    const userSubscriber = AppContext.getClassInstance(UserSubscriber);
    const notifySubscriber = () => {
      userSubscriber.customEvent();
      setTimeout(() => {
        notifySubscriber();
      }, 4000);
    };
    notifySubscriber();
  }
}

export default start;
