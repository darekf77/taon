import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  Input,
  OnChanges,
  EventEmitter,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ActivatedRoute, Router } from '@angular/router';
import { Translation } from '@taon-dev/i18n/src';
import { BehaviorSubject, Subject } from 'rxjs';

import { Replecables } from '../../constants';
import { DocsHeading } from '../taon-layout-docs-gen/taon-layout-docs-gen.models';

const t = Translation.for(
  Replecables.__FILE_RELATIVE_PATH__,
  Replecables.__LANG_IMPORT_MAP__,
);

@Component({
  selector: 'taon-docs-page',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './taon-docs-page.component.html',
  styleUrls: ['./taon-docs-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaonDocsPageComponent implements AfterViewInit {
  t = t.for(this);

  public baseHref: string;

  public newHeading = new BehaviorSubject<DocsHeading[]>([]);

  headings: DocsHeading[] = [];

  ngAfterViewInit(): void {
    this.newHeading.next(this.headings);
  }

  private readonly snackBar = inject(MatSnackBar);

  async copyCode(code: string, event: any): Promise<void> {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      this.snackBar.open(this.t.gettext('Could not copy code'), 'Dismiss', {
        duration: 3000,
      });
      return;
    }

    this.snackBar.open(this.t.gettext('Copied to clipboard'), undefined, {
      duration: 1500,
    });
  }
}
