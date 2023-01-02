import { Component, NgZone } from '@angular/core';
import { Firedev } from 'firedev';  // <- this is to replace by firedev

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'app';

  constructor(
    ngzone: NgZone
  ) {
    Firedev.initNgZone(ngzone)
  }

  async ngOnInit() { }
}
