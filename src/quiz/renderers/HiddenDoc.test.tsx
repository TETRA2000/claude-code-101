import { readFileSync } from 'node:fs';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { HiddenItem } from '../../content/types';
import { LangProvider } from '../../i18n/LangContext';
import type { Lang } from '../../i18n/lang';
import { fixtureParts } from '../../test/fixtures';
import { freshAnswer } from '../grade';
import type { AnswerState } from '../types';
import { HiddenDoc } from './HiddenDoc';

const base = structuredClone(fixtureParts.bodies.demo!.items.find((i) => i.type === 'hidden') as HiddenItem);
base.lines[2]!.raw = { before: '<span style="color:white">', after: '</span>' };
const draw = (item: HiddenItem, answer: Partial<AnswerState> = {}, lang: Lang = 'en') => {
  const act = vi.fn();
  const ui = (a: Partial<AnswerState>) => (
    <LangProvider lang={lang}>
      <HiddenDoc item={item} answer={{ ...freshAnswer(item), ...a }} act={act} />
    </LangProvider>
  );
  const r = render(ui(answer));
  return { act, rerender: (a: Partial<AnswerState>) => r.rerender(ui(a)) };
};
const hiddenLine = () => screen.getByRole('button', { name: /collect\.example|Line 3/ });

describe('HiddenDoc', () => {
  it('conceals a white/tiny line for real and for screen readers before Check', () => {
    draw(base);
    expect(screen.queryByRole('button', { name: /collect\.example/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Line 3 (looks blank)' })).toHaveAttribute('data-concealed', 'true');
    const css = readFileSync('src/quiz/renderers/HiddenDoc.module.css', 'utf8');
    expect(css).toMatch(/\.white\s*\{[^}]*color:\s*#fff/);
    expect(css).toMatch(/\.tiny\s*\{[^}]*font-size:\s*2px[^}]*color:\s*#fff|\.tiny\s*\{[^}]*color:\s*#fff[^}]*font-size:\s*2px/);
  });

  it('reveals the real name in the Claude view and after Check', () => {
    const { rerender } = draw(base);
    fireEvent.click(screen.getByRole('button', { name: 'As Claude sees it' }));
    expect(screen.getByRole('button', { name: /collect\.example/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'As you see it' }));
    rerender({ checked: true, picked: [2] });
    expect(screen.getByRole('button', { name: /collect\.example/ })).toBeInTheDocument();
  });

  it('never emits an "undefined" class (notes frame)', () => {
    const { container } = render(
      <LangProvider lang="en">
        <HiddenDoc item={{ ...base, source: 'notes' }} answer={freshAnswer(base)} act={vi.fn()} />
      </LangProvider>,
    );
    expect(container.innerHTML).not.toContain('undefined');
  });

  it('You view: a white line is concealed; Claude view shows the raw markup', () => {
    draw(base);
    expect(hiddenLine()).toHaveAttribute('data-concealed', 'true');
    expect(screen.queryByText(/color:white/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'As Claude sees it' }));
    expect(screen.getByText(/<span style="color:white">/)).toBeInTheDocument();
    expect(hiddenLine()).not.toHaveAttribute('data-concealed');
  });

  it('comment and alt lines are not drawn in the You view until checked', () => {
    const item = structuredClone(base);
    item.lines[2]!.hidden = 'comment';
    const { rerender } = draw(item);
    expect(screen.queryByText(/collect\.example/)).toBeNull();
    rerender({ checked: true, picked: [2], ok: true });
    expect(hiddenLine()).toBeInTheDocument();
  });

  it('toggling the view dispatches nothing and keeps the picks', () => {
    const { act } = draw(base, { picked: [2] });
    fireEvent.click(screen.getByRole('button', { name: 'As Claude sees it' }));
    fireEvent.click(screen.getByRole('button', { name: 'As you see it' }));
    expect(act).not.toHaveBeenCalled();
    expect(hiddenLine()).toHaveAttribute('aria-pressed', 'true');
  });

  it('clicking a line dispatches togglePick', () => {
    const { act } = draw(base);
    fireEvent.click(screen.getByRole('button', { name: /Mix flour/ }));
    expect(act).toHaveBeenCalledWith({ type: 'togglePick', line: 1 });
  });

  it('after Check marks the answer with icon and text, and a wrong pick too', () => {
    draw(base, { checked: true, picked: [1] });
    expect(hiddenLine()).toHaveTextContent('Hidden order');
    expect(screen.getByRole('button', { name: /Mix flour/ })).toHaveTextContent('Not an order');
    expect(hiddenLine()).toBeDisabled();
  });

  it.each(['notes', 'web', 'design', 'readme', 'issue', 'email'] as const)('renders the %s frame', (source) => {
    const { container } = render(
      <LangProvider lang="en">
        <HiddenDoc item={{ ...base, source }} answer={freshAnswer(base)} act={vi.fn()} />
      </LangProvider>,
    );
    expect(container.querySelector(`[data-source="${source}"]`)).not.toBeNull();
    expect(screen.getByText('Recipe blog')).toBeInTheDocument();
  });

  it('localizes to Japanese', () => {
    draw(base, {}, 'ja');
    expect(screen.getByRole('button', { name: 'Claude に見える姿' })).toBeInTheDocument();
  });
});
