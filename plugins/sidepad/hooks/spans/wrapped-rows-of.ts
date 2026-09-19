import type { Span } from './span';

/** One drawn row: the spans on it, already fitted to the width. */
export type Row = { spans: readonly Span[] };

// LIMIT: width is counted in code points; a full-width or emoji character counts as one
// cell, so a row holding one comes out a cell short.

/**
 * Wraps a flat span list to `columns` cells wide, returning one `Row` per drawn line.
 * `indent.first` pads the first row; `indent.rest` pads every later row.
 * Hard-break spans (text `'\n'`) end the row even when the row is empty.
 * Trailing spaces are stripped from each row; spaces that land at the start of a new
 * row after wrapping are also discarded.
 * When `columns - indent.rest` would be zero or negative, each row receives at most one
 * code point, guaranteeing progress.
 */
export function wrappedRowsOf(spans: readonly Span[], columns: number, indent: { first: number; rest: number }): Row[] {
  const rows: Row[] = [];
  let currentSpans: Span[] = [];
  let currentWidth = 0; // code points placed on the current row, not counting indent
  let rowCount = 0; // rows committed so far (0 = we are on the first row)

  // Always leave at least one code point of room so a row always makes progress.
  function roomNow(): number {
    const ind = rowCount === 0 ? indent.first : indent.rest;
    return Math.max(1, columns - ind);
  }

  function commitRow(isHardBreak: boolean): void {
    // Drop trailing spaces span by span from the right.
    while (currentSpans.length > 0) {
      const last = currentSpans[currentSpans.length - 1]!;
      const trimmed = last.text.trimEnd();
      if (trimmed.length === 0) {
        currentSpans.pop();
      } else if (trimmed.length < last.text.length) {
        currentSpans[currentSpans.length - 1] = { ...last, text: trimmed };
        break;
      } else {
        break;
      }
    }
    // A hard break always emits a row; a soft wrap emits only when there is content.
    if (isHardBreak || currentSpans.length > 0) {
      rows.push({ spans: currentSpans });
      rowCount++;
    }
    currentSpans = [];
    currentWidth = 0;
  }

  function addFragment(text: string, template: Span): void {
    if (!text) return;
    // Spread the original span and replace only the text, so every attribute survives.
    currentSpans.push({ ...template, text });
    currentWidth += [...text].length;
  }

  function processText(text: string, template: Span): void {
    const chars = [...text]; // iterate by code point
    let pos = 0;

    while (pos < chars.length) {
      const room = roomNow();

      if (chars[pos] === ' ') {
        // Find the end of this space run.
        let end = pos;
        while (end < chars.length && chars[end] === ' ') end++;
        const count = end - pos;

        if (currentWidth === 0) {
          // Skip spaces at the start of a row; they are trailing from the previous row.
          pos = end;
        } else if (currentWidth + count <= room) {
          addFragment(chars.slice(pos, end).join(''), template);
          pos = end;
        } else {
          // Spaces overflow: end the row here and discard the spaces.
          commitRow(false);
          pos = end;
        }
      } else {
        // Find the end of this non-space run (a word).
        let end = pos;
        while (end < chars.length && chars[end] !== ' ') end++;
        const wordChars = chars.slice(pos, end);
        const wordWidth = wordChars.length;
        const remaining = room - currentWidth;

        if (wordWidth <= remaining) {
          // The whole word fits on the current row.
          addFragment(wordChars.join(''), template);
          pos = end;
        } else if (currentWidth === 0) {
          // The word exceeds a fresh row: cut it at the room boundary.
          // room >= 1 (guaranteed by roomNow), so at least one code point is placed.
          addFragment(wordChars.slice(0, room).join(''), template);
          pos += room;
          commitRow(false);
        } else {
          // The word does not fit but the row has prior content: wrap and retry.
          commitRow(false);
          // pos is unchanged; the word is retried on the new row.
        }
      }
    }
  }

  for (const span of spans) {
    if (span.text === '\n') {
      commitRow(true);
    } else {
      processText(span.text, span);
    }
  }

  // Commit any remaining content as the final row.
  if (currentSpans.length > 0) {
    commitRow(false);
  }

  return rows;
}
