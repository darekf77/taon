import { Component, NgZone } from '@angular/core';
import { Firedev } from 'firedev';  // <- this is to replace by firedev
import { Morphi } from 'morphi';  // <- this is to replace by firedev
// @ts-ignore
import start from './---projectname---/app';
import { FiredevFileController, FiredevFile, FiredevFileCss } from 'firedev-ui'; // <- this is to replace by firedev

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'app';
  buildIn = [];
  inited = false;
  removedPreloader = false;
  constructor(
    ngzone: NgZone
  ) {
    Firedev.initNgZone(ngzone);
    Morphi.initNgZone(ngzone);
    this.buildIn = [FiredevFileController, FiredevFile, FiredevFileCss];
  }

  async ngOnInit() {
    removeElement('firedevpreloadertoremove');
    document.body.style.backgroundColor = "FIREDEV_TO_REPLACE_COLOR";
    this.removedPreloader = true;
    // @ts-ignore
    await start();
    this.inited = true
  }
}


function removeElement(id) {
  var elem = document.getElementById(id);
  return elem.parentNode.removeChild(elem);
}
