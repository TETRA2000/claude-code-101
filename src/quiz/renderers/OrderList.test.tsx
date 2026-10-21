import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { OrderItem } from '../../content/types';
import { LangProvider } from '../../i18n/LangContext';
import { fixtureParts } from '../../test/fixtures';
import { freshAnswer } from '../grade';
import { OrderList } from './OrderList';

const item = fixtureParts.bodies.demo!.items.find((i) => i.type === 'order') as OrderItem;
const draw = (checked = false) => {
  const act = vi.fn();
  render(
    <LangProvider lang="en">
      <OrderList item={item} answer={{ ...freshAnswer(item), checked }} act={act} />
    </LangProvider>,
  );
  return act;
};

describe('OrderList', () => {
  it('lists steps in the start order', () => {
    draw();
    expect(screen.getAllByRole('listitem').map((l) => l.textContent)).toEqual([
      expect.stringContaining('The result goes into context'),
      expect.stringContaining('You ask'),
      expect.stringContaining('Claude picks a tool'),
    ]);
  });

  it('moves up and down', () => {
    const act = draw();
    fireEvent.click(screen.getByRole('button', { name: 'Move up: You ask' }));
    fireEvent.click(screen.getByRole('button', { name: 'Move down: You ask' }));
    expect(act).toHaveBeenNthCalledWith(1, { type: 'move', from: 1, to: 0 });
    expect(act).toHaveBeenNthCalledWith(2, { type: 'move', from: 1, to: 2 });
  });

  it('disables up on the first row and down on the last', () => {
    draw();
    expect(screen.getByRole('button', { name: 'Move up: The result goes into context' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move down: Claude picks a tool' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move down: The result goes into context' })).toBeEnabled();
  });

  it('disables everything after Check', () => {
    draw(true);
    screen.getAllByRole('button').forEach((b) => expect(b).toBeDisabled());
  });
});
