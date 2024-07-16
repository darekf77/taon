//#region imports
//#region @browser
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriberInjectComponent } from './app/user.component';
//#endregion
import { Firedev } from 'firedev/src';
import { AppContext } from './app.context';
import { UserController } from './app/user.controller';
//#endregion

//#region  subscriber-inject module
//#region @browser
@NgModule({
  exports: [SubscriberInjectComponent],
  imports: [CommonModule],
  declarations: [SubscriberInjectComponent],
})
export class SubscriberInjectModule {}
//#endregion
//#endregion

async function start() {
  await AppContext.initialize();

  if (Firedev.isBrowser) {
    const users = (
      await AppContext.getClassInstance(UserController).getAll().received
    ).body?.json;
    console.log({
      'users from backend': users,
    });
  }
}

export default start;
