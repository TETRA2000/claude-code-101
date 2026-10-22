import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { TryIt as TryItData } from '../../content/types';
import { LangProvider } from '../../i18n/LangContext';
import { UI } from '../../i18n/ui';
import { TryIt } from './TryIt';

const ui = UI.en;
const data: TryItData = {
  terminal: [
    { text: { en: 'Go to your project.', ja: 'プロジェクトへ移動。' }, code: 'cd ~/project', copy: true },
    { text: { en: 'Read the screen.', ja: '画面を読む。' }, code: 'claude --version' },
  ],
  desktopNote: { en: 'No desktop steps here.', ja: 'デスクトップの手順はありません。' },
  check: { en: 'A prompt appears.', ja: 'プロンプトが出ます。' },
};

function setup(d: TryItData = data) {
  return render(
    <LangProvider lang="en">
      <TryIt data={d} />
    </LangProvider>,
  );
}
/** Click like a user, with our clipboard stub installed after user-event's own. */
async function clickCopy(clipboard: unknown) {
  const user = userEvent.setup();
  setClipboard(clipboard);
  await user.click(screen.getByRole('button', { name: ui.copy }));
}
function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
}
afterEach(() => setClipboard(undefined));

describe('TryIt', () => {
  it('uses the ARIA tabs pattern with arrow keys', async () => {
    setup();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
    const [term, desk] = screen.getAllByRole('tab');
    expect(term).toHaveAccessibleName(ui.tabTerminal);
    expect(term).toHaveAttribute('aria-selected', 'true');
    expect(desk).toHaveAttribute('aria-selected', 'false');
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName(ui.tabTerminal);
    term!.focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(desk).toHaveAttribute('aria-selected', 'true');
    expect(desk).toHaveFocus();
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName(ui.tabDesktop);
    await userEvent.keyboard('{ArrowRight}');
    expect(term).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{ArrowLeft}');
    expect(desk).toHaveAttribute('aria-selected', 'true');
  });

  it('shows desktopNote on the Desktop tab when there are no desktop steps', async () => {
    setup();
    await userEvent.click(screen.getByRole('tab', { name: ui.tabDesktop }));
    expect(screen.getByText('No desktop steps here.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: ui.copy })).toBeNull();
  });

  it('shows the check line', () => {
    setup();
    expect(screen.getByText(ui.checkItWorked)).toBeInTheDocument();
    expect(screen.getByText('A prompt appears.')).toBeInTheDocument();
  });

  it('copy buttons appear only on steps with copy', () => {
    setup();
    expect(screen.getAllByRole('button', { name: ui.copy })).toHaveLength(1);
  });

  it('copies and says Copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    setup();
    await clickCopy({ writeText });
    expect(writeText).toHaveBeenCalledWith('cd ~/project');
    expect(await screen.findByText(ui.copied)).toBeInTheDocument();
  });

  it('shows the failure state when writeText rejects', async () => {
    setup();
    await clickCopy({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });
    expect(await screen.findByText(ui.copyFailed)).toBeInTheDocument();
  });

  it('shows the failure state when writeText throws synchronously', async () => {
    setup();
    await clickCopy({
      writeText: () => {
        throw new Error('insecure');
      },
    });
    expect(await screen.findByText(ui.copyFailed)).toBeInTheDocument();
  });

  it('shows the failure state when navigator.clipboard is undefined', async () => {
    setup();
    await clickCopy(undefined);
    expect(await screen.findByText(ui.copyFailed)).toBeInTheDocument();
  });
});
