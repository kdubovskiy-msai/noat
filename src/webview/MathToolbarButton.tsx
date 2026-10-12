import { useBlockNoteEditor, useComponentsContext, useEditorState } from '@blocknote/react';
import type { NoteFile } from '../core/note';
import { blocksToPlainText } from '../core/note-text';
import type { NoatEditor, schema } from './schema';

const DISPLAY_PATTERN = /^\$\$([\s\S]+)\$\$$/;
const INLINE_PATTERN = /^\$([\s\S]+)\$$/;

/**
 * What the Math button should make of a selection: the LaTeX to use, and
 * whether it becomes a display equation or an inline formula. `$$…$$` covering
 * a whole block is display; anything else is inline, with one pair of `$`
 * stripped if the selection brought them along.
 */
export function mathFromSelection(
  selected: string,
  blockText: string
): { display: boolean; latex: string } | undefined {
  const text = selected.trim();
  if (text.length === 0) return undefined;
  const display = DISPLAY_PATTERN.exec(text)?.[1];
  // Take over the block only when the selection *is* the whole block --
  // otherwise `$$…$$` picked out of a sentence would take the sentence with it.
  if (display !== undefined && text === blockText.trim()) {
    return { display: true, latex: display.trim() };
  }
  return { display: false, latex: (display ?? INLINE_PATTERN.exec(text)?.[1] ?? text).trim() };
}

/**
 * Turns the current selection into math, so LaTeX pasted as plain text can be
 * rendered in place instead of retyped. Shared by the toolbar button and the
 * Mod+Shift+M shortcut.
 */
export function applySelectionMath(editor: NoatEditor): void {
  const block = editor.getTextCursorPosition().block;
  const math = mathFromSelection(
    editor.getSelectedText(),
    blocksToPlainText([block] as NoteFile['blocks'])
  );
  if (!math) return;
  if (math.display) {
    editor.updateBlock(block, { type: 'equation', props: { latex: math.latex } });
  } else {
    editor.insertInlineContent([{ type: 'math', props: { latex: math.latex } }]);
  }
  editor.focus();
}

export function MathToolbarButton() {
  const Components = useComponentsContext();
  const editor = useBlockNoteEditor<
    (typeof schema)['blockSchema'],
    (typeof schema)['inlineContentSchema'],
    (typeof schema)['styleSchema']
  >();
  const hasSelection = useEditorState({
    editor,
    selector: ({ editor }) => editor.isEditable && editor.getSelectedText().length > 0,
  });

  if (!Components || !hasSelection) return null;

  return (
    <Components.FormattingToolbar.Button
      className="bn-button"
      label="Math"
      mainTooltip="Render as math"
      icon={<span>{'∑'}</span>}
      onClick={() => applySelectionMath(editor)}
    />
  );
}
