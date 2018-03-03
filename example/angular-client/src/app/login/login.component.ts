import { Component, OnInit } from '@angular/core';
import { AuthController } from 'isomorphic-lib/browser';

import { Log } from "ng2-logger";
const log = Log.create('Login component')

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  constructor(private auth: AuthController) {
    this.auth.isLoggedIn.subscribe(d => {
      log.i('data from auth observable !', d)
    })
  }

  model = {
    username: 'admin',
    password: 'admin'
  }

  login(data) {
    this.auth.browser.login(data)
  }

  async info() {
    console.log(await this.auth.info().received)
  }

  logout() {
    this.auth.browser.logout()
  }

  observable = {
    isLoggedIn: this.auth.isLoggedIn
  }


  ngOnInit() {
  }

}
