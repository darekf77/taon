import { Component, NgZone } from '@angular/core';
import { Firedev } from 'firedev';  // <- this is to replace by firedev
import { Morphi } from 'morphi';  // <- this is to replace by firedev
// @ts-ignore
import start from './---projectname---/app';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'app';
  inited = false;
  constructor(
    ngzone: NgZone
  ) {
    Firedev.initNgZone(ngzone);
    Morphi.initNgZone(ngzone);
  }

  async ngOnInit() {
    await start();
    this.inited = true
  }
}
