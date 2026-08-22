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
import { ActivatedRoute, Router } from '@angular/router';
import { DocsHeading } from '../taon-layout-docs-gen/taon-layout-docs-gen.models';
import { BehaviorSubject, Subject } from 'rxjs';

@Component({
  selector: 'taon-docs-page',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './taon-docs-page.component.html',
  styleUrls: ['./taon-docs-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaonDocsPageComponent {
  public baseHref: string;

  public newHeading = new BehaviorSubject<DocsHeading[]>([]);

  headings: DocsHeading[] = [];

  ngAfterViewInit(): void {
    this.newHeading.next(this.headings);
  }
}
