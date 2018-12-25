import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AuthController } from 'isomorphic-lib/browser/controllers/AuthController';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  constructor(public navCtrl: NavController, public auth: AuthController) {

  }


  logout() {
    this.auth.browser.logout()
  }

}
