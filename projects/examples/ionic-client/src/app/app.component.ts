import { Component, ViewChild } from '@angular/core';
import { Nav, Platform, NavController, App } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';

import { HomePage } from '../pages/home/home';
import { ListPage } from '../pages/list/list';
import { LoginPage } from '../pages/login/login';
import { AuthController } from 'isomorphic-lib/browser';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;

  rootPage: any = LoginPage;
  loginPage: any = LoginPage;
  homePage: any = HomePage;

  pages: Array<{ title: string, component: any }>;

  constructor(public platform: Platform,
    public statusBar: StatusBar,
    public splashScreen: SplashScreen,
    public app: App,
    public auth: AuthController
  ) {
    this.initializeApp();

    // used for an example of ngFor and navigation
    this.pages = [
      { title: 'Login', component: LoginPage },
      { title: 'Home', component: HomePage },
      { title: 'List', component: ListPage }
    ];

  }



  initializeApp() {
    this.platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      this.statusBar.styleDefault();
      this.splashScreen.hide();
    });
  }

  openPage(page) {
    // Reset the content nav to have just this page
    // we wouldn't want the back button to show in this scenario
    this.nav.setRoot(page.component);
  }

  ngOnInit() {

    this.auth.isLoggedIn.subscribe(d => {
      if (d) {
        // this.navCtrl.setRoot(HomePage)
        this.pages = this.pages.filter(({ component }) => component != this.loginPage);
        this.app.getActiveNav().setRoot(this.homePage);
      } else {
        if (!this.pages.includes(this.loginPage)) {
          this.pages.push(this.loginPage)
        }
        this.app.getActiveNav().setRoot(this.loginPage);
      }

    })
    this.auth.browser.init()
  }

}
