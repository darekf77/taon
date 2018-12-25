import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';
import { AuthController } from 'isomorphic-lib/browser';
import { HomePage } from '../home/home';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {

  constructor(public navCtrl: NavController, public auth: AuthController) {

  }

  model = {
    username: '',
    password: ''
  }

  login(data) {
    this.auth.browser.login(data)
  }

  async info() {
    console.log(await this.auth.info().received)
  }



  observable = {
    isLoggedIn: this.auth.isLoggedIn
  }


  ngOnInit() {

  }

}
