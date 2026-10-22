import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { LangProvider } from '../../i18n/LangContext';
import { UI } from '../../i18n/ui';
import { fixtureParts } from '../../test/fixtures';
import type { Demo } from '../../content/types';
import { AnatomyDemo } from './AnatomyDemo';
import { ContextDemo } from './ContextDemo';
import { RulesDemo } from './RulesDemo';
import { TerminalDemo } from './TerminalDemo';

const cards = fixtureParts.bodies.demo!.cards;
const demo = <K extends Demo['kind']>(kind: K) => cards.find((c) => c.demo?.kind === kind)!.demo as Extract<Demo, { kind: K }>;
const wrap = (n: React.ReactNode) => render(<LangProvider lang="en">{n}</LangProvider>);

describe('TerminalDemo', () => {
  it('shows scripted output after a click and keeps only the last 4 runs', async () => {
    const d = demo('terminal');
    const many = { ...d, commands: [...d.commands, { cmd: 'pwd', output: [{ text: '/x' }] }, { cmd: 'whoami', output: [{ text: 'me' }] }] };
    wrap(<TerminalDemo demo={many} />);
    expect(screen.queryByText('. .. .env README.md src')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'ls -a' }));
    expect(screen.getByText('. .. .env README.md src')).toBeInTheDocument();
    expect(screen.getByText('Secrets live here.')).toBeInTheDocument();
    const ls = screen.getByRole('button', { name: 'ls' });
    for (let i = 0; i < 3; i++) await userEvent.click(ls);
    await userEvent.click(screen.getByRole('button', { name: 'pwd' }));
    expect(screen.getAllByTestId('run')).toHaveLength(4);
    expect(screen.queryByText('. .. .env README.md src')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(screen.queryAllByTestId('run')).toHaveLength(0);
  });
});

describe('ContextDemo', () => {
  it('shows author labels only after the toggle', async () => {
    wrap(<ContextDemo demo={demo('context')} />);
    expect(screen.queryByText('A stranger')).toBeNull();
    const toggle = screen.getByRole('button', { name: 'Color by who wrote it' });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getAllByText('A stranger').length).toBeGreaterThan(0);
    expect(screen.getByText('Welcome to our shop.')).toBeInTheDocument();
  });
});

describe('AnatomyDemo', () => {
  it('renders terminal and desktop surfaces with numbered notes', () => {
    const { container } = wrap(<AnatomyDemo demo={demo('anatomy')} />);
    expect(container.querySelector('[data-surface="terminal"]')).not.toBeNull();
    expect(container.querySelector('[data-surface="desktop"]')).not.toBeNull();
    expect(screen.getByText('Which tool runs.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').length).toBeGreaterThan(0);
  });
});

describe('RulesDemo', () => {
  const row = (target: string) => screen.getByTestId(`call-${target}`);
  const input = () => screen.getByRole('textbox', { name: 'Rule' });

  it('shows each call with an outcome in text, from the demo rules', () => {
    wrap(<RulesDemo demo={demo('rules')} />);
    expect(within(row('npm test')).getByText('Runs')).toBeInTheDocument();
    expect(within(row('curl https://example.com')).getByText('Asks you')).toBeInTheDocument();
    expect(within(row('./.env')).getByText('Runs')).toBeInTheDocument();
    expect(screen.getByText('Bash(npm test)')).toBeInTheDocument();
  });

  it('adding deny Read(./.env) turns the .env call to blocked', async () => {
    wrap(<RulesDemo demo={demo('rules')} />);
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'List' }), 'deny');
    await userEvent.type(input(), 'Read(./.env)');
    expect(within(row('./.env')).getByText('Blocked')).toBeInTheDocument();
    expect(within(row('npm test')).getByText('Runs')).toBeInTheDocument();
    expect(screen.queryByText(UI.en.ruleNotUnderstood)).toBeNull();
  });

  it('a malformed rule shows ruleNotUnderstood and changes nothing (Review Focus 5)', async () => {
    wrap(<RulesDemo demo={demo('rules')} />);
    expect(screen.queryByText(UI.en.ruleNotUnderstood)).toBeNull();
    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'List' }), 'deny');
    for (const bad of ['Bash(', 'Bash(npm *) extra', 'Nope(x)', '(x)']) {
      await userEvent.clear(input());
      await userEvent.type(input(), bad.replace(/[[{]/g, (c) => c + c));
      expect(screen.getByText(UI.en.ruleNotUnderstood)).toBeInTheDocument();
      expect(within(row('npm test')).getByText('Runs')).toBeInTheDocument();
    }
    await userEvent.clear(input());
    expect(screen.queryByText(UI.en.ruleNotUnderstood)).toBeNull();
  });
});
