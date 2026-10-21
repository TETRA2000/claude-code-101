import { act as rtlAct, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DecodeItem, PairsItem } from '../../content/types';
import { LangProvider } from '../../i18n/LangContext';
import { PAIR_MISS_FLASH_MS } from '../../state/rules';
import { fixtureParts } from '../../test/fixtures';
import { freshAnswer } from '../grade';
import type { AnswerState } from '../types';
import { PairBoard } from './PairBoard';

const items = fixtureParts.bodies.demo!.items;
const pairs = items.find((i) => i.type === 'pairs') as PairsItem;
const decode = items.find((i) => i.type === 'decode') as DecodeItem;
const draw = (item: PairsItem | DecodeItem, answer: Partial<AnswerState> = {}) => {
  const act = vi.fn();
  render(
    <LangProvider lang="en">
      <PairBoard item={item} answer={{ ...freshAnswer(item), ...answer }} act={act} />
    </LangProvider>,
  );
  return act;
};

afterEach(() => vi.useRealTimers());

describe('PairBoard', () => {
  it('dispatches a pick on each side', () => {
    const act = draw(pairs);
    fireEvent.click(screen.getByRole('button', { name: '~/.ssh' }));
    fireEvent.click(screen.getByRole('button', { name: 'SSH keys' }));
    expect(act).toHaveBeenNthCalledWith(1, { type: 'pickPair', side: 'left', id: 'ssh' });
    expect(act).toHaveBeenNthCalledWith(2, { type: 'pickPair', side: 'right', id: 'ssh' });
  });

  it('shows right tiles in the item order, marks selected and matched', () => {
    draw(pairs, { left: 'ssh', matched: { env: true } });
    const right = screen.getAllByRole('button').slice(4).map((b) => b.getAttribute('aria-label'));
    expect(right).toEqual(['API keys, matched', 'Shell settings', 'SSH keys', 'Cloud logins']);
    expect(screen.getByRole('button', { name: '~/.ssh' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'API keys, matched' })).toBeDisabled();
  });

  it('clears a mismatch flash after PAIR_MISS_FLASH_MS', () => {
    vi.useFakeTimers();
    const act = draw(pairs, { miss: { left: 'ssh', right: 'aws' }, misses: 1 });
    expect(screen.getByRole('button', { name: '~/.ssh, not a match' })).toBeInTheDocument();
    rtlAct(() => vi.advanceTimersByTime(PAIR_MISS_FLASH_MS - 1));
    expect(act).not.toHaveBeenCalled();
    rtlAct(() => vi.advanceTimersByTime(1));
    expect(act).toHaveBeenCalledWith({ type: 'clearMiss' });
  });

  it('decode shows the command and code parts', () => {
    const act = draw(decode);
    expect(screen.getByText('rm -rf build')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '-rf' }));
    expect(act).toHaveBeenCalledWith({ type: 'pickPair', side: 'left', id: 'rf' });
  });
});
