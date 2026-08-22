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

export interface IndexData {
  filePath: string;

  headingId: string;
  headingTitle: string;

  /**
   * Plain searchable text.
   * No HTML.
   */
  text: string;

  /**
   * Optional ready-to-render HTML fragment for result preview.
   */
  html?: string;
}

export interface ResultData {
  filePath: string;
  headingId: string;
  headingTitle: string;

  /**
   * Short relevant preview/snippet.
   */
  headingContentPart: string;

  score: number;
}
