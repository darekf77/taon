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
  SimpleChanges,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

interface DocsHeading {
  id: string;
  title: string;
  level: 1 | 2 | 3;
}

@Component({
  selector: 'taon-docs-page',
  standalone: true,
  imports: [CommonModule],
  encapsulation: ViewEncapsulation.None,
  templateUrl: './taon-docs-page.component.html',
  styleUrls: ['./taon-docs-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaonDocsPageComponent implements AfterViewInit, OnChanges {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  @Input({ required: true }) html = '';

  @ViewChild('content')
  contentRef!: ElementRef<HTMLElement>;

  headings: DocsHeading[] = [];

  ngAfterViewInit(): void {
    this.refreshHeadings();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['html'] && !changes['html'].firstChange) {
      queueMicrotask(() => this.refreshHeadings());
    }
  }

  scrollToHeading(id: string): void {
    const element = this.getHeadingElement(id);

    if (!element) {
      return;
    }

    element.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    // Important:
    // Don't use:
    //
    // history.replaceState(null, '', `#${id}`);
    //
    // With Angular hash routing that replaces the Angular route itself.
    //
    // Let Angular Router update only the fragment while preserving
    // the current route and query params.
    void this.router.navigate([], {
      relativeTo: this.activatedRoute,
      fragment: id,
      queryParamsHandling: 'preserve',
      replaceUrl: true,
    });
  }

  private refreshHeadings(): void {
    const content = this.contentRef?.nativeElement;

    if (!content) {
      return;
    }

    const headingElements = Array.from(
      content.querySelectorAll<HTMLHeadingElement>('h1, h2, h3'),
    );

    const usedIds = new Map<string, number>();

    this.headings = headingElements.map(heading => {
      const title = heading.textContent?.trim() || '';

      const baseId = this.slugify(title) || 'section';

      const currentCount = usedIds.get(baseId) || 0;
      usedIds.set(baseId, currentCount + 1);

      const id =
        currentCount === 0
          ? baseId
          : `${baseId}-${currentCount + 1}`;

      heading.id = id;

      return {
        id,
        title,
        level: Number(heading.tagName.slice(1)) as 1 | 2 | 3,
      };
    });

    this.cdr.detectChanges();

    this.scrollToInitialFragment();
  }

  private getHeadingElement(id: string): HTMLElement | null {
    const content = this.contentRef?.nativeElement;

    if (!content) {
      return null;
    }

    return Array.from(
      content.querySelectorAll<HTMLElement>('h1[id], h2[id], h3[id]'),
    ).find(element => element.id === id) || null;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\p{Letter}\p{Number}]+/gu, '-')
      .replace(/^-+|-+$/g, '');
  }

  private scrollToInitialFragment(): void {
    const fragment = this.activatedRoute.snapshot.fragment;

    if (!fragment) {
      return;
    }

    queueMicrotask(() => {
      this.getHeadingElement(fragment)?.scrollIntoView({
        block: 'start',
      });
    });
  }
}
