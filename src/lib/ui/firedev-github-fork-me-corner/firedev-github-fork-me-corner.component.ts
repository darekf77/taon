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
  selector: 'firedev-github-fork-me-corner',
  templateUrl: './firedev-github-fork-me-corner.component.html',
  styleUrls: ['./firedev-github-fork-me-corner.component.scss'],
})
export class FiredevGithubForkMeCornerComponent {
  @Input() url: string = 'https://github.com';
}
//#endregion
