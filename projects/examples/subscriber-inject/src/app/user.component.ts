import { Component, inject } from '@angular/core';
import { UserApiService } from './user-api.service';
import { Observable } from 'rxjs';
import { User } from './user';

@Component({
  selector: 'app-subscriber-inject',
  template: `hello from subscriber-inject<br />
    <br />
    users from backend
    <ul>
      <li *ngFor="let user of users$ | async">{{ user | json }}</li>
    </ul> `,
  styles: [
    `
      body {
        margin: 0px !important;
      }
    `,
  ],
})
export class SubscriberInjectComponent {
  userApiService = inject(UserApiService);
  readonly users$: Observable<User[]> = this.userApiService.getAll();
  ngOnInit(): void {
    //Called after the constructor, initializing input properties, and the first call to ngOnChanges.
    //Add 'implements OnInit' to the class.
    this.userApiService.userCustomevent.subscribe((event) => {
      console.log('event !!!', event);
    });
  }
}
