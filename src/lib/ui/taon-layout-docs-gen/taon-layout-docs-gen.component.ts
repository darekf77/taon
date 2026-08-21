//#region imports
import { CommonModule } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
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

import { DocsHeading, DocsMenuItem } from './taon-layout-docs-gen.models';
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
export class TaonLayoutDocsGenComponent {
  //#region fields & getters
  private readonly cdr = inject(ChangeDetectorRef);

  private readonly router = inject(Router);

  private readonly activatedRoute = inject(ActivatedRoute);

  @Input() menuItems: DocsMenuItem[] = [];

  private _pageHeadings: DocsHeading[] = [];

  @Input() set pageHeadings(v) {
    this._pageHeadings = v;
    if (this._pageHeadings.length > 0) {
      setTimeout(() => {
        this.scrollToCurrentFragment();
      }, 1000);
    }
  }

  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
  get pageHeadings() {
    return this._pageHeadings;
  }

  /**
   * Optional if parent wants to handle markdown path -> route translation.
   *
   * If unused, links below simply use pathToMd as routerLink.
   */
  @Output() menuItemClick = new EventEmitter<DocsMenuItem>();

  protected readonly mobileTocOpen = signal(false);

  protected readonly searchOpen = signal(false);

  protected readonly searchQuery = signal('');

  private lastScrollY = 0;

  public showScrollToTop = false;

  protected readonly dummySearchResults = [
    {
      title: 'Getting started',
      description: 'Installation, project creation and first Taon application.',
    },
    {
      title: 'Cloudflare Workers',
      description: 'Deploy backend and frontend applications to Cloudflare.',
    },
    {
      title: 'Database',
      description: 'Repositories, migrations and isomorphic database access.',
    },
    {
      title: 'Internationalization',
      description: 'Lazy translations, gettext and component PO files.',
    },
  ];

  protected get searchResults() {
    const query = this.searchQuery().trim().toLowerCase();

    if (!query) {
      return this.dummySearchResults;
    }

    // Dummy behaviour for now:
    // intentionally still returns example data.
    return this.dummySearchResults;
  }
  //#endregion

  //#region hooks
  constructor() {}

  ngOnInit(): void {}
  //#endregion

  //#region methosd

  //#region methods / scroll to current fragment
  private scrollToCurrentFragment(): void {
    const fragment = this.activatedRoute.snapshot.fragment;

    if (!fragment) {
      return;
    }

    // Optional: only allow hashes that correspond to known headings.
    const headingExists = this.pageHeadings.some(
      heading => heading.id === fragment,
    );

    console.log({ fragment, headingExists });

    if (!headingExists) {
      return;
    }

    document.getElementById(fragment)?.scrollIntoView({
      behavior: 'instant',
      block: 'start',
    });
  }
  //#endregion

  //#region methods / toogle search
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

  //#region methods / toogle search
  @HostListener('window:scroll')
  public onWindowScroll(): void {
    const currentScrollY = window.scrollY;

    const scrollingUp = currentScrollY < this.lastScrollY;
    const farEnoughFromTop = currentScrollY > 200;

    this.showScrollToTop = scrollingUp && farEnoughFromTop;

    this.lastScrollY = currentScrollY;
  }
  //#endregion

  //#endregion
}
