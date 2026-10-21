import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { App } from './App';
import { fixtureContent } from './test/fixtures';
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
});
