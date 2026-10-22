import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { Demo } from '../../content/types';
import { LangProvider } from '../../i18n/LangContext';
import { UI } from '../../i18n/ui';
import { fixtureParts } from '../../test/fixtures';
import { ModesDemo } from './ModesDemo';

const demo = fixtureParts.bodies.demo!.cards.find((c) => c.demo?.kind === 'modes')!.demo as Extract<Demo, { kind: 'modes' }>;
const wrap = () => render(<LangProvider lang="en"><ModesDemo demo={demo} /></LangProvider>);
const press = () => userEvent.click(screen.getByRole('button', { name: UI.en.pressShiftTab }));

describe('ModesDemo', () => {
  it('starts on auto', () => {
    wrap();
    expect(screen.getByTestId('status-bar')).toHaveTextContent('⏵⏵ auto mode on');
    expect(screen.getByRole('radio', { name: 'Auto' })).toBeChecked();
    expect(screen.getByText('Everything, with safety checks.')).toBeInTheDocument();
  });

  it('one press goes to manual, four return to auto, in F4 order', async () => {
    wrap();
    const seen: string[] = [];
    for (let i = 0; i < 4; i++) {
      await press();
      seen.push(screen.getByTestId('status-bar').textContent ?? '');
    }
    expect(seen[0]).toContain('⏸ manual mode on');
    expect(seen[1]).toContain('⏵⏵ accept edits on');
    expect(seen[2]).toContain('⏸ plan mode on');
    expect(seen[3]).toContain('⏵⏵ auto mode on');
  });

  it('the status change is announced in a live region', async () => {
    wrap();
    await press();
    expect(screen.getByRole('status')).toHaveTextContent('⏸ manual mode on');
  });

  it('the desktop radios choose a mode and the status bar follows', async () => {
    wrap();
    const group = screen.getByRole('radiogroup', { name: UI.en.modeSelector });
    expect(group).toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Plan' }));
    expect(screen.getByTestId('status-bar')).toHaveTextContent('⏸ plan mode on');
    expect(screen.getAllByText('Reads and planning.').length).toBeGreaterThan(0);
  });

  it('does not capture the real Shift+Tab key', async () => {
    wrap();
    await userEvent.tab();
    await userEvent.tab({ shift: true });
    expect(screen.getByTestId('status-bar')).toHaveTextContent('⏵⏵ auto mode on');
  });
});
