import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { SettingsItem } from '../../content/types';
import { LangProvider } from '../../i18n/LangContext';
import type { Lang } from '../../i18n/lang';
import { fixtureParts } from '../../test/fixtures';
import { freshAnswer } from '../grade';
import type { AnswerState } from '../types';
import { SettingsFile } from './SettingsFile';

const item = fixtureParts.bodies.demo!.items.find((i) => i.type === 'settings') as SettingsItem;
const draw = (answer: Partial<AnswerState> = {}, lang: Lang = 'en', it: SettingsItem = item) => {
  const act = vi.fn();
  render(
    <LangProvider lang={lang}>
      <SettingsFile item={it} answer={{ ...freshAnswer(it), ...answer }} act={act} />
    </LangProvider>,
  );
  return act;
};

describe('SettingsFile', () => {
  it('titles the panel with the file and shows lines as aria-pressed buttons in a mono panel', () => {
    draw({ picked: [2] });
    const panel = screen.getByRole('group', { name: /\.claude\/settings\.json/ });
    expect(panel).toBeInTheDocument();
    expect(panel).toHaveAttribute('data-settings-file');
    const lines = panel.querySelectorAll('button');
    expect(lines).toHaveLength(item.lines.length);
    lines.forEach((b) => expect(b).toHaveAttribute('aria-pressed'));
    expect(lines[2]).toHaveAttribute('aria-pressed', 'true');
    expect(lines[1]).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Project (shared)')).toBeInTheDocument();
  });

  it('clicking a line dispatches togglePick', () => {
    const act = draw();
    fireEvent.click(screen.getByRole('button', { name: /bypassPermissions/ }));
    expect(act).toHaveBeenCalledWith({ type: 'togglePick', line: 2 });
  });

  it('after Check, a picked line shows its note; right and wrong are marked by icon and text', () => {
    draw({ checked: true, picked: [2, 3] });
    expect(screen.getByText('This turns off the prompts.')).toBeInTheDocument();
    expect(screen.getByText('This protects your secrets.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /bypassPermissions/ })).toHaveTextContent('Problem line');
    expect(screen.getByRole('button', { name: /Read\(\.\/\.env\)/ })).toHaveTextContent('Not a problem');
    expect(screen.getByRole('button', { name: /bypassPermissions/ })).toBeDisabled();
  });

  it('before Check, no notes are shown', () => {
    draw({ picked: [2] });
    expect(screen.queryByText('This turns off the prompts.')).toBeNull();
  });

  it('shows the review header pane when given', () => {
    draw({}, 'en', { ...item, type: 'review', header: { title: 'Plugin: fmt', rows: [{ en: 'Runs a hook', ja: 'フックを実行' }] } });
    expect(screen.getByText('Plugin: fmt')).toBeInTheDocument();
    expect(screen.getByText('Runs a hook')).toBeInTheDocument();
  });

  it('localizes to Japanese', () => {
    draw({}, 'ja');
    expect(screen.getByText('プロジェクト（共有）')).toBeInTheDocument();
  });
});
