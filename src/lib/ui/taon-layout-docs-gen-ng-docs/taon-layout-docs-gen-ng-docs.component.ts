//#region imports
import { CommonModule, DOCUMENT } from '@angular/common';
import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  EventEmitter,
  HostListener,
  inject,
  input,
  Input,
  OnInit,
  Output,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSidenavModule } from '@angular/material/sidenav';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { TranslatePipe, Translation } from '@taon-dev/i18n/src';
import Fuse from 'fuse.js';
import { filter, map } from 'rxjs';

import { Replecables } from '../../constants';
import { TaonAdminService } from '../taon-admin-mode-configuration/taon-admin.service';
import {
  DocsHeading,
  DocsMenuItem,
  IndexData,
  ResultData,
} from '../taon-layout-docs-mkdocs-like/taon-layout-docs-mkdocs-like.models';
//#endregion

type SidebarEntry =
  | { kind: 'group'; name: string }
  | { kind: 'category'; name: string; items: DocsMenuItem[] }
  | { kind: 'page'; item: DocsMenuItem };

const t = Translation.for(
  Replecables.__FILE_RELATIVE_PATH__,
  Replecables.__LANG_IMPORT_MAP__,
);

@Component({
  selector: 'taon-layout-docs-gen-ng-docs',
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
    TranslatePipe,
  ],
  templateUrl: './taon-layout-docs-gen-ng-docs.component.html',
  styleUrls: [
    './taon-layout-docs-gen-ng-docs.component.scss',
    './taon-layout-docs-gen-ng-docs-router-outlet.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaonLayoutDocsGenNgDocsComponent implements OnInit {
  //#region fields & getters
  t = t.for(this);

  public activeHeadingId: string | undefined;

  private readonly router = inject(Router);

  private readonly document = inject(DOCUMENT);

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly docsContentRef =
    viewChild<ElementRef<HTMLElement>>('docsContent');

  private readonly activatedRoute = inject(ActivatedRoute);

  readonly hideDocsSearch = toSignal(
    this.activatedRoute.queryParamMap.pipe(
      map(params => params.has('apiSymbol')),
    ),
    { initialValue: false },
  );

  private readonly baseHrefValue = signal('');

  @Input({ required: true })
  set baseHref(value: string) {
    this.baseHrefValue.set(value);
  }

  get baseHref(): string {
    return this.baseHrefValue();
  }

  readonly menuItems = input<DocsMenuItem[]>([]);

  //#region reading shortcuts
  private readonly readingShortcutLimit = 5;

  private readonly recentDocPaths = signal<string[]>([]);

  protected readonly readingShortcuts = computed(() => {
    const items = this.menuItems();
    const itemsByPath = new Map(items.map(item => [item.pathToMd, item]));
    const shortcuts = new Map<string, DocsMenuItem>();

    for (const path of this.recentDocPaths()) {
      const item = itemsByPath.get(path);

      if (item) {
        shortcuts.set(path, item);
      }
    }

    for (const item of items) {
      if (shortcuts.size >= this.readingShortcutLimit) {
        break;
      }

      if (item.recommended?.trim() && !shortcuts.has(item.pathToMd)) {
        shortcuts.set(item.pathToMd, item);
      }
    }

    return [...shortcuts.values()];
  });

  protected readonly readingLinksOverflow = signal(false);

  private readonly readingLinksRef =
    viewChild<ElementRef<HTMLElement>>('readingLinks');

  protected scrollReadingLinks(direction: -1 | 1): void {
    const links = this.readingLinksRef()?.nativeElement;
    if (!links) {
      return;
    }

    links.scrollBy({
      left: direction * links.clientWidth,
      behavior: 'smooth',
    });
  }
  //#endregion

  private readonly navigationPath = toSignal(
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.currentRoutePath),
    ),
    { initialValue: this.currentRoutePath },
  );

  private readonly sidebarSelection = signal<{
    path: string;
    group: string | null;
  } | null>(null);

  protected readonly activePageGroup = computed(() => {
    this.navigationPath();

    return (
      this.menuItems()
        .find(item =>
          this.router.isActive(
            this.router.createUrlTree([this.baseHref + '/' + item.pathToMd]),
            {
              paths: 'exact',
              queryParams: 'ignored',
              fragment: 'ignored',
              matrixParams: 'ignored',
            },
          ),
        )
        ?.group?.trim() || null
    );
  });

  protected readonly sidebarGroup = computed(() => {
    const path = this.navigationPath();
    const selection = this.sidebarSelection();

    return selection?.path === path ? selection.group : this.activePageGroup();
  });

  protected showSidebarGroup(group: string | null): void {
    this.sidebarSelection.set({ path: this.navigationPath(), group });
  }

  protected readonly sidebarEntriesByGroup = computed(() => {
    const rootEntries: SidebarEntry[] = [];
    const entriesByGroup = new Map<string | null, SidebarEntry[]>([
      [null, rootEntries],
    ]);
    const categoriesByGroup = new Map<
      string | null,
      Map<string, DocsMenuItem[]>
    >();

    for (const item of this.menuItems()) {
      const group = item.group?.trim() || null;
      const category = item.category?.trim();

      let entries = entriesByGroup.get(group);
      if (!entries) {
        entries = [];
        entriesByGroup.set(group, entries);
        if (group !== null) {
          rootEntries.push({ kind: 'group', name: group });
        }
      }

      if (!category) {
        entries.push({ kind: 'page', item });
        continue;
      }

      let categories = categoriesByGroup.get(group);
      if (!categories) {
        categories = new Map();
        categoriesByGroup.set(group, categories);
      }

      const existing = categories.get(category);
      if (existing) {
        existing.push(item);
      } else {
        const items = [item];
        categories.set(category, items);
        entries.push({ kind: 'category', name: category, items });
      }
    }

    return entriesByGroup;
  });

  protected readonly desktopSidebarEntries = computed(
    () => this.sidebarEntriesByGroup().get(this.sidebarGroup()) ?? [],
  );

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

  protected readonly selectedSearchResultIndex = signal(0);

  @Output() menuItemClick = new EventEmitter<DocsMenuItem>();

  protected readonly mobileTocOpen = signal(false);

  protected readonly searchOpen = signal(false);

  protected readonly searchQuery = signal('');

  private lastScrollY = 0;

  public showScrollToTop = false;

  public showScrollToTopWhenScrollDown = false;

  protected get searchResults(): ResultData[] {
    return this.search(this.searchQuery());
  }

  private readonly searchInput =
    viewChild<ElementRef<HTMLInputElement>>('searchInput');

  //#endregion

  //#region constructor
  constructor() {
    afterRenderEffect(onCleanup => {
      const host = this.host.nativeElement;
      let siteHeader: HTMLElement | undefined;

      const updateHeight = () => {
        const firstStickyHeader = Array.from(
          this.document.body.querySelectorAll('header'),
        ).find(
          header =>
            !host.contains(header) &&
            getComputedStyle(header).position === 'sticky' &&
            header.getClientRects().length > 0,
        );

        if (firstStickyHeader !== siteHeader) {
          observer.disconnect();
          siteHeader = firstStickyHeader;

          if (siteHeader) {
            observer.observe(siteHeader);
          }
        }

        const top = Math.max(
          0,
          host.getBoundingClientRect().top,
          siteHeader?.getBoundingClientRect().bottom ?? 0,
        );
        host.style.setProperty('--docs-top', `${top}px`);
      };

      const observer = new ResizeObserver(updateHeight);
      window.addEventListener('resize', updateHeight);
      updateHeight();

      onCleanup(() => {
        observer.disconnect();
        window.removeEventListener('resize', updateHeight);
      });
    });

    afterRenderEffect(() => {
      this.navigationPath();

      const content = this.docsContentRef()?.nativeElement;
      content?.scrollTo({ top: 0, behavior: 'instant' });
    });

    afterRenderEffect(onCleanup => {
      const links = this.readingLinksRef()?.nativeElement;
      const track = links?.firstElementChild;

      if (!links || !track) {
        this.readingLinksOverflow.set(false);
        return;
      }

      const strip = links.parentElement!;
      const label = strip.querySelector<HTMLElement>('.docs-reading-label');

      const updateOverflow = () => {
        const gap = parseFloat(getComputedStyle(strip).columnGap) || 0;
        const linksStyle = getComputedStyle(links);
        const linksPadding =
          parseFloat(linksStyle.paddingLeft) +
          parseFloat(linksStyle.paddingRight);

        const labelSpace = label?.getClientRects().length
          ? label.getBoundingClientRect().width + gap
          : 0;

        const availableWidth = strip.clientWidth - labelSpace - linksPadding;
        const trackWidth = track.getBoundingClientRect().width;

        this.readingLinksOverflow.set(trackWidth > availableWidth + 1);
        // console.log('readingLinksOverflow', this.readingLinksOverflow());
      };

      const observer = new ResizeObserver(updateOverflow);
      observer.observe(strip);
      observer.observe(track);
      if (label) {
        observer.observe(label);
      }

      onCleanup(() => observer.disconnect());
      updateOverflow();
    });

    effect(() => {
      if (!this.searchOpen()) {
        return;
      }

      const input = this.searchInput();

      if (input) {
        input.nativeElement.focus();
      }
    });

    effect(() => {
      const currentPath = this.navigationPath();
      const currentItem = this.menuItems().find(item => {
        const url = this.router.createUrlTree([
          this.baseHref + '/' + item.pathToMd,
        ]);

        return this.router.serializeUrl(url) === currentPath;
      });

      if (!currentItem) {
        return;
      }

      const path = currentItem.pathToMd;

      this.recentDocPaths.update(paths =>
        [path, ...paths.filter(previousPath => previousPath !== path)].slice(
          0,
          this.readingShortcutLimit,
        ),
      );
    });
  }
  //#endregion

  //#region hooks
  ngOnInit(): void {}
  //#endregion

  //#region methods

  protected onSearchKeydown(event: KeyboardEvent): void {
    const results = this.searchResults;

    if (!results.length) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();

        this.selectedSearchResultIndex.update(index =>
          Math.min(index + 1, results.length - 1),
        );

        break;
      }

      case 'ArrowUp': {
        event.preventDefault();

        this.selectedSearchResultIndex.update(index => Math.max(index - 1, 0));

        break;
      }

      case 'Enter': {
        event.preventDefault();

        const result = results[this.selectedSearchResultIndex()];

        if (result) {
          this.openSearchResult(result);
        }

        break;
      }

      case 'Escape': {
        event.preventDefault();
        this.closeSearch();
        break;
      }
    }
  }

  //#region methods / get current horizontal menu item

  public get currentRoutePath(): string {
    return this.router.url.split('?')[0].split('#')[0];
  }

  get currentMenuItemName(): string {
    const itemPath = this.currentRoutePath.replace(this.baseHref + '/', '');
    const item = this.menuItems().find(c => c.pathToMd === itemPath);
    if (!item) {
      return 'TOP OF THE PAGE';
    }
    return item.customTitle || item.pathToMd;
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
    const view = this.document.defaultView;
    if (!view) {
      return;
    }

    const path = this.currentRoutePath;
    let previousTop: number | undefined;
    let stableFrames = 0;
    let attempts = 0;

    const maxAttempts = 60;
    const requiredStableFrames = 3;

    const check = () => {
      if (
        !this.host.nativeElement.isConnected ||
        this.currentRoutePath !== path ||
        this.activatedRoute.snapshot.fragment !== fragment
      ) {
        return;
      }

      const content = this.docsContentRef()?.nativeElement;
      const element = this.document.getElementById(fragment);

      if (!content || !element || !content.contains(element)) {
        if (++attempts < maxAttempts) {
          view.requestAnimationFrame(check);
        }
        return;
      }

      const top =
        content.scrollTop +
        element.getBoundingClientRect().top -
        content.getBoundingClientRect().top;

      if (previousTop !== undefined && Math.abs(top - previousTop) < 1) {
        stableFrames++;
      } else {
        stableFrames = 0;
      }

      previousTop = top;
      attempts++;

      if (stableFrames >= requiredStableFrames || attempts >= maxAttempts) {
        this.scrollDocsToHeading(fragment, 'instant');

        return;
      }

      view.requestAnimationFrame(check);
    };

    view.requestAnimationFrame(check);
  }
  //#endregion

  //#region methods / toggle search
  protected toggleSearch(): void {
    this.searchOpen.update(value => !value);
  }
  //#endregion

  @HostListener('window:keydown', ['$event'])
  protected onGlobalKeydown(event: KeyboardEvent): void {
    const isSearchShortcut =
      (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';

    if (!isSearchShortcut) {
      return;
    }

    event.preventDefault();

    this.searchOpen.update(open => !open);
  }

  //#region methods / close search
  protected closeSearch(): void {
    this.searchOpen.set(false);
    this.searchQuery.set('');
    this.selectedSearchResultIndex.set(0);
  }
  //#endregion

  //#region methods / open search result
  protected openSearchResult(result: ResultData): void {
    this.searchOpen.set(false);
    this.searchQuery.set('');

    const urlToNavigate = result.api
      ? `${this.baseHref}/${result.filePath}?apiSymbol=${encodeURIComponent(result.headingId)}`
      : `${this.baseHref}/${result.filePath}#${encodeURIComponent(result.headingId)}`;

    // console.log({ urlToNavigate });
    void this.router.navigateByUrl(urlToNavigate);

    if (this.currentRoutePath.endsWith(`${this.baseHref}/${result.filePath}`)) {
      this.activeHeadingId = result.headingId;

      this.scrollDocsToHeading(result.headingId, 'instant');
    }
  }
  //#endregion

  //#region methods / open mobile toc
  protected openMobileToc(): void {
    this.mobileTocOpen.set(true);
  }
  //#endregion

  //#region methods / scroll to top
  protected scrollToTop(): void {
    this.docsContentRef()?.nativeElement.scrollTo({
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

    this.scrollDocsToHeading(heading.id, 'smooth');

    void this.router.navigate([], {
      relativeTo: this.activatedRoute,
      fragment: heading.id,
      queryParamsHandling: 'preserve',
      replaceUrl: true,
    });
  }
  //#endregion

  //#region methods / docs scrolling
  private scrollDocsToHeading(id: string, behavior: ScrollBehavior): void {
    const content = this.docsContentRef()?.nativeElement;
    const element = this.document.getElementById(id);

    if (!content || !element || !content.contains(element)) {
      return;
    }

    const scrollPadding =
      parseFloat(getComputedStyle(content).scrollPaddingTop) || 0;

    content.scrollTo({
      top:
        content.scrollTop +
        element.getBoundingClientRect().top -
        content.getBoundingClientRect().top -
        content.clientTop -
        scrollPadding,
      behavior,
    });
  }

  protected onDocsScroll(scrollTop: number): void {
    const farEnoughFromTop = scrollTop > 200;

    this.showScrollToTop = scrollTop < this.lastScrollY && farEnoughFromTop;
    this.showScrollToTopWhenScrollDown = farEnoughFromTop;
    this.lastScrollY = scrollTop;
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
        api: result.item.api,
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
