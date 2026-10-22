import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Demo } from '../../content/types';
import { LangProvider } from '../../i18n/LangContext';
import { fixtureParts } from '../../test/fixtures';
import { SettingsDemo, winningFile } from './SettingsDemo';

const demo = fixtureParts.bodies.demo!.cards.find((c) => c.demo?.kind === 'settings')!.demo as Extract<Demo, { kind: 'settings' }>;
const wrap = (d = demo) => render(<LangProvider lang="en"><SettingsDemo demo={d} /></LangProvider>);

describe('winningFile', () => {
  it('picks the highest scope that sets the key and reads its value', () => {
    expect(winningFile(demo.key, demo.files)).toMatchObject({ file: { scope: 'project' }, value: '"plan"' });
    expect(winningFile('model', demo.files)).toBeNull();
  });
});

describe('SettingsDemo', () => {
  it('names the project value when user and project both set defaultMode', () => {
    wrap();
    const wins = screen.getByTestId('wins');
    expect(wins).toHaveTextContent('"plan"');
    expect(wins).toHaveTextContent('.claude/settings.json');
    expect(wins).not.toHaveTextContent('"default"');
  });

  it('a higher scope takes over when it sets the key too', () => {
    const local = demo.files[2]!;
    wrap({ ...demo, files: [demo.files[0]!, demo.files[1]!, { ...local, lines: ['"defaultMode": "acceptEdits"'] }] });
    expect(screen.getByTestId('wins')).toHaveTextContent('"acceptEdits"');
  });

  it('clicking a file shows who it affects, and marks it pressed', async () => {
    wrap();
    expect(screen.queryByText('You, in this one project only.')).toBeNull();
    const btn = screen.getByRole('button', { name: /\.claude\/settings\.local\.json/ });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText('You, in this one project only.')).toBeInTheDocument();
  });

  it('lists files highest precedence first', () => {
    wrap();
    const names = screen.getAllByRole('button').map((b) => b.textContent ?? '');
    expect(names[0]).toContain('settings.local.json');
    expect(names[2]).toContain('~/.claude/settings.json');
  });
});
