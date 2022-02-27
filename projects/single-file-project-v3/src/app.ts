const lodash = require('lodash');

async function start() {
    console.log('HELLO');
    console.log(lodash)
}

if (typeof window !== 'undefined') {
  start()
}

import { NgModule } from '@angular/core';

import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-single-file-project-v3',
  template: `
hell nigga
  `
})

export class NameComponent implements OnInit {
  constructor() { }

  ngOnInit() { }
}

@NgModule({
  imports: [],
  exports: [NameComponent],
  declarations: [NameComponent],
  providers: [],
})
export class SingleFileProjectV3Module { }


export default start;
