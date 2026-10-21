import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { createContent } from '../content';
import type { UnitMeta } from '../content/types';
import { LangProvider } from '../i18n/LangContext';
import { initState } from '../state/app';
import { fixtureParts } from '../test/fixtures';
import { Home } from './Home';

const soon: UnitMeta = {
  key: 'later',
  status: 'soon',
  title: { en: 'Later unit', ja: '後のユニット' },
  blurb: { en: 'Not ready yet.', ja: 'まだです。' },
  chips: ['approve'],
};
const content = createContent([...fixtureParts.units, soon], fixtureParts.types, fixtureParts.bodies);

function setup(progress = initState({ lang: null, learned: {}, practiced: {}, xp: 0 }, ['en']).progress) {
  const dispatch = vi.fn();
  const state = { ...initState(progress, ['en']) };
  render(
    <LangProvider lang="en">
      <Home content={content} state={state} dispatch={dispatch} />
    </LangProvider>,
  );
  return dispatch;
}
const card = (title: string) => screen.getByRole('heading', { name: title }).closest('article') as HTMLElement;

describe('Home', () => {
  it('soon card has no buttons and says Coming soon', () => {
    setup();
    const c = card('Later unit');
    expect(within(c).queryAllByRole('button')).toHaveLength(0);
    expect(within(c).getByText('Coming soon')).toBeInTheDocument();
  });

  it('ready card has Learn and Practice, and Practice opens even when not learned', async () => {
    const dispatch = setup();
    const c = card('Demo unit');
    expect(within(c).getByRole('button', { name: 'Learn' })).toBeEnabled();
    await userEvent.click(within(c).getByRole('button', { name: 'Practice' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'openPractice', unitKey: 'demo' });
  });

  it('marks the suggested unit and shows the last-checked date', () => {
    setup();
    const c = card('Demo unit');
    expect(within(c).getByText('Suggested')).toBeInTheDocument();
    expect(within(c).getByText('Last checked 2026-10-21')).toBeInTheDocument();
  });

  it('Up next continues to Learn, or Practice once learned', async () => {
    let dispatch = setup();
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'openLearn', unitKey: 'demo' });
  });

  it('Up next opens Practice once learned', async () => {
    const dispatch = setup({ lang: null, learned: { demo: true }, practiced: {}, xp: 0 });
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'openPractice', unitKey: 'demo' });
  });

  it('shows a done unit with text and the XP total', () => {
    setup({ lang: null, learned: {}, practiced: { demo: true }, xp: 30 });
    expect(within(card('Demo unit')).getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('30 XP')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Continue' })).toBeNull();
  });
});
