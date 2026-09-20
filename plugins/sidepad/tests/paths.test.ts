import { describe, expect, test, tier } from 'claude-code/testing';

import Paths from '../hooks/paths';
import { CWD } from './fixtures';

tier('user');

describe('paths', () => {
  test('a path is named relative to the session directory, absolute outside it', () => {
    expect(Paths.shownPathOf(`${CWD}/docs/a.md`, CWD)).toBe('docs/a.md');
    expect(Paths.shownPathOf(CWD, CWD)).toBe('.');
    expect(Paths.shownPathOf('/etc/hosts', CWD)).toBe('/etc/hosts');
    expect(Paths.shownPathOf(`${CWD}-other/a.md`, CWD), 'a sibling sharing the prefix is outside').toBe(
      `${CWD}-other/a.md`,
    );
  });

  test('the parent of a path, and of a file at the root', () => {
    expect(Paths.parentOf(`${CWD}/docs/a.md`)).toBe(`${CWD}/docs`);
    expect(Paths.parentOf('/a.md')).toBe('/');
  });

  test('ancestors stop at the session directory inside it, at / outside it', () => {
    expect(Paths.ancestorsOf(`${CWD}/a/b/c.md`, CWD)).toEqual([`${CWD}/a/b`, `${CWD}/a`, CWD]);
    expect(Paths.ancestorsOf('/tmp/x/y.md', CWD)).toEqual(['/tmp/x', '/tmp', '/']);
  });

  test('the path pieces: . and each directory are links, the last piece is text', () => {
    const crumbs = Paths.crumbsOf(`${CWD}/a/c/file.txt`, CWD, 80);

    expect(crumbs.map((crumb) => `${crumb.kind}:${crumb.label}`)).toEqual([
      'link:.',
      'text:/',
      'link:a',
      'text:/',
      'link:c',
      'text:/',
      'text:file.txt',
    ]);
    expect(Paths.crumbsOf(CWD, CWD, 80)).toEqual([{ kind: 'text', label: '.' }]);
  });

  test('a path too long for its room drops leading pieces behind …/', () => {
    const crumbs = Paths.crumbsOf(`${CWD}/a/c/d/file.txt`, CWD, 12);

    expect(crumbs.map((crumb) => crumb.label).join('')).toBe('…/d/file.txt');
    expect(crumbs.find((crumb) => crumb.label === 'd')).toEqual({ kind: 'link', key: 'crumb:3', label: 'd' });
  });

  test('a path outside the session directory is one piece of text', () => {
    expect(Paths.crumbsOf('/etc/hosts', CWD, 80)).toEqual([{ kind: 'text', label: '/etc/hosts' }]);
  });

  test('a piece opens the directory at its depth; past the last directory it is the target', () => {
    const target = `${CWD}/a/c/file.txt`;

    expect(Paths.crumbPathOf(target, CWD, 0)).toBe(CWD);
    expect(Paths.crumbPathOf(target, CWD, 2)).toBe(`${CWD}/a/c`);
    expect(Paths.crumbPathOf(target, CWD, 3)).toBe(target);
    expect(Paths.crumbPathOf('/etc/hosts', CWD, 0)).toBeNull();
  });

  test('a target is resolved against the directory of the file that names it', () => {
    expect(Paths.resolvedPathOf(`${CWD}/docs`, './logo.png')).toBe(`${CWD}/docs/logo.png`);
    expect(Paths.resolvedPathOf(`${CWD}/docs`, 'img/logo.png')).toBe(`${CWD}/docs/img/logo.png`);
    expect(Paths.resolvedPathOf(`${CWD}/docs`, '../img/logo.png')).toBe(`${CWD}/img/logo.png`);
    expect(Paths.resolvedPathOf(`${CWD}/docs`, '/etc/logo.png')).toBe('/etc/logo.png');
    expect(Paths.resolvedPathOf(`${CWD}/docs`, 'https://example.test/logo.png'), 'a URL names no file').toBeNull();
    expect(Paths.resolvedPathOf(`${CWD}/docs`, '//example.test/logo.png')).toBeNull();
    expect(Paths.resolvedPathOf(`${CWD}/docs`, '')).toBeNull();
    expect(Paths.resolvedPathOf('/a', '../../up.png'), 'nothing climbs past the root').toBeNull();
  });

  test('a path ends on its own name', () => {
    expect(Paths.nameOf(`${CWD}/docs/logo.png`)).toBe('logo.png');
    expect(Paths.nameOf('/')).toBe('');
  });
});
