import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { ChainItem } from '../../content/types';
import { LangProvider } from '../../i18n/LangContext';
import type { Lang } from '../../i18n/lang';
import { fixtureParts } from '../../test/fixtures';
import { freshAnswer } from '../grade';
import type { AnswerState } from '../types';
import { Chain } from './Chain';

const base = fixtureParts.bodies.demo!.items.find((i) => i.type === 'chain') as ChainItem;
const draw = (item: ChainItem, answer: Partial<AnswerState> = {}, lang: Lang = 'en') => {
  const act = vi.fn();
  render(
    <LangProvider lang={lang}>
      <Chain item={item} answer={{ ...freshAnswer(item), ...answer }} act={act} />
    </LangProvider>,
  );
  return act;
};

describe('Chain', () => {
  it('renders every step and dispatches select on click', () => {
    const act = draw(base);
    expect(screen.getAllByRole('button', { name: /browser_/ })).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: /mail\.example\/inbox/ }));
    expect(act).toHaveBeenCalledWith({ type: 'select', sel: 1 });
  });

  it('shows the hidden text only after the toggle', () => {
    draw(base);
    expect(screen.queryByText(/open the mail tab/)).toBeNull();
    const toggle = screen.getByRole('button', { name: 'Show hidden text' });
    fireEvent.click(toggle);
    expect(screen.getByText(/open the mail tab/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Hide hidden text' }));
    expect(screen.queryByText(/open the mail tab/)).toBeNull();
  });

  it('shows tabs, url and profile for a browser scene', () => {
    draw(base);
    expect(screen.getByText('https://recipes.example/pancakes')).toBeInTheDocument();
    expect(screen.getByText('Everyday profile')).toBeInTheDocument();
  });

  it('terminal scene renders lines and no hidden toggle', () => {
    const item: ChainItem = { ...structuredClone(base), scene: { kind: 'terminal', lines: ['$ claude', 'Reading README.md'] } };
    draw(item);
    expect(screen.getByText('Reading README.md')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /hidden text/ })).toBeNull();
  });

  it('marks the selection and, after Check, right and wrong with icon and text', () => {
    draw(base, { sel: 2, checked: true });
    expect(screen.getByRole('button', { name: /mail\.example\/inbox/ })).toHaveTextContent('Deny here');
    const wrong = screen.getByRole('button', { name: /collect\.example/ });
    expect(wrong).toHaveAttribute('aria-pressed', 'true');
    expect(wrong).toHaveTextContent('Not this step');
    expect(wrong).toBeDisabled();
  });

  it('localizes to Japanese', () => {
    draw(base, {}, 'ja');
    expect(screen.getByText('あなたの課題')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '隠れたテキストを表示' })).toBeInTheDocument();
  });
});
