import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LangProvider } from '../i18n/LangContext';
import type { Lang } from '../i18n/lang';
import { UI } from '../i18n/ui';
import { fixtureParts } from '../test/fixtures';
import { FeedbackSheet } from './FeedbackSheet';
import { freshAnswer } from './grade';
import type { AnswerState } from './types';

const items = fixtureParts.bodies.demo!.items;
const approve = items.find((i) => i.type === 'approve')!;
const wrap = (ui: ReactNode, lang: Lang = 'en') => render(<LangProvider lang={lang}>{ui}</LangProvider>);
const answer = (patch: Partial<AnswerState>): AnswerState => ({ ...freshAnswer(approve), checked: true, ...patch });

afterEach(() => vi.useRealTimers());

describe('FeedbackSheet', () => {
  it('renders a localized Feedback region', () => {
    wrap(<FeedbackSheet item={approve} answer={answer({ sel: 0, ok: true })} index={0} guardMs={0} onContinue={vi.fn()} />);
    expect(screen.getByRole('region', { name: 'Feedback' })).toBeInTheDocument();
  });

  it('localizes the region name and Continue', () => {
    wrap(<FeedbackSheet item={approve} answer={answer({ sel: 0, ok: true })} index={0} guardMs={0} onContinue={vi.fn()} />, 'ja');
    expect(screen.getByRole('region', { name: UI.ja.feedback })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: UI.ja.continue })).toBeInTheDocument();
  });

  it('ignores Continue clicks during the guard', () => {
    vi.useFakeTimers();
    const onContinue = vi.fn();
    wrap(<FeedbackSheet item={approve} answer={answer({ sel: 0, ok: true })} index={0} guardMs={350} onContinue={onContinue} />);
    const btn = screen.getByRole('button', { name: 'Continue' });
    fireEvent.click(btn);
    expect(onContinue).not.toHaveBeenCalled();
    act(() => {
      vi.advanceTimersByTime(350);
    });
    fireEvent.click(btn);
    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it('shows the X icon and title text for a wrong answer', () => {
    const { container } = wrap(
      <FeedbackSheet item={approve} answer={answer({ sel: 2, ok: false })} index={0} guardMs={0} onContinue={vi.fn()} />,
    );
    expect(screen.getByRole('heading', { name: UI.en.notQuite })).toBeInTheDocument();
    expect(container.querySelector('[data-icon="x"]')).not.toBeNull();
  });

  it('shows a Breaking badge above the headline for dangerous answers', () => {
    const danger = {
      ...approve,
      outcomes: { ...(approve as { outcomes: object }).outcomes, yes: { feedback: { en: 'Bad.', ja: '悪い。' }, headline: { en: 'Posts your .env', ja: '.env を送信' } } },
    } as typeof approve;
    wrap(<FeedbackSheet item={danger} answer={answer({ sel: 0, ok: false })} index={0} guardMs={0} onContinue={vi.fn()} />);
    expect(screen.getByText(UI.en.breaking)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Posts your .env' })).toBeInTheDocument();
  });
});
