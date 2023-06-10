//#region @notForNpm

//#region @browser
import { NgModule } from '@angular/core';
import { Component, OnInit } from '@angular/core';


@Component({
  selector: 'app-single-file-project-v4',
  template: 'hello from single-file-project-v4',
  styles: [` body { margin: 0px !important; } `],
})
export class SingleFileProjectV4Component implements OnInit {
  constructor() { }

  ngOnInit() { }
}

@NgModule({
  imports: [],
  exports: [SingleFileProjectV4Component],
  declarations: [SingleFileProjectV4Component],
  providers: [],
})
export class SingleFileProjectV4Module { }
//#endregion


async function start(port: number) {
  console.log('hello world');
}

export default start;



//#endregion