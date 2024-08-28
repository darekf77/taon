import { Component, NgZone } from '@angular/core';
import { Taon } from 'taon';  // <- this is to replace by taon
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
  removedPreloader = false;
  constructor(
    ngzone: NgZone
  ) {
    Taon.initNgZone(ngzone);
  }

  async ngOnInit() {
    removeElement('taonpreloadertoremove');
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
