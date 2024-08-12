import { Firedev } from "firedev/src";
import { User } from "./user";

@Firedev.Subscriber({
  className: 'UserSubscriber',
})
export class UserSubscriber extends Firedev.Base.Subscriber {
  // listenTo() {
  //   return User;
  // }

  customEvent() {
    console.log('CUSTOM EVENT');
  }
}

