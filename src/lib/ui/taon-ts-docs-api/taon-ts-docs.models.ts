export type TaonTsDocsSymbolKind =
  | 'class'
  | 'interface'
  | 'type'
  | 'enum'
  | 'function'
  | 'variable'
  | 'namespace';
export type TaonTsDocsMemberKind =
  | 'method'
  | 'property'
  | 'constructor'
  | 'getter'
  | 'setter'
  | 'enum-member';
export type TaonTsDocsRelationKind =
  | 'extends'
  | 'implements'
  | 'references'
  | 'parameter'
  | 'returns'
  | 'property-type';

export interface TaonTsDocsSourceLocation {
  fileId: string;
  line: number;
  column: number;
}
export interface TaonTsDocsJsDoc {
  description: string;
  tags: { name: string; text: string }[];
}
export interface TaonTsDocsType {
  text: string;
  symbolIds: string[];
}
export interface TaonTsDocsDecorator {
  name: string;
  expression: string;
}
export interface TaonTsDocsParameter {
  name: string;
  type: TaonTsDocsType;
  optional: boolean;
  rest: boolean;
  defaultValue?: string;
  docs: TaonTsDocsJsDoc;
}
export interface TaonTsDocsSignature {
  text: string;
  parameters: TaonTsDocsParameter[];
  returnType: TaonTsDocsType;
  typeParameters: string[];
}
export interface TaonTsDocsMember {
  id: string;
  ownerId: string;
  name: string;
  kind: TaonTsDocsMemberKind;
  visibility: 'public' | 'protected' | 'private';
  static: boolean;
  readonly: boolean;
  optional: boolean;
  abstract: boolean;
  docs: TaonTsDocsJsDoc;
  decorators: TaonTsDocsDecorator[];
  location: TaonTsDocsSourceLocation;
  type?: TaonTsDocsType;
  signatures: TaonTsDocsSignature[];
}
export interface TaonTsDocsSymbol {
  id: string;
  name: string;
  kind: TaonTsDocsSymbolKind;
  fileId: string;
  locations: TaonTsDocsSourceLocation[];
  exported: boolean;
  exportPaths: string[];
  docs: TaonTsDocsJsDoc;
  decorators: TaonTsDocsDecorator[];
  modifiers: string[];
  typeParameters: string[];
  heritage: { kind: 'extends' | 'implements'; type: TaonTsDocsType }[];
  members: string[];
  signatures: TaonTsDocsSignature[];
  type?: TaonTsDocsType;
  value?: string;
  taonCategory?: 'controller' | 'repository' | 'provider' | 'entity' | 'other';
}
export interface TaonTsDocsFile {
  id: string;
  imports: string[];
  exports: string[];
  symbolIds: string[];
}
export interface TaonTsDocsRelation {
  fromId: string;
  toId: string;
  kind: TaonTsDocsRelationKind;
}
export interface TaonTsDocsExport {
  moduleId: string;
  name: string;
  symbolId: string;
}
export interface TaonTsDocsGraph {
  schemaVersion: 1;
  project: { name: string; location: string };
  files: Record<string, TaonTsDocsFile>;
  symbols: Record<string, TaonTsDocsSymbol>;
  members: Record<string, TaonTsDocsMember>;
  relations: TaonTsDocsRelation[];
  exports: TaonTsDocsExport[];
  diagnostics: string[];
}
