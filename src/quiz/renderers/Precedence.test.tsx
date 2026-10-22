import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { PrecedenceItem } from '../../content/types';
import { LangProvider } from '../../i18n/LangContext';
import { fixtureParts } from '../../test/fixtures';
import { freshAnswer } from '../grade';
import type { AnswerState } from '../types';
import { Precedence } from './Precedence';

const item = fixtureParts.bodies.demo!.items.find((i) => i.type === 'precedence') as PrecedenceItem;
const draw = (answer: Partial<AnswerState> = {}) => {
  const act = vi.fn();
  render(
    <LangProvider lang="en">
      <Precedence item={item} answer={{ ...freshAnswer(item), ...answer }} act={act} />
    </LangProvider>,
  );
  return act;
};

describe('Precedence', () => {
  it('shows the question and each file with its scope label and path', () => {
    draw();
    expect(screen.getByText('What mode does Claude start in?')).toBeInTheDocument();
    expect(screen.getByRole('group', { name: /~\/\.claude\/settings\.json/ })).toHaveTextContent('"defaultMode": "default"');
    expect(screen.getByRole('group', { name: /^\.claude\/settings\.json/ })).toHaveTextContent('"defaultMode": "plan"');
    expect(screen.getByText('User')).toBeInTheDocument();
  });

  it('options are aria-pressed buttons that dispatch select', () => {
    const act = draw({ sel: 1 });
    const opts = screen.getByTestId('precedence-options');
    expect(within(opts).getByRole('button', { name: 'plan' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(within(opts).getByRole('button', { name: 'default' }));
    expect(act).toHaveBeenCalledWith({ type: 'select', sel: 0 });
  });
});
