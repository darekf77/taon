//#region @browser
import { Component, OnInit, TemplateRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { Resource } from 'ng2-rest/src';
import { FiredevNotificationsService } from './firedev-notifications.service';

@Component({
  selector: 'firedev-notifications',
  templateUrl: './firedev-notifications.component.html',
  styleUrls: ['./firedev-notifications.component.scss'],
})
export class FiredevNotificationsComponent implements OnInit {
  constructor(private notification: FiredevNotificationsService) {}

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
