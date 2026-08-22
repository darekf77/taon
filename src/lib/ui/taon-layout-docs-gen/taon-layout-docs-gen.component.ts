//#region imports
import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnInit,
  Output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSidenavModule } from '@angular/material/sidenav';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import Fuse from 'fuse.js';

import {
  DocsHeading,
  DocsMenuItem,
  IndexData,
  ResultData,
} from './taon-layout-docs-gen.models';
//#endregion

@Component({
  selector: 'taon-layout-docs-gen',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,

    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatSidenavModule,
  ],
  templateUrl: './taon-layout-docs-gen.component.html',
  styleUrls: [
    './taon-layout-docs-gen.component.scss',
    './taon-layout-docs-gen-router-outlet.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaonLayoutDocsGenComponent implements OnInit {
  //#region fields & getters
  public activeHeadingId: string | undefined;

  private readonly router = inject(Router);

  private readonly activatedRoute = inject(ActivatedRoute);

  @Input({
    required: true,
  })
  baseHref: string;

  @Input() menuItems: DocsMenuItem[] = [];

  @Input() indexData: IndexData[] = [];

  private _pageHeadings: DocsHeading[] = [];

  @Input() set pageHeadings(v: DocsHeading[]) {
    this._pageHeadings = v;

    if (this._pageHeadings.length > 0) {
      this.scrollToCurrentFragment();
    }
  }

  get pageHeadings(): DocsHeading[] {
    return this._pageHeadings;
  }

  @Output() menuItemClick = new EventEmitter<DocsMenuItem>();

  protected readonly mobileTocOpen = signal(false);

  protected readonly searchOpen = signal(false);

  protected readonly searchQuery = signal('');

  private lastScrollY = 0;

  public showScrollToTop = false;

  protected get searchResults(): ResultData[] {
    return this.search(this.searchQuery());
  }
  //#endregion

  //#region hooks
  ngOnInit(): void {}
  //#endregion

  //#region methods

  //#region methods / get current horizontal menu item

  public get currentRoutePath(): string {
    return this.router.url.split('?')[0].split('#')[0];
  }

  get currentMenuItemName(): string {
    const itemPath = this.currentRoutePath.replace(this.baseHref + '/', '');
    const item = this.menuItems.find(c => c.pathToMd === itemPath);
    if (!item) {
      return 'TOP OF THE PAGE';
    }
    return item.pathToMd;
  }
  //#endregion

  //#region methods / scroll to current fragment
  private scrollToCurrentFragment(): void {
    const fragment = this.activatedRoute.snapshot.fragment;

    if (!fragment) {
      return;
    }

    const heading = this.pageHeadings.find(h => h.id === fragment);

    if (!heading) {
      return;
    }

    this.activeHeadingId = heading.id;

    this.scrollToElementWhenStable(fragment);
  }

  private scrollToElementWhenStable(fragment: string): void {
    let previousTop: number | undefined;
    let stableFrames = 0;
    let attempts = 0;

    const maxAttempts = 60;
    const requiredStableFrames = 3;

    const check = () => {
      const element = document.getElementById(fragment);

      if (!element) {
        if (++attempts < maxAttempts) {
          requestAnimationFrame(check);
        }
        return;
      }

      const top = element.getBoundingClientRect().top + window.scrollY;

      if (previousTop !== undefined && Math.abs(top - previousTop) < 1) {
        stableFrames++;
      } else {
        stableFrames = 0;
      }

      previousTop = top;
      attempts++;

      if (stableFrames >= requiredStableFrames || attempts >= maxAttempts) {
        element.scrollIntoView({
          behavior: 'instant',
          block: 'start',
        });

        return;
      }

      requestAnimationFrame(check);
    };

    requestAnimationFrame(check);
  }
  //#endregion

  //#region methods / toggle search
  protected toggleSearch(): void {
    this.searchOpen.update(value => !value);
  }
  //#endregion

  //#region methods / close search
  protected closeSearch(): void {
    this.searchOpen.set(false);
    this.searchQuery.set('');
  }
  //#endregion

  //#region methods / open search result
  protected openSearchResult(result: ResultData): void {
    this.searchOpen.set(false);
    this.searchQuery.set('');

    const urlToNavigate = `${this.baseHref}/${result.filePath}#${encodeURIComponent(result.headingId)}`;
    // console.log({ urlToNavigate });
    void this.router.navigateByUrl(urlToNavigate);
  }
  //#endregion

  //#region methods / open mobile toc
  protected openMobileToc(): void {
    this.mobileTocOpen.set(true);
  }
  //#endregion

  //#region methods / scroll to top
  protected scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });

    this.activeHeadingId = void 0;

    void this.router.navigate([], {
      relativeTo: this.activatedRoute,
      fragment: null,
      queryParamsHandling: 'preserve',
      replaceUrl: true,
    });
  }
  //#endregion

  //#region methods / close mobile toc
  protected closeMobileToc(): void {
    this.mobileTocOpen.set(false);
  }
  //#endregion

  //#region methods / scroll to heading
  protected scrollToHeading(heading: DocsHeading): void {
    this.closeMobileToc();

    this.activeHeadingId = heading.id;

    document.getElementById(heading.id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });

    void this.router.navigate([], {
      relativeTo: this.activatedRoute,
      fragment: heading.id,
      queryParamsHandling: 'preserve',
      replaceUrl: true,
    });
  }
  //#endregion

  //#region methods / window scroll
  @HostListener('window:scroll')
  @HostListener('window:scroll')
  public onWindowScroll(): void {
    const currentScrollY = window.scrollY;

    const scrollingUp = currentScrollY < this.lastScrollY;
    const farEnoughFromTop = currentScrollY > 200;

    this.showScrollToTop = scrollingUp && farEnoughFromTop;

    this.lastScrollY = currentScrollY;
  }
  //#endregion

  //#region update active heading
  private updateActiveHeading(): void {
    // console.log('updating heading');
    const headerOffset = 90;

    let activeHeadingId: string | undefined;

    for (const heading of this.pageHeadings) {
      const element = document.getElementById(heading.id);

      if (!element) {
        continue;
      }

      const top = element.getBoundingClientRect().top;

      if (top <= headerOffset) {
        activeHeadingId = heading.id;
      } else {
        break;
      }
    }

    // When we're above the first heading, optionally consider
    // the first heading active.
    if (!activeHeadingId && this.pageHeadings.length) {
      activeHeadingId = this.pageHeadings[0].id;
    }

    this.activeHeadingId = activeHeadingId;
  }
  //#endregion

  //#region methods / search
  protected search(query: string): ResultData[] {
    const normalizedQuery = query.trim();

    if (!normalizedQuery || !this.indexData.length) {
      return [];
    }

    const fuse = new Fuse(this.indexData, {
      includeScore: true,

      /**
       * 0   = exact
       * 1   = basically anything
       *
       * 0.35 gives us typo tolerance without producing
       * too much unrelated garbage.
       */
      threshold: 0.35,

      /**
       * We don't care where inside the indexed text the match occurs.
       */
      ignoreLocation: true,

      /**
       * Heading matches are more important than body matches.
       */
      keys: [
        {
          name: 'headingTitle',
          weight: 0.7,
        },
        {
          name: 'text',
          weight: 0.3,
        },
      ],
    });

    return fuse
      .search(normalizedQuery)
      .slice(0, 20)
      .map(result => ({
        filePath: result.item.filePath,
        headingId: result.item.headingId,
        headingTitle: result.item.headingTitle,

        headingContentPart: this.createSnippet(
          result.item.text,
          normalizedQuery,
        ),

        score: result.score ?? 1,
      }));
  }
  //#endregion

  //#region methods / create snippet
  private createSnippet(text: string, query: string, maxLength = 180): string {
    const normalizedText = text.replace(/\s+/g, ' ').trim();

    if (normalizedText.length <= maxLength) {
      return normalizedText;
    }

    const lowerText = normalizedText.toLowerCase();

    const words = query
      .toLowerCase()
      .split(/\s+/)
      .map(word => word.trim())
      .filter(Boolean);

    let matchIndex = -1;

    /**
     * Fuse may match a typo, so exact word lookup here can fail.
     * We still try exact words first because that gives the nicest
     * snippet when possible.
     */
    for (const word of words) {
      const index = lowerText.indexOf(word);

      if (index !== -1 && (matchIndex === -1 || index < matchIndex)) {
        matchIndex = index;
      }
    }

    /**
     * Fuzzy match but no exact substring found.
     * Just use the beginning of the section.
     */
    if (matchIndex === -1) {
      return normalizedText.slice(0, maxLength).trim() + '…';
    }

    const half = Math.floor(maxLength / 2);

    let start = Math.max(0, matchIndex - half);
    let end = Math.min(normalizedText.length, start + maxLength);

    /**
     * If we're close to the end, move the start backwards
     * so we still use approximately maxLength characters.
     */
    if (end === normalizedText.length) {
      start = Math.max(0, end - maxLength);
    }

    /**
     * Avoid beginning the snippet in the middle of a word.
     */
    if (start > 0) {
      const nextSpace = normalizedText.indexOf(' ', start);

      if (nextSpace !== -1 && nextSpace < matchIndex) {
        start = nextSpace + 1;
      }
    }

    end = Math.min(normalizedText.length, start + maxLength);

    return (
      (start > 0 ? '…' : '') +
      normalizedText.slice(start, end).trim() +
      (end < normalizedText.length ? '…' : '')
    );
  }
  //#endregion

  //#endregion
}
