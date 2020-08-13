import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BarService } from 'components';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html' ,
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  public value: Observable<string>;

  constructor(
    bar: BarService
  ) {
    this.value = bar.value;
  }

}
