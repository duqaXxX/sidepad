import Files from '../files';
import type Host from '../host';
import Images from '../images';
import Limits from '../limits';
import MarkdownBlocks from '../markdown-blocks';
import Paths from '../paths';
import { readLineCount } from './read-line-count';

/**
 * A PNG's pixel size, read from the header of its own bytes. `$.fs.read` has no way to read a head,
 * so the whole file crosses `$` for the 32 bytes the header takes; the picture itself is never read
 * by the plugin, since an `Image` draws it from its path.
 *
 * @returns the size, or null when the file is not a readable PNG
 */
async function imageSizeOf(host: Host.Host, path: string): Promise<{ width: number; height: number } | null> {
  const base64 = await host.readBytes(path).catch(() => null);

  return base64 === null ? null : Images.pngSizeOf(base64);
}

/**
 * The PNGs a Markdown file's own paragraphs name, resolved against the directory holding it and
 * sized from their headers, by the target as the source writes it.
 *
 * LIMIT: a page sizes its pictures until the next one would take it past IMAGE_BYTES_BUDGET, skips
 * that one and keeps trying the rest, so a picture too large for the room left draws as text while a
 * smaller one after it still draws: sizing one costs a read of the whole file.
 *
 * LIMIT: a picture is sized when the page holding it is read, so one replaced on disk while its page
 * stays open keeps the size and the pixels it had until that page is read again.
 *
 * @returns the pictures found, empty when the file names none the pane can draw
 */
async function pageImagesOf(
  host: Host.Host,
  path: string,
  lines: readonly string[],
): Promise<Record<string, Files.PageImage>> {
  const directory = Paths.parentOf(path);
  const found: Record<string, Files.PageImage> = {};
  let spent = 0;

  for (const target of MarkdownBlocks.imageTargetsOf(lines)) {
    const resolved = Paths.resolvedPathOf(directory, target);

    if (resolved === null || Images.imageKindOf(resolved) !== 'png') {
      continue;
    }

    const stat = await host.stat(resolved).catch(() => null);

    if (stat === null || !Files.shouldRead(stat) || spent + stat.size > Limits.IMAGE_BYTES_BUDGET) {
      continue;
    }

    spent += stat.size;

    const size = await imageSizeOf(host, resolved);

    if (size !== null) {
      found[target] = { path: resolved, ...size, generation: Files.generationOf(stat.mtimeMs) };
    }
  }

  return found;
}

/**
 * A file read for the page: its stat, then its text when it is a regular file within the engine's
 * read cap. A PNG is sized from its header instead, and a Markdown file's own pictures are sized
 * with it. A file past the cap is opened windowed, its lines counted on the host; where that count
 * cannot be had (no such command), the page shows the too-large note instead. A failed stat or read
 * becomes the page's note, never a throw.
 *
 * @returns the loaded file
 */
export async function loadFile(host: Host.Host, path: string): Promise<Files.LoadedFile> {
  const stat = await host.stat(path).catch(() => null);

  if (Files.fileKindOf(path) === 'image') {
    return Files.imageFileOf(path, stat, Files.shouldRead(stat) ? await imageSizeOf(host, path) : null);
  }

  if (stat !== null && stat.kind === 'file' && stat.size > Limits.READ_MAX_BYTES) {
    const total = await readLineCount(host, path);

    return total === null ? Files.loadedFileOf(path, stat, null) : Files.windowedFileOf(path, stat, total);
  }

  const text = Files.shouldRead(stat) ? await host.read(path).catch(() => null) : null;
  const isPage = text !== null && Files.fileKindOf(path) === 'markdown' && !Files.isBinaryText(text);

  return Files.loadedFileOf(path, stat, text, isPage ? await pageImagesOf(host, path, text.split('\n')) : undefined);
}
