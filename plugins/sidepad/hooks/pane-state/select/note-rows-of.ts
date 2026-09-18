/**
 * A dim note cut into rows of `columns` characters, so each row is drawn whole and the rows it takes
 * are known before the engine lays it out.
 *
 * @returns the rows, at least one
 */
export function noteRowsOf(note: string, columns: number): readonly string[] {
  const characters = [...note];
  const width = Math.max(1, columns);

  return Array.from({ length: Math.max(1, Math.ceil(characters.length / width)) }, (_, at) =>
    characters.slice(at * width, (at + 1) * width).join(''),
  );
}
