/** One thing on a command bar row: the selection's label, a hint word, or a command Button. */
export type BarItem =
  | { kind: 'label'; text: string }
  | { kind: 'hint'; text: string }
  | { kind: 'button'; id: string; label: string };
