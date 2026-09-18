/**
 * The synthetic session directory every test runs in. Not under `/home`: on macOS that is an autofs
 * mount, and the engine refuses a network location on the host before any `fs.*` hook answers.
 */
export const CWD = '/srv/dev/project';
