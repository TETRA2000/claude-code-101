import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Item } from '../content/types';
import { LangProvider } from '../i18n/LangContext';
import type { Lang } from '../i18n/lang';
import { UI } from '../i18n/ui';
import { bossDanger, bossSafe } from '../test/fixtures';
import { Boss } from './Boss';

const en = UI.en;

function Host(p: {
  items?: Item[];
  seconds?: number;
  guardMs?: number;
  onComplete?: (r: { unitKey: string; xp: number }) => void;
  unitTitle?: (key: string) => { en: string; ja: string } | undefined;
}) {
  const [lang, setLang] = useState<Lang>('en');
  return (
    <LangProvider lang={lang}>
      <Boss
        unitKey="boss"
        title={{ en: 'Boss: Continue? Y/N', ja: 'ボス戦：Continue? Y/N' }}
        items={p.items ?? [bossSafe, bossDanger]}
        seconds={p.seconds ?? 60}
        guardMs={p.guardMs ?? 0}
        onExit={vi.fn()}
        onComplete={p.onComplete ?? vi.fn()}
        onLang={setLang}
        unitTitle={p.unitTitle}
      />
    </LangProvider>
  );
}

const btn = (name: string | RegExp) => screen.getByRole('button', { name });
/** One act per second, so React re-arms the one-second timer between ticks, as it does in a browser. */
const tickSeconds = (n: number) => {
  for (let i = 0; i < n; i++) act(() => void vi.advanceTimersByTime(1000));
};

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('Boss', () => {
  it('starts on an intro, then shows the first prompt with the timer', () => {
    render(<Host />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Boss: Continue? Y/N');
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    fireEvent.click(btn(en.bossStart));
    expect(screen.getByRole('timer')).toHaveTextContent('1:00');
    expect(screen.getByText('npm test', { selector: 'span' })).toBeInTheDocument();
    expect(btn(en.bossPause)).toBeInTheDocument();
  });

  it('the recap shows a BREAKING headline for a dangerous Yes', () => {
    const onComplete = vi.fn();
    render(<Host onComplete={onComplete} />);
    fireEvent.click(btn(en.bossStart));
    fireEvent.click(btn(en.approveYes)); // npm test: right
    fireEvent.click(btn(en.approveYes)); // rm -rf ~/Documents: dangerous Yes
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(en.bossRecapTitle);
    const rows = screen.getAllByRole('listitem');
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent(en.bossAllowed);
    expect(rows[0]).toHaveTextContent(en.bossRight);
    expect(rows[0]).toHaveTextContent('Fine: it runs your tests.');
    expect(rows[0]).not.toHaveTextContent(en.breaking);
    expect(rows[1]).toHaveTextContent(en.bossWrong);
    expect(within(rows[1]!).getByText(en.breaking)).toBeInTheDocument();
    expect(rows[1]).toHaveTextContent('Documents folder wiped by cleanup');
    expect(rows[1]).toHaveTextContent('It deleted your Documents folder.');
    expect(within(rows[1]!).getByRole('link')).toHaveAttribute('href', 'https://code.claude.com/docs/en/security');
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({ unitKey: 'boss', xp: 10 });
  });

  it('a denied prompt says so, and has no headline', () => {
    render(<Host items={[bossDanger]} />);
    fireEvent.click(btn(en.bossStart));
    fireEvent.click(btn(en.approveNo));
    const row = screen.getByRole('listitem');
    expect(row).toHaveTextContent(en.bossDenied);
    expect(row).toHaveTextContent(en.bossRight);
    expect(row).not.toHaveTextContent(en.breaking);
  });

  it('time running out shows the recap with the unanswered count', () => {
    const onComplete = vi.fn();
    render(<Host seconds={3} onComplete={onComplete} />);
    fireEvent.click(btn(en.bossStart));
    fireEvent.click(btn(en.approveNo));
    tickSeconds(3);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(en.bossTimeUp);
    expect(screen.getByText(en.bossScore(0, 1, 2))).toBeInTheDocument();
    expect(en.bossScore(0, 1, 2)).toBe('0 of 1 answered right. 1 left unanswered.');
    expect(UI.ja.bossScore(0, 1, 2)).toBe('1問中0問正解。未回答は1問です。');
    expect(onComplete).toHaveBeenCalledWith({ unitKey: 'boss', xp: 0 });
  });

  it('Pause stops ticks, Resume starts them again', () => {
    render(<Host seconds={5} />);
    fireEvent.click(btn(en.bossStart));
    tickSeconds(1);
    expect(screen.getByRole('timer')).toHaveTextContent('0:04');
    fireEvent.click(btn(en.bossPause));
    tickSeconds(10);
    expect(screen.getByRole('timer')).toHaveTextContent('0:04');
    expect(screen.getByText(en.bossPausedNote)).toBeInTheDocument();
    fireEvent.click(btn(en.bossResume));
    tickSeconds(1);
    expect(screen.getByRole('timer')).toHaveTextContent('0:03');
  });

  it('announces the time only at 30 and 10 seconds, and never keeps a stale time', () => {
    render(<Host seconds={31} items={[bossSafe, bossDanger]} />);
    fireEvent.click(btn(en.bossStart));
    const live = screen.getByTestId('boss-announce');
    expect(live).toHaveAttribute('aria-live', 'polite');
    expect(live).toHaveTextContent('');
    tickSeconds(1);
    expect(live).toHaveTextContent(en.bossSecondsLeft(30));
    tickSeconds(1);
    expect(live).toHaveTextContent('');
    tickSeconds(19);
    expect(live).toHaveTextContent(en.bossSecondsLeft(10));
    tickSeconds(1);
    expect(live).toHaveTextContent('');
    tickSeconds(9);
    // Time's up: the recap heading announces it, the live region is empty.
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(en.bossTimeUp);
    expect(live).toHaveTextContent('');
  });

  it('a run with no answers is not reported as done', () => {
    const onComplete = vi.fn();
    render(<Host seconds={2} onComplete={onComplete} />);
    fireEvent.click(btn(en.bossStart));
    tickSeconds(2);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(en.bossTimeUp);
    expect(screen.getByText(en.bossNoAnswers)).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('quick Pause/Resume toggles cannot hold the clock still', () => {
    render(<Host seconds={5} />);
    fireEvent.click(btn(en.bossStart));
    for (let i = 0; i < 4; i++) {
      act(() => void vi.advanceTimersByTime(300));
      fireEvent.click(btn(en.bossPause));
      fireEvent.click(btn(en.bossResume));
    }
    expect(screen.getByRole('timer')).toHaveTextContent('0:04');
  });

  it('answer buttons act at once, so they are plain buttons without aria-pressed', () => {
    render(<Host />);
    fireEvent.click(btn(en.bossStart));
    expect(btn(en.approveYes)).not.toHaveAttribute('aria-pressed');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(en.bossPromptOf(1, 2));
  });

  it('the recap has the header, with Close and the language switch', () => {
    render(<Host items={[bossSafe]} />);
    fireEvent.click(btn(en.bossStart));
    fireEvent.click(btn(en.approveYes));
    expect(btn(en.quit)).toBeInTheDocument();
    expect(screen.getByText(en.bossScore(1, 1, 1))).toBeInTheDocument();
    expect(en.bossScore(1, 1, 1)).toBe('1 of 1 answered right.');
  });

  it('ignores a second tap right after a new prompt appears', () => {
    render(<Host guardMs={350} />);
    fireEvent.click(btn(en.bossStart));
    act(() => {
      vi.advanceTimersByTime(400);
    });
    fireEvent.click(btn(en.approveYes));
    fireEvent.click(btn(en.approveYes)); // inside the guard: ignored
    expect(screen.getByText('rm -rf ~/Documents')).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(400);
    });
    fireEvent.click(btn(en.approveNo));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(en.bossRecapTitle);
  });

  it('the recap names the unit a picked prompt comes from', () => {
    const picked = { ...bossDanger, fromUnit: 'permissions' };
    render(<Host items={[picked]} unitTitle={(k) => (k === 'permissions' ? { en: 'Permission prompts', ja: '許可プロンプト' } : undefined)} />);
    fireEvent.click(btn(en.bossStart));
    fireEvent.click(btn(en.approveNo));
    expect(screen.getByRole('listitem')).toHaveTextContent(en.bossFrom('Permission prompts'));
  });

  it('Try again from the recap runs the boss again', () => {
    render(<Host items={[bossSafe]} />);
    fireEvent.click(btn(en.bossStart));
    fireEvent.click(btn(en.approveYes));
    fireEvent.click(btn(en.tryAgain));
    expect(screen.getByRole('timer')).toHaveTextContent('1:00');
  });
});
