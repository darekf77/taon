import {
  Component,
  ComponentFactoryResolver,
  Inject,
  NgZone,
  PLATFORM_ID,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Taon } from 'taon'; // <- this is to replace by taon
// @ts-ignore
import start from './---projectname---/app';
import { isPlatformBrowser } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
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
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {
    Taon.initNgZone(ngzone);
  }

  async ngOnInit() {
    this.removeElement('taonpreloadertoremove');

    this.container.clear();

    // Create a factory for the DynamicComponent
    const componentFactory = // @ts-ignore
      this.componentFactoryResolver.resolveComponentFactory(
        // @ts-ignore
        '<<<TO_REPLACE_COMPONENT>>>',
      );

    if (isPlatformBrowser(this.platformId)) {
      document.body.style.backgroundColor = 'TAON_TO_REPLACE_COLOR';
    }
    this.removedPreloader = true;
    // @ts-ignore
    await start();
    this.inited = true;
    // Add the DynamicComponent to the container
    this.container.createComponent(componentFactory);
  }

  removeElement(id) {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    var elem = document.getElementById(id);
    return elem.parentNode.removeChild(elem);
  }
}
