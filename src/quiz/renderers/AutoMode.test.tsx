import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { AutoModeItem } from '../../content/types';
import { LangProvider } from '../../i18n/LangContext';
import { UI } from '../../i18n/ui';
import { fixtureParts } from '../../test/fixtures';
import { freshAnswer } from '../grade';
import type { AnswerState } from '../types';
import { AutoMode } from './AutoMode';

const item = fixtureParts.bodies.demo!.items.find((i) => i.type === 'automode') as AutoModeItem;
const draw = (answer: Partial<AnswerState> = {}, lang: 'en' | 'ja' = 'en') => {
  const act = vi.fn();
  render(
    <LangProvider lang={lang}>
      <AutoMode item={item} answer={{ ...freshAnswer(item), ...answer }} act={act} />
    </LangProvider>,
  );
  return act;
};

describe('AutoMode', () => {
  it('shows the request, the action and the setup list', () => {
    draw();
    expect(screen.getByText('Push my changes.')).toBeInTheDocument();
    expect(screen.getByText('git push origin feature-x')).toBeInTheDocument();
    const list = screen.getByRole('list');
    expect(list).toHaveTextContent('Auto mode is on.');
    expect(list).toHaveTextContent('The branch belongs to this repo.');
  });

  it('has three aria-pressed options that dispatch select by AUTO_OUTCOMES index', () => {
    const act = draw({ sel: 1 });
    const en = UI.en;
    expect(screen.getByRole('button', { name: en.autoBlocked })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: en.autoRuns })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: en.autoAsks }));
    expect(act).toHaveBeenCalledWith({ type: 'select', sel: 2 });
    fireEvent.click(screen.getByRole('button', { name: en.autoRuns }));
    expect(act).toHaveBeenCalledWith({ type: 'select', sel: 0 });
  });

  it('labels are localized', () => {
    draw({}, 'ja');
    expect(screen.getByRole('button', { name: UI.ja.autoBlocked })).toBeInTheDocument();
  });

  it('disables the options once checked', () => {
    draw({ sel: 0, checked: true });
    expect(screen.getByRole('button', { name: UI.en.autoRuns })).toBeDisabled();
  });
});
