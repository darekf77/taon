import { Component } from '@angular/core';
import { Subject } from 'rxjs';
import { Helpers } from 'tnp-core/websql'

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'app';

  async ngOnInit() {

    if(Helpers.isWebSQL) { // @ts-ignore
      const initSqlJs = require('sql.js');
      // or if you are in a browser:
      // const initSqlJs = window.initSqlJs;

      const SQL = await initSqlJs({
        // Required to load the wasm binary asynchronously. Of course, you can host it wherever you want
        // You can omit locateFile completely when running in node
        // @ts-ignore
        locateFile: file => `https://sql.js.org/dist/${file}`
      });

      // @ts-ignore
      window['SQL'] = SQL;
      console.log('WEBSQL LOADED');
      (window['onLoadSqlJS'] as Subject<void>).next()
    } else {
      console.log('WEBSQL NOT LOADED')
    }

  }
}
