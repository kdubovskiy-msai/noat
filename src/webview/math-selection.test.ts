// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { mathFromSelection } from './MathToolbarButton';

describe('mathFromSelection', () => {
  it('strips the delimiters off an inline formula', () => {
    expect(mathFromSelection('$h=0$', 'the velocity at $h=0$:')).toEqual({
      display: false,
      latex: 'h=0',
    });
  });

  it('takes the selection as-is when it carries no delimiters', () => {
    expect(mathFromSelection('\\gamma_x(h)', 'bare \\gamma_x(h) here')).toEqual({
      display: false,
      latex: '\\gamma_x(h)',
    });
  });

  it('converts the block when $$...$$ is the whole of it', () => {
    const latex = '\\frac{d}{dh}\\Big|_{h=0}\\gamma_x(h)';
    expect(mathFromSelection(`$$${latex}$$`, `$$${latex}$$`)).toEqual({ display: true, latex });
  });

  it('keeps $$...$$ inline when it is only part of the block', () => {
    // Converting the block here would take "before" and "after" with it.
    expect(mathFromSelection('$$x^2$$', 'before $$x^2$$ after')).toEqual({
      display: false,
      latex: 'x^2',
    });
  });

  it('handles a multi-line display formula', () => {
    const latex = '\\begin{aligned} x &= 1 \\\\ y &= 2 \\end{aligned}';
    const block = `  $$${latex}$$\n`;
    expect(mathFromSelection(block, block)).toEqual({ display: true, latex });
  });

  it('does nothing for an empty selection', () => {
    expect(mathFromSelection('   ', 'anything')).toBeUndefined();
  });
});
