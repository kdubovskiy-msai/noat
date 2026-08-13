import { describe, expect, it } from 'vitest';
import { createEmptyNote, parseNote, sameNoteJson, serializeNote } from './note';

describe('parseNote', () => {
  it('preserves unknown top-level fields across a round-trip', () => {
    const raw = JSON.stringify({ ...createEmptyNote('Note'), futureField: 'kept' });
    const note = parseNote(raw);
    expect(serializeNote(note)).toContain('"futureField": "kept"');
  });

  it('rejects a corrupted envelope', () => {
    expect(() => parseNote('{"version":1}')).toThrow();
  });
});

describe('sameNoteJson', () => {
  const note = serializeNote(createEmptyNote('Note'));

  it('ignores a stripped or added trailing newline (format-on-save)', () => {
    expect(sameNoteJson(note, note.trimEnd())).toBe(true);
  });

  it('ignores whitespace and indentation reflows', () => {
    const compact = JSON.stringify(JSON.parse(note));
    expect(sameNoteJson(note, compact)).toBe(true);
  });

  it('ignores object key reordering', () => {
    const parsed = JSON.parse(note);
    const reordered = JSON.stringify({ blocks: parsed.blocks, ...parsed });
    expect(sameNoteJson(note, reordered)).toBe(true);
  });

  it('detects a genuine content change', () => {
    const edited = serializeNote({ ...createEmptyNote('Note'), title: 'Changed' });
    expect(sameNoteJson(note, edited)).toBe(false);
  });

  it('returns false when either side is not valid JSON', () => {
    expect(sameNoteJson(note, 'not json')).toBe(false);
  });
});
