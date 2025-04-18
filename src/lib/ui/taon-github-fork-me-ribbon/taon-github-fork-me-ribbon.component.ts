//#region @browser
import {
  Component,
  EventEmitter,
  HostBinding,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Subscription } from 'rxjs';

@Component({
  selector: 'taon-github-fork-me-ribbon',
  templateUrl: './taon-github-fork-me-ribbon.component.html',
  styleUrls: ['./taon-github-fork-me-ribbon.component.scss'],
  standalone: false,
})
export class TaonGithubForkMeRibbonComponent {
  @Input() url: string = 'https://github.com';
}
//#endregion
