import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ChoiceItem, PredictItem } from '../../content/types';
import { LangProvider } from '../../i18n/LangContext';
import { fixtureParts, wave2Items } from '../../test/fixtures';
import { freshAnswer } from '../grade';
import type { AnswerState } from '../types';
import { Choice } from './Choice';

const items = fixtureParts.bodies.demo!.items;
const predict = items.find((i) => i.type === 'predict') as PredictItem;
const combo = items.find((i) => i.type === 'combo') as ChoiceItem;
const setup = items.find((i) => i.type === 'setup') as ChoiceItem;
const scopes = wave2Items.find((i) => i.type === 'scopes') as ChoiceItem;
const draw = (item: PredictItem | ChoiceItem, answer: Partial<AnswerState> = {}) => {
  const act = vi.fn();
  render(
    <LangProvider lang="en">
      <Choice item={item} answer={{ ...freshAnswer(item), ...answer }} act={act} />
    </LangProvider>,
  );
  return act;
};

describe('Choice', () => {
  it('renders all options, marks the selected one, and selects on click', () => {
    const act = draw(predict, { sel: 1 });
    const btns = screen.getAllByRole('button');
    expect(btns).toHaveLength(3);
    expect(btns.map((b) => b.getAttribute('aria-pressed'))).toEqual(['false', 'true', 'false']);
    fireEvent.click(btns[2]!);
    expect(act).toHaveBeenCalledWith({ type: 'select', sel: 2 });
  });

  it('shows the situation and code', () => {
    draw(predict);
    expect(screen.getByText('The folder has README.md and .env.')).toBeInTheDocument();
    expect(screen.getByText('ls')).toBeInTheDocument();
  });

  it('shows combo ingredients as three labeled tiles', () => {
    draw(combo);
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('Private data')).toBeInTheDocument();
    expect(screen.getByText('Opening any URL')).toBeInTheDocument();
  });

  it('shows a setup scenario with no tiles', () => {
    draw(setup);
    expect(screen.getByText('You are new to Claude Code.')).toBeInTheDocument();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('disables options after Check', () => {
    draw(setup, { sel: 0, checked: true });
    screen.getAllByRole('button').forEach((b) => expect(b).toBeDisabled());
  });
  it('captions setup/combo items that have a surface with the app they show', () => {
    draw(setup);
    expect(screen.getByText('In the desktop app')).toBeInTheDocument();
  });

  it('shows no app caption without a surface', () => {
    draw(combo);
    expect(screen.queryByText('In the desktop app')).toBeNull();
    expect(screen.queryByText('In the terminal')).toBeNull();
  });

  it('captions in Japanese', () => {
    render(
      <LangProvider lang="ja">
        <Choice item={{ ...setup, surface: 'terminal' }} answer={freshAnswer(setup)} act={vi.fn()} />
      </LangProvider>,
    );
    expect(screen.getByText('ターミナルの場合')).toBeInTheDocument();
  });

  it('draws a panel as a mono frame titled panel.title, above the options', () => {
    draw(scopes);
    const panel = screen.getByRole('group', { name: '.mcp.json' });
    expect(panel).toHaveAttribute('data-panel');
    for (const line of scopes.panel!.lines) expect(within(panel).getByText(line, { normalizer: (s) => s })).toBeInTheDocument();
    const first = screen.getAllByRole('button')[0]!;
    expect(panel.compareDocumentPosition(first) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(panel).queryAllByRole('button')).toHaveLength(0);
  });

  it('draws no panel when the item has none', () => {
    draw(setup);
    expect(document.querySelector('[data-panel]')).toBeNull();
  });

  it.each(['scopes', 'package', 'inside', 'allowlist'] as const)('renders a %s item with its options', (type) => {
    const it = wave2Items.find((i) => i.type === type) as ChoiceItem;
    draw(it);
    expect(screen.getAllByRole('button')).toHaveLength(it.opts.length);
    expect(screen.getByText(it.scenario.en)).toBeInTheDocument();
  });
});
