// taon-layout-docs-gen.models.ts

export interface DocsHeading {
  id: string;
  title: string;
  level: 1 | 2 | 3;
}

export interface DocsMenuItem {
  pathToMd: string;
  customTitle?: string;
}

