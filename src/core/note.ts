import { z } from 'zod';

/**
 * BlockNote blocks are stored opaquely — the editor owns their shape.
 * We validate just enough structure to catch corrupted files.
 */
export const blockSchema = z
  .object({
    id: z.string(),
    type: z.string(),
  })
  .passthrough();

export const noteFileSchema = z
  .object({
    version: z.literal(1),
    id: z.string(),
    title: z.string(),
    icon: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
    blocks: z.array(blockSchema),
  })
  .passthrough();

export type NoteFile = z.infer<typeof noteFileSchema>;

export const NOTE_EXTENSION = '.noat.json';

export function createEmptyNote(title: string): NoteFile {
  const now = new Date().toISOString();
  return {
    version: 1,
    // Global crypto: works in Node 20+ and browsers, keeping this module isomorphic.
    id: crypto.randomUUID(),
    title,
    createdAt: now,
    updatedAt: now,
    blocks: [],
  };
}

export function serializeNote(note: NoteFile): string {
  return `${JSON.stringify(note, null, 2)}\n`;
}

export function parseNote(raw: string): NoteFile {
  return noteFileSchema.parse(JSON.parse(raw));
}

/** Recursively sort object keys so formatting-only reorders compare equal. */
function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value as Record<string, unknown>)
        .sort()
        .map((key) => [key, canonicalize((value as Record<string, unknown>)[key])])
    );
  }
  return value;
}

/**
 * Whether two raw note strings encode the same JSON value, ignoring formatting
 * differences (whitespace, indentation, trailing newline, object key order).
 *
 * The custom editor autosaves through VS Code, so save participants such as
 * `editor.formatOnSave` or `files.insertFinalNewline` can rewrite the on-disk
 * bytes without changing the note's content. Treating those reformats as real
 * external edits remounts the webview and drops the caret mid-typing, so the
 * host uses this to tell a cosmetic reformat apart from a genuine change.
 *
 * Returns false if either side is not parseable JSON, so genuinely corrupt or
 * unexpected content is still surfaced to the webview.
 */
export function sameNoteJson(a: string, b: string): boolean {
  try {
    return (
      JSON.stringify(canonicalize(JSON.parse(a))) === JSON.stringify(canonicalize(JSON.parse(b)))
    );
  } catch {
    return false;
  }
}

/** Turn a note title into a safe filename (without extension). */
export function titleToFileName(title: string): string {
  const cleaned = title
    .trim()
    .replace(/[/\\:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 80)
    .trim();
  return cleaned.length > 0 ? cleaned : 'Untitled';
}
