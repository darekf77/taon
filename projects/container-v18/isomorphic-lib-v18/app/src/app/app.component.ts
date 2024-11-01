import {
  Component,
  ComponentFactoryResolver,
  NgZone,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Taon } from 'taon'; // <- this is to replace by taon
// @ts-ignore
import start from './---projectname---/app';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    // BrowserModule,
    //distReleaseOnly ServiceWorkerModule.register('ngsw-worker.js', {
    //distReleaseOnlyenabled: true,
    //distReleaseOnly// Register the ServiceWorker as soon as the app is stable
    //distReleaseOnly// or after 30 seconds (whichever comes first).
    //distReleaseOnlyregistrationStrategy: 'registerWhenStable:30000'
    //distReleaseOnly}),
    // BrowserAnimationsModule,
  ],
})
export class AppComponent {
  @ViewChild('container', { read: ViewContainerRef, static: true })
  container!: ViewContainerRef;
  title = 'app';
  removedPreloader = false;
  inited = false;
  constructor(
    ngzone: NgZone,
    private componentFactoryResolver: ComponentFactoryResolver,
  ) {
    Taon.initNgZone(ngzone);
  }

  async ngOnInit() {
    removeElement('taonpreloadertoremove');
    this.container.clear();

    // Create a factory for the DynamicComponent
    const componentFactory = // @ts-ignore
      this.componentFactoryResolver.resolveComponentFactory(
        // @ts-ignore
        '<<<TO_REPLACE_COMPONENT>>>',
      );

    document.body.style.backgroundColor = 'FIREDEV_TO_REPLACE_COLOR';
    this.removedPreloader = true;
    // @ts-ignore
    await start();
    this.inited = true;
    // Add the DynamicComponent to the container
    this.container.createComponent(componentFactory);
  }
}

function removeElement(id) {
  var elem = document.getElementById(id);
  return elem.parentNode.removeChild(elem);
}
