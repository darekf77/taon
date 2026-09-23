import type { DataSource, EntityMetadata } from 'taon-typeorm/src';
import { fse, UtilsFilesFoldersSync } from 'tnp-core/src';

export namespace UtilsSQLdbGraph {
  export function createText(
    dataSource: DataSource,

    options: TextGraphOptions = {},
  ): string {
    //#region @backendFunc
    //#region @esmRemove
    options = options || {};
    const { absPathToTextFile } = options;
    const {
      showColumns = true,
      showColumnTypes = true,
      showRelationNames = true,
    } = options;

    const metadatas = dataSource.entityMetadatas;

    if (metadatas.length === 0) {
      return '(empty database)';
    }

    const metadataByTable = new Map(
      metadatas.map(metadata => [metadata.tableName, metadata]),
    );

    //
    // Build dependency graph:
    //
    // User
    //   ↓
    // UserRole
    //   ↓
    // Role
    //

    const outgoing = new Map<string, Set<string>>();
    const incomingCount = new Map<string, number>();

    for (const metadata of metadatas) {
      outgoing.set(metadata.tableName, new Set());
      incomingCount.set(metadata.tableName, 0);
    }

    for (const metadata of metadatas) {
      for (const relation of metadata.relations) {
        const target = relation.inverseEntityMetadata;

        if (!target) {
          continue;
        }

        const from = metadata.tableName;
        const to = target.tableName;

        if (from === to) {
          continue;
        }

        const targets = outgoing.get(from)!;

        if (!targets.has(to)) {
          targets.add(to);
          incomingCount.set(to, (incomingCount.get(to) ?? 0) + 1);
        }
      }
    }

    //
    // Assign levels.
    //
    // Cycles are expected in relational schemas, so this is intentionally
    // tolerant rather than being a strict topological sort.
    //

    const levels = new Map<string, number>();

    const roots = metadatas
      .map(metadata => metadata.tableName)
      .filter(table => incomingCount.get(table) === 0);

    const queue = roots.map(table => ({
      table,
      level: 0,
    }));

    if (queue.length === 0) {
      queue.push({
        table: metadatas[0].tableName,
        level: 0,
      });
    }

    while (queue.length > 0) {
      const current = queue.shift()!;

      const existingLevel = levels.get(current.table);

      if (existingLevel !== undefined && existingLevel >= current.level) {
        continue;
      }

      levels.set(current.table, current.level);

      for (const target of outgoing.get(current.table) ?? []) {
        if (current.level < metadatas.length) {
          queue.push({
            table: target,
            level: current.level + 1,
          });
        }
      }
    }

    //
    // Tables that weren't reached because of cycles/disconnected graphs.
    //

    let maxLevel = Math.max(0, ...levels.values());

    for (const metadata of metadatas) {
      if (!levels.has(metadata.tableName)) {
        levels.set(metadata.tableName, ++maxLevel);
      }
    }

    const grouped = new Map<number, EntityMetadata[]>();

    for (const metadata of metadatas) {
      const level = levels.get(metadata.tableName) ?? 0;

      if (!grouped.has(level)) {
        grouped.set(level, []);
      }

      grouped.get(level)!.push(metadata);
    }

    const result: string[] = [];

    for (const level of [...grouped.keys()].sort((a, b) => a - b)) {
      const entities = grouped.get(level)!;

      for (const metadata of entities) {
        result.push(renderEntityBox(metadata, showColumns, showColumnTypes));

        const relations = metadata.relations.filter(
          relation => relation.inverseEntityMetadata,
        );

        if (relations.length > 0) {
          for (const relation of relations) {
            const target = relation.inverseEntityMetadata!;

            const label = showRelationNames ? relation.propertyName : '';

            result.push(renderRelation(label, target.tableName));
          }

          result.push('');
        }
      }
    }

    const generatedFile = options.compactForTerminal
      ? renderCompactGraph(
          metadatas,
          showColumns,
          showColumnTypes,
          showRelationNames,
        )
      : renderWideGraph(
          metadatas,
          showColumns,
          showColumnTypes,
          showRelationNames,
        );

    if (absPathToTextFile) {
      UtilsFilesFoldersSync.writeFile(absPathToTextFile, generatedFile);
    }
    return generatedFile;
    //#endregion
    return void 0 as any;
    //#endregion
  }

