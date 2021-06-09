import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, Subject } from 'rxjs';

@Component({
  selector: 'app-home-mod',
  templateUrl: './home-mod.component.html',
  styleUrls: ['./home-mod.component.css']
})
export class HomeModComponent implements OnInit {

  // @Input() notifyForNewData: Subject<any>
  data: any[];
  async ngOnInit() {

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
