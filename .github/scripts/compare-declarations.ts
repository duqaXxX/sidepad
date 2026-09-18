#!/usr/bin/env bun
/**
 * What moved between two sets of engine declarations: every type, every `$` noun and its members,
 * every event and element, added, removed or changed, named by its path.
 *
 * Both files are parsed with the TypeScript 6 compiler API. TypeScript 7, which type-checks this
 * repository, ships no API; its release notes name `@typescript/typescript6` for tools that need
 * one until 7.1. Comments are not compared as types: a changed JSDoc is listed on its own, because
 * the declarations document behaviour in them (a cap, one message per frame) that no type states.
 *
 *   bun .github/scripts/compare-declarations.ts <before.d.ts> <after.d.ts>
 */
import { readFileSync } from 'node:fs';
import ts from '@typescript/typescript6';
import { writtenByVersion } from './release-report';

/** A declaration or a member: its own text, and its members when it is an object type. */
export type Shape = { text: string; docs: string; members: Map<string, Shape> | null };

export type Change =
  | { kind: 'added' | 'removed'; path: string; text: string }
  | { kind: 'changed'; path: string; was: string; now: string }
  | { kind: 'docs'; path: string };

/** The module every name is read in when no other is named, left out of paths. */
const ENGINE_MODULE = 'claude-code';
const printer = ts.createPrinter({ removeComments: true });

/**
 * Every declaration in a .d.ts, keyed by module and name, as nested shapes.
 *
 * Declarations of one interface in several `declare module` blocks merge, as TypeScript merges them.
 */
export function shapesOf(source: string): Map<string, Shape> {
  const file = ts.createSourceFile('declarations.d.ts', source, ts.ScriptTarget.Latest, true);
  const shapes = new Map<string, Shape>();

  for (const statement of file.statements) {
    if (ts.isModuleDeclaration(statement) && ts.isStringLiteral(statement.name) && statement.body) {
      const module = statement.name.text;
      const prefix = module === ENGINE_MODULE ? '' : `${module} `;

      addStatements(shapes, statement.body, file, prefix);
    } else {
      addStatement(shapes, statement, file, '');
    }
  }

  return shapes;
}

function addStatements(shapes: Map<string, Shape>, body: ts.ModuleBody, file: ts.SourceFile, prefix: string) {
  if (!ts.isModuleBlock(body)) return;
  for (const statement of body.statements) addStatement(shapes, statement, file, prefix);
}

function addStatement(shapes: Map<string, Shape>, node: ts.Statement, file: ts.SourceFile, prefix: string) {
  // An import names what a block uses, not what it declares.
  if (ts.isImportDeclaration(node)) return;
  if (ts.isVariableStatement(node)) {
    for (const declaration of node.declarationList.declarations) {
      merge(shapes, prefix + declaration.name.getText(file), leaf(node, file));
    }
    return;
  }

  const name = (node as { name?: ts.Node }).name;
  const key = prefix + (name ? name.getText(file) : printed(node, file));

  if (ts.isInterfaceDeclaration(node)) {
    const members = membersOf(node.members, file);
    const heritage = node.heritageClauses?.map((clause) => printed(clause, file)).join(' ') ?? '';

    merge(shapes, key, {
      text: `interface ${name!.getText(file)}${typeParameters(node, file)} ${heritage}`.trim(),
      docs: docsOf(node, file),
      members,
    });
  } else if (ts.isTypeAliasDeclaration(node) && ts.isTypeLiteralNode(node.type)) {
    merge(shapes, key, {
      text: `type ${name!.getText(file)}${typeParameters(node, file)}`,
      docs: docsOf(node, file),
      members: membersOf(node.type.members, file),
    });
  } else if (ts.isModuleDeclaration(node) && node.body) {
    const inner = new Map<string, Shape>();

    addStatements(inner, node.body, file, '');
    merge(shapes, key, { text: `namespace ${name!.getText(file)}`, docs: docsOf(node, file), members: inner });
  } else {
    merge(shapes, key, leaf(node, file));
  }
}

function membersOf(elements: ts.NodeArray<ts.TypeElement>, file: ts.SourceFile): Map<string, Shape> {
  const members = new Map<string, Shape>();

  for (const element of elements) {
    const key = memberKey(element, file);

    if (ts.isPropertySignature(element) && element.type && ts.isTypeLiteralNode(element.type)) {
      const modifiers = element.modifiers?.map((modifier) => modifier.getText(file)).join(' ') ?? '';
      const optional = element.questionToken ? '?' : '';

      merge(members, key, {
        text: `${modifiers} ${key}${optional}`.trim(),
        docs: docsOf(element, file),
        members: membersOf(element.type.members, file),
      });
    } else {
      merge(members, key, leaf(element, file));
    }
  }

  return members;
}

/** A member's name; call, construct and index signatures, which have none, by their kind. */
function memberKey(element: ts.TypeElement, file: ts.SourceFile): string {
  if (ts.isCallSignatureDeclaration(element)) return '()';
  if (ts.isConstructSignatureDeclaration(element)) return 'new()';
  if (ts.isIndexSignatureDeclaration(element)) return `[${element.parameters.map((p) => printed(p, file)).join(', ')}]`;

  return element.name ? element.name.getText(file) : printed(element, file);
}

