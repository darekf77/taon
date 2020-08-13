import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BarService } from 'components';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  public value: Observable<string>;

  constructor(
    public router: Router
  ) {

  }

  aa() {
    this.router.navigateByUrl('/aa')
  }

}
