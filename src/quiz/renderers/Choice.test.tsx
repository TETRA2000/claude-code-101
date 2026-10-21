import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ChoiceItem, PredictItem } from '../../content/types';
import { LangProvider } from '../../i18n/LangContext';
import { fixtureParts } from '../../test/fixtures';
import { freshAnswer } from '../grade';
import type { AnswerState } from '../types';
import { Choice } from './Choice';

const items = fixtureParts.bodies.demo!.items;
const predict = items.find((i) => i.type === 'predict') as PredictItem;
const combo = items.find((i) => i.type === 'combo') as ChoiceItem;
const setup = items.find((i) => i.type === 'setup') as ChoiceItem;
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
});
