//#region @browser
import { Component, OnInit, TemplateRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { Resource } from 'ng2-rest/src';
import { TaonNotificationsService } from './taon-notifications.service';

@Component({
  selector: 'taon-notifications',
  templateUrl: './taon-notifications.component.html',
  styleUrls: ['./taon-notifications.component.scss'],
  standalone: false,
})
export class TaonNotificationsComponent implements OnInit {
  constructor(private notification: TaonNotificationsService) {}

  ngOnInit() {}

  init(
    subscribtionsArray: Subscription[],
    template: TemplateRef<any>,
    callback: (dataToTempalte) => any
  ) {
    subscribtionsArray.push(
      Resource.listenErrors.subscribe(err => {
        this.notification.error(err.msg);
        // subscribtionsArray.push(notify.onTap.subscribe(() => {
        //   callback(err);
        //   this.modal.open(template);
        // }) as any);
      }) as any
    );
  }
}
//#endregion
