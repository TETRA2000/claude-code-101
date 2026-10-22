import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { bossParts, fixtureContent, fixtureParts } from './test/fixtures';
import { createContent } from './content';
import { UI } from './i18n/ui';
import { XP_FIRST_TRY } from './state/rules';
import type { Progress, ProgressStore } from './storage/progress';

const empty = (): Progress => ({ lang: null, learned: {}, practiced: {}, xp: 0 });
function fakeStore(p: Progress = empty()) {
  const save = vi.fn();
  const store: ProgressStore = { load: () => p, save };
  return { store, save };
}

describe('App', () => {
  it('renders the hero and sets document.title', () => {
    render(<App store={fakeStore().store} content={fixtureContent} languages={['en']} />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Work with an AI agent');
    expect(document.title).toBe('Claude Code 101');
  });

  it('switching to Japanese updates <html lang> and saves lang', async () => {
    const { store, save } = fakeStore();
    render(<App store={store} content={fixtureContent} languages={['en']} />);
    expect(document.documentElement.lang).toBe('en');
    await userEvent.click(screen.getByRole('button', { name: '日本語' }));
    expect(document.documentElement.lang).toBe('ja');
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ lang: 'ja' }));
  });

  it('first render is Japanese for a ja browser with empty storage', () => {
    render(<App store={fakeStore().store} content={fixtureContent} languages={['ja-JP']} />);
    expect(document.documentElement.lang).toBe('ja');
    expect(screen.getByText('コース')).toBeInTheDocument();
  });

  it('opens Practice from a unit card', async () => {
    render(<App store={fakeStore().store} content={fixtureContent} languages={['en']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Practice' }));
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('routes Practice for a boss unit to the timed boss, and records completion and XP', async () => {
    const parts = bossParts();
    const content = createContent(parts.units, fixtureParts.types, parts.bodies);
    const { store, save } = fakeStore();
    render(<App store={store} content={content} languages={['en']} bossSeconds={3} />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Practice' }).at(-1)!); // the boss is the last unit
    expect(screen.getByRole('button', { name: UI.en.bossStart })).toBeInTheDocument();
    expect(screen.queryByText(UI.en.heartsLeft(5))).not.toBeInTheDocument();
    vi.useFakeTimers();
    try {
      fireEvent.click(screen.getByRole('button', { name: UI.en.bossStart }));
      expect(screen.getByRole('timer')).toHaveTextContent('0:03');
      act(() => void vi.advanceTimersByTime(400)); // past the activation guard
      fireEvent.click(screen.getByRole('button', { name: UI.en.approveYes })); // the first pick is harmless: right
      for (let i = 0; i < 3; i++) act(() => void vi.advanceTimersByTime(1000));
    } finally {
      vi.useRealTimers();
    }
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(UI.en.bossTimeUp);
    expect(save).toHaveBeenLastCalledWith(expect.objectContaining({ practiced: expect.objectContaining({ boss: true }), xp: XP_FIRST_TRY }));
  });

  it('a boss run with no answers does not mark the boss done', async () => {
    const parts = bossParts();
    const content = createContent(parts.units, fixtureParts.types, parts.bodies);
    const { store, save } = fakeStore();
    render(<App store={store} content={content} languages={['en']} bossSeconds={2} />);
    await userEvent.click(screen.getAllByRole('button', { name: 'Practice' }).at(-1)!);
    vi.useFakeTimers();
    try {
      fireEvent.click(screen.getByRole('button', { name: UI.en.bossStart }));
      for (let i = 0; i < 2; i++) act(() => void vi.advanceTimersByTime(1000));
    } finally {
      vi.useRealTimers();
    }
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(UI.en.bossTimeUp);
    for (const [p] of save.mock.calls) expect((p as Progress).practiced.boss).toBeUndefined();
  });
});

describe('App with lazily loaded units', () => {
  it('shows a loading state, then the unit', async () => {
    let resolve!: (b: (typeof fixtureParts.bodies)['demo']) => void;
    const content = createContent(fixtureParts.units, fixtureParts.types, {}, { demo: () => new Promise((r) => (resolve = r)) });
    render(<App store={fakeStore().store} content={content} languages={['en']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Learn' }));
    expect(screen.getByRole('status')).toHaveTextContent(UI.en.loadingUnit);
    await act(async () => resolve(fixtureParts.bodies.demo!));
    expect(screen.queryByText(UI.en.loadingUnit)).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(fixtureParts.bodies.demo!.cards[0]!.title.en);
  });

  it('offers a retry when loading fails', async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValue(fixtureParts.bodies.demo!);
    const content = createContent(fixtureParts.units, fixtureParts.types, {}, { demo: load });
    render(<App store={fakeStore().store} content={content} languages={['en']} />);
    await userEvent.click(screen.getByRole('button', { name: 'Learn' }));
    expect(await screen.findByRole('alert')).toHaveTextContent(UI.en.loadFailed);
    await userEvent.click(screen.getByRole('button', { name: UI.en.tryAgain }));
    expect(await screen.findByRole('heading', { level: 1 })).toHaveTextContent(fixtureParts.bodies.demo!.cards[0]!.title.en);
    expect(load).toHaveBeenCalledTimes(2);
  });
});
