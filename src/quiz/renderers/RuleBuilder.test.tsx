import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { RuleItem } from '../../content/types';
import { LangProvider } from '../../i18n/LangContext';
import { fixtureParts } from '../../test/fixtures';
import { freshAnswer } from '../grade';
import type { AnswerState } from '../types';
import { RuleBuilder } from './RuleBuilder';

const item = fixtureParts.bodies.demo!.items.find((i) => i.type === 'rule') as RuleItem;
const draw = (answer: Partial<AnswerState> = {}) => {
  const act = vi.fn();
  render(
    <LangProvider lang="en">
      <RuleBuilder item={item} answer={{ ...freshAnswer(item), ...answer }} act={act} />
    </LangProvider>,
  );
  return act;
};

describe('RuleBuilder', () => {
  it('shows the goal and the rules already in settings', () => {
    draw();
    expect(screen.getByText('Stop curl, keep npm test working.')).toBeInTheDocument();
    expect(screen.getByText('Bash(npm test)')).toBeInTheDocument();
  });

  it('list and pattern buttons are pressable tiles that dispatch', () => {
    const act = draw({ list: 2, sel: 1 });
    const deny = screen.getByRole('button', { name: 'deny' });
    expect(deny).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'allow' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Bash(curl *)' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: 'ask' }));
    expect(act).toHaveBeenCalledWith({ type: 'selectList', list: 1 });
    fireEvent.click(screen.getByRole('button', { name: 'Bash(*)' }));
    expect(act).toHaveBeenCalledWith({ type: 'select', sel: 2 });
  });

  it('previews the assembled rule', () => {
    draw({ list: 2, sel: 1 });
    expect(screen.getByTestId('your-rule')).toHaveTextContent('deny Bash(curl *)');
  });

  it('disables every tile after Check', () => {
    draw({ list: 2, sel: 1, checked: true });
    screen.getAllByRole('button').forEach((b) => expect(b).toBeDisabled());
  });
});
