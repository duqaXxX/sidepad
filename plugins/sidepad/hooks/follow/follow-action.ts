/** What the pane does when the main loop's turn ends. */
export type FollowAction =
  | { kind: 'stay' }
  | { kind: 'mark' }
  | { kind: 'open'; path: string; line: number }
  | { kind: 'follow'; path: string; line: number };
