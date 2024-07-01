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
  selector: 'firedev-github-fork-me-ribbon',
  templateUrl: './firedev-github-fork-me-ribbon.component.html',
  styleUrls: ['./firedev-github-fork-me-ribbon.component.scss'],
})
export class FiredevGithubForkMeRibbonComponent {
  @Input() url: string = 'https://github.com';
}
//#endregion