  export async function createDrawio(
    dataSource: DataSource,
    outputAbsPathToDrawio: string,
  ): Promise<void> {
    //#region @backendFunc
    //#region @esmRemove
    const TABLE_WIDTH = 300;
    const HEADER_HEIGHT = 34;
    const ROW_HEIGHT = 26;

    const HORIZONTAL_GAP = 100;
    const VERTICAL_GAP = 100;

    interface DrawioTable {
      metadata: EntityMetadata;
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }

    const escapeXml = (value: unknown): string => {
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    const tables: DrawioTable[] = dataSource.entityMetadatas.map(
      (metadata, index) => {
        const columnsCount = metadata.columns.length;

        //
        // Simple grid initially.
        //
        // Draw.io is editable anyway, so the initial
        // positioning doesn't have to be perfect.
        //

        const columnsPerRow = 4;

        const column = index % columnsPerRow;

        const row = Math.floor(index / columnsPerRow);

        return {
          metadata,
          id: `table-${index}`,
          x: 40 + column * (TABLE_WIDTH + HORIZONTAL_GAP),
          y: 40 + row * (400 + VERTICAL_GAP),
          width: TABLE_WIDTH,
          height: HEADER_HEIGHT + columnsCount * ROW_HEIGHT,
        };
      },
    );

    const tableByMetadata = new Map<EntityMetadata, DrawioTable>(
      tables.map(table => [table.metadata, table]),
    );

    const cells: string[] = [];

    cells.push(`
    <mxCell id="0"/>
    <mxCell id="1" parent="0"/>
  `);

    //
    // Tables.
    //

    for (const table of tables) {
      const { metadata } = table;

      //
      // Main table container.
      //

      cells.push(`
      <mxCell
        id="${table.id}"
        value=""
        style="swimlane;html=1;startSize=${HEADER_HEIGHT};horizontal=1;rounded=0;shadow=0;"
        vertex="1"
        parent="1"
      >
        <mxGeometry
          x="${table.x}"
          y="${table.y}"
          width="${table.width}"
          height="${table.height}"
          as="geometry"
        />
      </mxCell>
    `);

      //
      // Header.
      //

      cells.push(`
      <mxCell
        id="${table.id}-header"
        value="${escapeXml(metadata.tableName)}"
        style="text;html=1;align=center;verticalAlign=middle;fontStyle=1;fontSize=14;"
        vertex="1"
        parent="${table.id}"
      >
        <mxGeometry
          x="0"
          y="0"
          width="${table.width}"
          height="${HEADER_HEIGHT}"
          as="geometry"
        />
      </mxCell>
    `);

      //
      // Columns.
      //

      metadata.columns.forEach((column, columnIndex) => {
        const flags: string[] = [];

        if (column.isPrimary) {
          flags.push('PK');
        }

        if (column.relationMetadata) {
          flags.push('FK');
        }

        if (column.isNullable) {
          flags.push('NULL');
        }

        const type = normalizeColumnType(column.type);

        const flagsText = flags.length > 0 ? ` ${flags.join(' ')}` : '';

        const value = `${column.databaseName}   ${type}${flagsText}`;

        cells.push(`
          <mxCell
            id="${table.id}-column-${columnIndex}"
            value="${escapeXml(value)}"
            style="text;html=1;align=left;verticalAlign=middle;spacingLeft=8;fontSize=12;"
            vertex="1"
            parent="${table.id}"
          >
            <mxGeometry
              x="0"
              y="${HEADER_HEIGHT + columnIndex * ROW_HEIGHT}"
              width="${table.width}"
              height="${ROW_HEIGHT}"
              as="geometry"
            />
          </mxCell>
        `);
      });
    }

    //
    // Relations.
    //

    let relationIndex = 0;

    for (const sourceTable of tables) {
      const metadata = sourceTable.metadata;

      for (const relation of metadata.relations) {
        const targetMetadata = relation.inverseEntityMetadata;

        if (!targetMetadata) {
          continue;
        }

        const targetTable = tableByMetadata.get(targetMetadata);

        if (!targetTable) {
          continue;
        }

        //
        // Only render owning FK side.
        //
        // This prevents TypeORM inverse relation pairs
        // from creating two arrows for the same FK.
        //

        if (relation.joinColumns.length === 0) {
          continue;
        }

        const relationColumns = relation.joinColumns
          .map(column => column.databaseName)
          .join(', ');

        cells.push(`
        <mxCell
          id="relation-${relationIndex++}"
          value="${escapeXml(relationColumns || relation.propertyName)}"
          style="edgeStyle=orthogonalEdgeStyle;rounded=0;orthogonalLoop=1;jettySize=auto;html=1;endArrow=ERone;startArrow=ERmany;"
          edge="1"
          parent="1"
          source="${sourceTable.id}"
          target="${targetTable.id}"
        >
          <mxGeometry
            relative="1"
            as="geometry"
          />
        </mxCell>
      `);
      }
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<mxfile
  host="app.diagrams.net"
  modified="${new Date().toISOString()}"
  agent="Taon"
  version="1"
  type="device"
>
  <diagram
    id="taon-db-schema"
    name="Database Schema"
  >
    <mxGraphModel
      dx="1422"
      dy="794"
      grid="1"
      gridSize="10"
      guides="1"
      tooltips="1"
      connect="1"
      arrows="1"
      fold="1"
      page="1"
      pageScale="1"
      pageWidth="1169"
      pageHeight="827"
      math="0"
      shadow="0"
    >
      <root>
        ${cells.join('\n')}
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>`;

    await fse.writeFile(outputAbsPathToDrawio, xml, 'utf8');

    //#endregion
    //#endregion
  }

  export async function createSvg(
    typeormConnectionDataSource: DataSource,
    outputAbsPathToSvg: string,
  ): Promise<void> {
    //#region @backend
    //#region @esmRemove
    const dot = createDotFromTypeormDataSource(typeormConnectionDataSource);
    const Viz = require('@viz-js/viz');
    const viz = await Viz.instance();

    const svg = viz.renderString(dot, {
      format: 'svg',
      engine: 'dot',
    });

    await fse.writeFile(outputAbsPathToSvg, svg);
    //#endregion
    return void 0 as any;
    //#endregion
  }

  export async function createPng(
    typeormConnectionDataSource: DataSource,
    outputAbsPathToPng: string,
  ): Promise<void> {
    //#region @backend
    //#region @esmRemove
    const dot = createDotFromTypeormDataSource(typeormConnectionDataSource);
    const Viz = require('@viz-js/viz');
    const viz = await Viz.instance();

    const svg = viz.renderString(dot, {
      format: 'svg',
      engine: 'dot',
    });
    const sharePackageName = 'sharp';
    const sharp = require(sharePackageName) as typeof import('sharp');
    await sharp(Buffer.from(svg)).png().toFile(outputAbsPathToPng);
    //#endregion
    //#endregion
  }
}

function createDotFromTypeormDataSource(dataSource: DataSource): string {
  //#region @backendFunc
  //#region @esmRemove
  const lines: string[] = [];

  lines.push('digraph database {');

  lines.push(`
    graph [
      rankdir=LR
      bgcolor="transparent"
      pad=0.4
      nodesep=0.6
      ranksep=1.0
    ]

    node [
      shape=plain
      fontname="Arial"
    ]

    edge [
      fontname="Arial"
      fontsize=10
    ]
  `);

  for (const metadata of dataSource.entityMetadatas) {
    lines.push(createEntityNode(metadata));
  }

  for (const metadata of dataSource.entityMetadatas) {
    for (const relation of metadata.relations) {
      const target = relation.inverseEntityMetadata;

      if (!target) {
        continue;
      }

      const relationColumns = relation.joinColumns
        .map(column => column.databaseName)
        .join(', ');

      lines.push(`
        "${escapeDot(metadata.tableName)}" ->
        "${escapeDot(target.tableName)}"
        [
          label="${escapeDot(relationColumns || relation.propertyName)}"
          arrowhead="vee"
        ];
      `);
    }
  }

  lines.push('}');

  return lines.join('\n');
  //#endregion
  return void 0 as any;
  //#endregion
}

function createEntityNode(metadata: EntityMetadata): string {
  //#region @backendFunc
  //#region @esmRemove
  const columns = metadata.columns
    .map(column => {
      const flags: string[] = [];

      if (column.isPrimary) {
        flags.push('PK');
      }

      if (column.isNullable) {
        flags.push('NULL');
      }

      const relationSuffix = column.relationMetadata ? ' FK' : '';

      const flagsText = flags.length > 0 ? ` [${flags.join(', ')}]` : '';

      return `
        <TR>
          <TD ALIGN="LEFT">
            ${escapeHtml(column.databaseName)}
          </TD>

          <TD ALIGN="LEFT">
            ${escapeHtml(
              normalizeColumnType(column.type),
            )}${relationSuffix}${flagsText}
          </TD>
        </TR>
      `;
    })
    .join('\n');

  return `
    "${escapeDot(metadata.tableName)}" [
      label=<
        <TABLE
          BORDER="1"
          CELLBORDER="0"
          CELLSPACING="0"
          CELLPADDING="6"
        >

          <TR>
            <TD
              COLSPAN="2"
              BGCOLOR="#dddddd"
            >
              <B>${escapeHtml(metadata.tableName)}</B>
            </TD>
          </TR>

          ${columns}

        </TABLE>
      >
    ];
  `;
  //#endregion
  return void 0 as any;
  //#endregion
}

function normalizeColumnType(type: unknown): string {
  //#region @backendFunc
  if (typeof type === 'string') {
    return type;
  }

  if (typeof type === 'function') {
    return type.name;
  }

  return String(type);
  //#endregion
}

function escapeDot(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

interface TextGraphOptions {
  showColumns?: boolean;
  showColumnTypes?: boolean;
  showRelationNames?: boolean;
  absPathToTextFile?: string;
  /**
   * Compact vertical representation intended for narrow terminals.
   *
   * Default: false
   */
  compactForTerminal?: boolean;
}

function renderCompactGraph(
  metadatas: EntityMetadata[],
  showColumns: boolean,
  showColumnTypes: boolean,
  showRelationNames: boolean,
): string {
  //#region @backendFunc
  //#region @esmRemove
  const result: string[] = [];

  for (const metadata of metadatas) {
    result.push(renderEntityBox(metadata, showColumns, showColumnTypes));

    const relations = metadata.relations.filter(
      relation => relation.inverseEntityMetadata,
    );

    for (const relation of relations) {
      const target = relation.inverseEntityMetadata!;

      result.push(
        renderRelation(
          showRelationNames ? relation.propertyName : '',
          target.tableName,
        ),
      );
    }

    if (relations.length > 0) {
      result.push('');
    }
  }

  return result.join('\n').trimEnd();
  //#endregion
  return void 0 as any;
  //#endregion
}

function renderWideGraph(
  metadatas: EntityMetadata[],
  showColumns: boolean,
  showColumnTypes: boolean,
  showRelationNames: boolean,
): string {
  //#region @backendFunc
  //#region @esmRemove
  if (metadatas.length === 0) {
    return '(empty database)';
  }
  const stringWidth = require('string-width');
  const HORIZONTAL_GAP = 8;
  const VERTICAL_GAP = 6;

  interface Box {
    metadata: EntityMetadata;
    lines: string[];
    width: number;
    height: number;
    x: number;
    y: number;
    level: number;
  }

  interface Edge {
    from: Box;
    to: Box;
    label: string;
  }

  //
  // Prepare boxes.
  //

  const boxes: Box[] = metadatas.map(metadata => {
    const text = renderEntityBox(metadata, showColumns, showColumnTypes);

    const lines = text.split('\n');

    return {
      metadata,
      lines,
      width: Math.max(...lines.map(line => stringWidth(line))),
      height: lines.length,
      x: 0,
      y: 0,
      level: 0,
    };
  });

  const boxByTable = new Map(boxes.map(box => [box.metadata.tableName, box]));

  //
  // Relations.
  //
  // For layout purposes we reverse FK direction:
  //
  // UserRole -> User
  //
  // becomes:
  //
  // User
  //   |
  //   v
  // UserRole
  //
  // This normally produces a much nicer ER diagram.
  //

  const edges: Edge[] = [];

  for (const box of boxes) {
    for (const relation of box.metadata.relations) {
      const targetMetadata = relation.inverseEntityMetadata;

      if (!targetMetadata) {
        continue;
      }

      const target = boxByTable.get(targetMetadata.tableName);

      if (!target || target === box) {
        continue;
      }

      //
      // Avoid duplicate inverse TypeORM relations.
      //

      const alreadyExists = edges.some(edge => {
        return (
          (edge.from === box && edge.to === target) ||
          (edge.from === target && edge.to === box)
        );
      });

      if (alreadyExists) {
        continue;
      }

      edges.push({
        from: target,
        to: box,
        label: showRelationNames ? relation.propertyName : '',
      });
    }
  }

  //
  // Assign levels.
  //
  // level 0:
  //
  // User      Role      Permission
  //
  // level 1:
  //
  // UserRole       RolePermission
  //

  const incoming = new Map<Box, number>();

  for (const box of boxes) {
    incoming.set(box, 0);
  }

  for (const edge of edges) {
    incoming.set(edge.to, (incoming.get(edge.to) ?? 0) + 1);
  }

  const queue = boxes
    .filter(box => incoming.get(box) === 0)
    .map(box => ({
      box,
      level: 0,
    }));

  //
  // Fully cyclic graph.
  //

  if (queue.length === 0) {
    queue.push({
      box: boxes[0],
      level: 0,
    });
  }

  const visited = new Set<Box>();

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current.box) && current.level <= current.box.level) {
      continue;
    }

    current.box.level = Math.max(current.box.level, current.level);

    visited.add(current.box);

    for (const edge of edges) {
      if (edge.from !== current.box) {
        continue;
      }

      //
      // Prevent cycles from increasing level forever.
      //

      if (!visited.has(edge.to)) {
        queue.push({
          box: edge.to,
          level: current.box.level + 1,
        });
      }
    }
  }

  //
  // Disconnected/cyclic leftovers.
  //

  let maxLevel = Math.max(0, ...boxes.map(box => box.level));

  for (const box of boxes) {
    if (!visited.has(box)) {
      box.level = ++maxLevel;
    }
  }

  //
  // Group by level.
  //

  const levels = new Map<number, Box[]>();

  for (const box of boxes) {
    if (!levels.has(box.level)) {
      levels.set(box.level, []);
    }

    levels.get(box.level)!.push(box);
  }

  //
  // Calculate row heights.
  //

  const sortedLevels = [...levels.keys()].sort((a, b) => a - b);

  let currentY = 0;

  for (const level of sortedLevels) {
    const levelBoxes = levels.get(level)!;

    const rowHeight = Math.max(...levelBoxes.map(box => box.height));

    //
    // Put boxes next to each other.
    //

    let currentX = 0;

    for (const box of levelBoxes) {
      box.x = currentX;
      box.y = currentY;

      currentX += box.width + HORIZONTAL_GAP;
    }

    currentY += rowHeight + VERTICAL_GAP;
  }

  //
  // Center each row relative to widest row.
  //

  const rowWidths = new Map<number, number>();

  let canvasWidth = 0;

  for (const level of sortedLevels) {
    const levelBoxes = levels.get(level)!;

    const width =
      levelBoxes.length === 0
        ? 0
        : Math.max(...levelBoxes.map(box => box.x + box.width));

    rowWidths.set(level, width);
    canvasWidth = Math.max(canvasWidth, width);
  }

  for (const level of sortedLevels) {
    const levelBoxes = levels.get(level)!;
    const rowWidth = rowWidths.get(level) ?? 0;

    const offset = Math.floor((canvasWidth - rowWidth) / 2);

    for (const box of levelBoxes) {
      box.x += offset;
    }
  }

  //
  // Canvas.
  //

  const canvasHeight = Math.max(...boxes.map(box => box.y + box.height)) + 1;

  const canvas: string[][] = Array.from({ length: canvasHeight }, () =>
    Array.from({ length: canvasWidth + 2 }, () => ' '),
  );

  //
  // Draw boxes first.
  //

  for (const box of boxes) {
    for (let lineIndex = 0; lineIndex < box.lines.length; lineIndex++) {
      drawText(canvas, box.x, box.y + lineIndex, box.lines[lineIndex]);
    }
  }

  //
  // Draw relations.
  //
  // We primarily route vertically between levels.
  //

  for (const edge of edges) {
    drawWideRelation(canvas, edge.from, edge.to, edge.label);
  }

  //
  // Convert canvas to text.
  //

  return canvas
    .map(row => row.join('').trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimEnd();

  //#endregion
  return void 0 as any;
  //#endregion
}

function drawWideRelation(
  canvas: string[][],
  from: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  to: {
    x: number;
    y: number;
    width: number;
    height: number;
  },
  label: string,
): void {
  //#region @backendFunc
  //#region @esmRemove
  const stringWidth = require('string-width');
  const fromX = from.x + Math.floor(from.width / 2);

  const fromY = from.y + from.height;

  const toX = to.x + Math.floor(to.width / 2);

  const toY = to.y - 1;

  //
  // Destination above/same level.
  //
  // Don't try clever routing for cycles.
  //

  if (toY <= fromY) {
    return;
  }

  const middleY = Math.floor((fromY + toY) / 2);

  //
  // Vertical out.
  //

  for (let y = fromY; y <= middleY; y++) {
    drawGraphChar(canvas, fromX, y, '│');
  }

  //
  // Horizontal section.
  //

  if (fromX !== toX) {
    const minX = Math.min(fromX, toX);

    const maxX = Math.max(fromX, toX);

    for (let x = minX; x <= maxX; x++) {
      drawGraphChar(canvas, x, middleY, '─');
    }

    drawGraphChar(canvas, fromX, middleY, fromX < toX ? '└' : '┘');

    drawGraphChar(canvas, toX, middleY, fromX < toX ? '┐' : '┌');
  }

  //
  // Vertical into target.
  //

  for (let y = middleY + 1; y < toY; y++) {
    drawGraphChar(canvas, toX, y, '│');
  }

  drawGraphChar(canvas, toX, toY, '▼');

  //
  // Relation label.
  //

  if (label) {
    const labelY = middleY > fromY ? middleY - 1 : middleY + 1;

    const labelX = Math.max(
      0,
      Math.floor((fromX + toX) / 2 - stringWidth(label) / 2),
    );

    drawText(canvas, labelX, labelY, label);
  }

  //#endregion
  //#endregion
}

function drawText(
  canvas: string[][],
  x: number,
  y: number,
  text: string,
): void {
  //#region @backendFunc
  //#region @esmRemove
  if (y < 0 || y >= canvas.length) {
    return;
  }

  for (let index = 0; index < text.length; index++) {
    const targetX = x + index;

    if (targetX < 0 || targetX >= canvas[y].length) {
      continue;
    }

    canvas[y][targetX] = text[index];
  }

  //#endregion
  //#endregion
}

function drawGraphChar(
  canvas: string[][],
  x: number,
  y: number,
  char: string,
): void {
  //#region @backendFunc
  //#region @esmRemove

  if (y < 0 || y >= canvas.length || x < 0 || x >= canvas[y].length) {
    return;
  }

  const current = canvas[y][x];

  if (current === ' ') {
    canvas[y][x] = char;
    return;
  }

  //
  // Preserve arrows.
  //

  if (
    current === '▼' ||
    current === '▲' ||
    current === '◄' ||
    current === '►'
  ) {
    return;
  }

  //
  // Simple crossing.
  //

  const currentHorizontal = current === '─';

  const currentVertical = current === '│';

  const newHorizontal = char === '─';

  const newVertical = char === '│';

  if (
    (currentHorizontal && newVertical) ||
    (currentVertical && newHorizontal)
  ) {
    canvas[y][x] = '┼';
    return;
  }

  //
  // Don't overwrite box/text content.
  //

  if (
    current !== '─' &&
    current !== '│' &&
    current !== '┌' &&
    current !== '┐' &&
    current !== '└' &&
    current !== '┘' &&
    current !== '┼'
  ) {
    return;
  }

  canvas[y][x] = char;

  //#endregion
  //#endregion
}

function renderEntityBox(
  metadata: EntityMetadata,
  showColumns: boolean,
  showColumnTypes: boolean,
): string {
  //#region @backendFunc
  //#region @esmRemove
  const stringWidth = require('string-width');
  const rows: string[] = [];

  if (showColumns) {
    for (const column of metadata.columns) {
      const flags: string[] = [];

      if (column.isPrimary) {
        flags.push('PK');
      }

      if (column.relationMetadata) {
        flags.push('FK');
      }

      if (column.isNullable) {
        flags.push('?');
      }

      let row = column.databaseName;

      if (showColumnTypes) {
        row += `  ${normalizeColumnType(column.type)}`;
      }

      if (flags.length > 0) {
        row += `  ${flags.join(' ')}`;
      }

      rows.push(row);
    }
  }

  const contents = [metadata.tableName, ...rows];

  const width = Math.max(...contents.map(line => stringWidth(line))) + 2;

  const top = '┌' + '─'.repeat(width) + '┐';

  const separator = '├' + '─'.repeat(width) + '┤';

  const bottom = '└' + '─'.repeat(width) + '┘';

  const output: string[] = [top, `│ ${pad(metadata.tableName, width - 1)}│`];

  if (rows.length > 0) {
    output.push(separator);

    for (const row of rows) {
      output.push(`│ ${pad(row, width - 1)}│`);
    }
  }

  output.push(bottom);

  return output.join('\n');
  //#endregion
  return void 0 as any;
  //#endregion
}

function renderRelation(relationName: string, targetTable: string): string {
  //#region @backendFunc
  //#region @esmRemove
  const result = ['        │'];

  if (relationName) {
    result.push(`        │ ${relationName}`);
  }

  result.push('        ▼', `        ${targetTable}`);

  return result.join('\n');
  //#endregion
  return void 0 as any;
  //#endregion
}

function pad(value: string, width: number): string {
  //#region @backendFunc
  //#region @esmRemove
  const stringWidth = require('string-width');
  const missing = width - stringWidth(value);

  return value + ' '.repeat(Math.max(0, missing));
  //#endregion
  return void 0 as any;
  //#endregion
}