/** Overloads and merged declarations share a key: their texts and members add up. */
function merge(shapes: Map<string, Shape>, key: string, shape: Shape) {
  const existing = shapes.get(key);

  if (!existing) {
    shapes.set(key, shape);
  } else if (existing.members && shape.members) {
    for (const [name, member] of shape.members) merge(existing.members, name, member);
    existing.docs += shape.docs;
  } else {
    existing.text += `\n${shape.text}`;
    existing.docs += shape.docs;
  }
}

function leaf(node: ts.Node, file: ts.SourceFile): Shape {
  return { text: printed(node, file), docs: docsOf(node, file), members: null };
}

function typeParameters(node: ts.InterfaceDeclaration | ts.TypeAliasDeclaration, file: ts.SourceFile): string {
  return node.typeParameters ? `<${node.typeParameters.map((p) => printed(p, file)).join(', ')}>` : '';
}

/** The node as TypeScript prints it without comments, on one line: formatting never reads as a change. */
function printed(node: ts.Node, file: ts.SourceFile): string {
  return printer.printNode(ts.EmitHint.Unspecified, node, file).replace(/\s+/g, ' ').trim();
}

function docsOf(node: ts.Node, file: ts.SourceFile): string {
  return ts
    .getJSDocCommentsAndTags(node)
    .filter(ts.isJSDoc)
    .map((doc) => doc.getText(file).replace(/\s+/g, ' '))
    .join('\n');
}

/**
 * Every difference between two sets of shapes, in path order.
 *
 * An added or removed object type is one change, not one per member; a changed one is walked.
 */
export function compareShapes(before: Map<string, Shape>, after: Map<string, Shape>, parent = ''): Change[] {
  const keys = [...new Set([...before.keys(), ...after.keys()])].sort();
  const changes: Change[] = [];

  for (const key of keys) {
    const path = parent ? `${parent}.${key}` : key;
    const was = before.get(key);
    const now = after.get(key);

    if (!was) {
      changes.push({ kind: 'added', path, text: summary(now!) });
    } else if (!now) {
      changes.push({ kind: 'removed', path, text: summary(was) });
    } else if (was.members && now.members) {
      if (was.text !== now.text) changes.push({ kind: 'changed', path, was: was.text, now: now.text });
      else if (was.docs !== now.docs) changes.push({ kind: 'docs', path });
      changes.push(...compareShapes(was.members, now.members, path));
    } else if (summary(was) !== summary(now)) {
      changes.push({ kind: 'changed', path, was: summary(was), now: summary(now) });
    } else if (was.docs !== now.docs) {
      changes.push({ kind: 'docs', path });
    }
  }

  return changes;
}

function summary(shape: Shape): string {
  return shape.members ? `${shape.text} { ${shape.members.size} members }` : shape.text;
}

/** How much of the text around a change is kept, on each side. */
const CONTEXT = 40;
/** The longest text printed whole for an added or removed declaration. */
const WIDTH = 160;

/**
 * The part of two texts that differs, with some context: a changed signature is often long and
 * differs in one parameter.
 */
export function differingParts(was: string, now: string): [string, string] {
  let start = 0;
  while (start < was.length && start < now.length && was[start] === now[start]) start += 1;

  let end = 0;
  while (end < was.length - start && end < now.length - start && was.at(-1 - end) === now.at(-1 - end)) end += 1;

  const cut = (text: string) => {
    const from = Math.max(0, start - CONTEXT);
    const to = Math.min(text.length, text.length - end + CONTEXT);

    return `${from > 0 ? '…' : ''}${text.slice(from, to)}${to < text.length ? '…' : ''}`;
  };

  return [cut(was), cut(now)];
}

const shortened = (text: string) => (text.length > WIDTH ? `${text.slice(0, WIDTH)}…` : text);

/**
 * The report a person reads: added, removed, changed, then the paths whose documentation alone
 * changed.
 */
export function formatChanges(changes: Change[]): string {
  const lines: string[] = [];
  const section = (title: string, kind: Change['kind'], line: (change: Change) => string[]) => {
    const matching = changes.filter((change) => change.kind === kind);
    if (matching.length === 0) return;
    lines.push('', `${title} (${matching.length})`);
    for (const change of matching) lines.push(...line(change));
  };

  section('Added', 'added', (c) => [`  + ${c.path}`, `      ${shortened((c as { text: string }).text)}`]);
  section('Removed', 'removed', (c) => [`  - ${c.path}`, `      ${shortened((c as { text: string }).text)}`]);
  section('Changed', 'changed', (c) => {
    const { was, now } = c as { was: string; now: string };
    const [before, after] = differingParts(was, now);

    return [`  ~ ${c.path}`, `      was ${before}`, `      now ${after}`];
  });
  section('Documentation changed, types the same', 'docs', (c) => [`  ${c.path}`]);

  return lines.length === 0 ? 'No difference.' : lines.join('\n').trimStart();
}

/** Compares two declaration files and returns the report, headed by the versions that wrote them. */
export function compareDeclarations(beforeFile: string, afterFile: string): string {
  const changes = compareShapes(shapesOf(readFileSync(beforeFile, 'utf8')), shapesOf(readFileSync(afterFile, 'utf8')));

  return [
    `Declarations written by ${writtenByVersion(beforeFile)} and by ${writtenByVersion(afterFile)}`,
    '',
    formatChanges(changes),
  ].join('\n');
}

if (import.meta.main) {
  const [before, after] = process.argv.slice(2);

  if (!before || !after) {
    console.error('usage: compare-declarations.ts <before.d.ts> <after.d.ts>');
    process.exit(2);
  }
  console.log(compareDeclarations(before, after));
}
