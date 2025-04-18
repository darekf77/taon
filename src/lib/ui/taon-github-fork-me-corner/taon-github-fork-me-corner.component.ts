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
  selector: 'taon-github-fork-me-corner',
  templateUrl: './taon-github-fork-me-corner.component.html',
  styleUrls: ['./taon-github-fork-me-corner.component.scss'],
  standalone: false,
})
export class TaonGithubForkMeCornerComponent {
  @Input() url: string = 'https://github.com';
}
//#endregion
