import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { BehaviorSubject } from 'rxjs';

import { DocsHeading } from '../taon-layout-docs-mkdocs-like';

import {
  TaonTsDocsGraph,
  TaonTsDocsMember,
  TaonTsDocsSymbol,
} from './taon-ts-docs.models';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'taon-ts-docs-api',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatChipsModule,
  ],
  templateUrl: './taon-ts-docs-api.component.html',
  styleUrl: './taon-ts-docs-api.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaonTsDocsApiComponent {
  readonly graph = input.required<TaonTsDocsGraph>();

  readonly selectedSymbolId = input<string | null>(null);

  readonly showNavigation = input(true);

  readonly search = signal('');

  readonly kindFilter = signal('all');

  readonly internalSelection = signal<string | null>(null);

  readonly showSearch = input(true);

  readonly queryParamNavigation = input(false);

  private readonly route = inject(ActivatedRoute, { optional: true });

  private readonly router = inject(Router, { optional: true });

  private readonly queryParams = this.route
    ? toSignal(this.route.queryParamMap, {
        initialValue: this.route.snapshot.queryParamMap,
      })
    : null;

  readonly kinds = [
    'all',
    'class',
    'interface',
    'type',
    'enum',
    'function',
    'variable',
    'namespace',
  ];

  readonly allSymbols = computed(() =>
    Object.values(this.graph().symbols).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
  );

  readonly filteredSymbols = computed(() => {
    const q = this.search().trim().toLowerCase();
    return this.allSymbols().filter(
      s =>
        (this.kindFilter() === 'all' || s.kind === this.kindFilter()) &&
        (!q ||
          `${s.name} ${s.kind} ${s.taonCategory} ${s.fileId} ${s.docs.description}`
            .toLowerCase()
            .includes(q)),
    );
  });

  readonly selected = computed(() => {
    const navigationId =
      this.queryParamNavigation() && this.queryParams
        ? this.queryParams().get('apiSymbol')
        : this.internalSelection();

    const id = this.selectedSymbolId() ?? navigationId;

    return (
      (id ? this.graph().symbols[id] : undefined) ??
      this.filteredSymbols()[0] ??
      null
    );
  });

  select(id: string): void {
    if (this.queryParamNavigation() && this.router && this.route) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { apiSymbol: id },
        queryParamsHandling: 'merge',
        preserveFragment: true,
      });
      return;
    }

    this.internalSelection.set(id);
  }

  readonly members = computed(
    () =>
      this.selected()
        ?.members.map(id => this.graph().members[id])
        .filter((m): m is TaonTsDocsMember => !!m) ?? [],
  );

  readonly related = computed(() => {
    const id = this.selected()?.id;
    if (!id) return [];
    const memberIds = new Set(this.selected()?.members ?? []);
    const relations = this.graph().relations.filter(
      r => r.fromId === id || memberIds.has(r.fromId),
    );
    return [...new Set(relations.map(r => r.toId))]
      .map(target => this.graph().symbols[target])
      .filter((s): s is TaonTsDocsSymbol => !!s && s.id !== id);
  });

  iconFor(symbol: TaonTsDocsSymbol): string {
    if (symbol.taonCategory === 'controller') return 'api';
    if (symbol.taonCategory === 'repository') return 'storage';
    if (symbol.taonCategory === 'provider') return 'hub';
    if (symbol.taonCategory === 'entity') return 'table_chart';
    return (
      (
        {
          class: 'view_in_ar',
          interface: 'schema',
          type: 'data_object',
          enum: 'list',
          function: 'functions',
          variable: 'code',
          namespace: 'folder',
        } as Record<string, string>
      )[symbol.kind] ?? 'code'
    );
  }
}
