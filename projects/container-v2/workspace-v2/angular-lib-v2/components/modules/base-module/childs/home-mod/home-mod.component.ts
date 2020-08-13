import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { TESTOWY } from 'isomorphic-lib-v2/src/apps/testowy/TESTOWY';
import { Observable, Subject } from 'rxjs';

@Component({
  selector: 'app-home-mod',
  templateUrl: './home-mod.component.html',
  styleUrls: ['./home-mod.component.css']
})
export class HomeModComponent implements OnInit {

  // @Input() notifyForNewData: Subject<any>
  data: TESTOWY[];
  async ngOnInit() {

    const data = await TESTOWY.all().received;
    console.log('data from backedn !', data.body.json);

    const werka = (await TESTOWY.czescwerka()).body.json;
    console.log(werka)
    this.data = werka;
  }

  constructor(
    public router: Router
  ) {

  }

  aa() {
    this.router.navigateByUrl('/')
  }

  // chceNoweDate() {
  //   this.notifyForNewData.next()
  // }

}
