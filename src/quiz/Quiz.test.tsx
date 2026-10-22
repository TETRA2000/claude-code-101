import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { LangProvider } from '../i18n/LangContext';
import type { Lang } from '../i18n/lang';
import { UI } from '../i18n/ui';
import { fixtureContent, fixtureParts } from '../test/fixtures';
import { Quiz } from './Quiz';

const all = fixtureParts.bodies.demo!.items;
const pick = (...ids: string[]) => ids.map((id) => all.find((i) => i.id === id)!);
// Simple, button-only items. Right answers: approve Yes, predict "README.md", setup "Ask before acting".
const simple = pick('demo-approve', 'demo-predict', 'demo-setup');

function Host(p: { items: typeof all; onComplete?: (r: { unitKey: string; xp: number }) => void; guardMs?: number }) {
  const [lang, setLang] = useState<Lang>('en');
  return (
    <LangProvider lang={lang}>
      <Quiz
        unitKey="demo"
        items={p.items}
        onExit={vi.fn()}
        onComplete={p.onComplete ?? vi.fn()}
        onLang={setLang}
        guardMs={p.guardMs ?? 0}
        content={fixtureContent}
      />
    </LangProvider>
  );
}

const check = () => screen.getByRole('button', { name: 'Check' });
const cont = () => screen.getByRole('button', { name: 'Continue' });

async function answerRight(user: ReturnType<typeof userEvent.setup>, id: string) {
  const btn = (name: string | RegExp) => screen.getByRole('button', { name });
  const pairUp = async (l: string, r: string) => {
    await user.click(btn(l));
    await user.click(btn(r));
  };
  let autoGraded = false;
  switch (id) {
    case 'demo-approve':
      await user.click(btn('Yes'));
      break;
    case 'demo-predict':
      await user.click(btn(/README\.md$/));
      break;
    case 'demo-setup':
      await user.click(btn('Ask before acting'));
      break;
    case 'demo-combo':
      await user.click(btn('Use a fresh profile with no logins'));
      break;
    case 'demo-chain':
      await user.click(btn(/^2\. browser_navigate/));
      break;
    case 'demo-hidden':
      await user.click(btn('Line 3 (looks blank)'));
      break;
    case 'demo-order':
      await user.click(btn('Move down: The result goes into context'));
      await user.click(btn('Move down: The result goes into context'));
      break;
    case 'demo-rule':
      await user.click(btn('deny'));
      await user.click(btn('Bash(curl *)'));
      break;
    case 'demo-pairs':
      autoGraded = true;
      await pairUp('~/.ssh', 'SSH keys');
      await pairUp('~/.aws', 'Cloud logins');
      await pairUp('.env', 'API keys');
      await pairUp('~/.zshrc', 'Shell settings');
      break;
    case 'demo-decode':
      autoGraded = true;
      await pairUp('rm', 'Remove');
      await pairUp('-rf', 'Everything inside, no questions');
      await pairUp('build', 'The folder');
      break;
  }
  if (!autoGraded) await user.click(check());
  await user.click(cont());
}

describe('Quiz', () => {
  it('completes a run once with 10 XP per item', async () => {
    const user = userEvent.setup();
    const onComplete = vi.fn();
    render(<Host items={all} onComplete={onComplete} />);
    expect(screen.getByText('Approve or deny')).toBeInTheDocument();
    for (const it of all) await answerRight(user, it.id);
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({ unitKey: 'demo', xp: 10 * all.length });
  });

  it('a wrong answer costs a heart, re-queues the item and shows Not quite', async () => {
    const user = userEvent.setup();
    render(<Host items={pick('demo-setup', 'demo-predict')} />);
    await user.click(screen.getByRole('button', { name: 'Turn permissions off' }));
    await user.click(check());
    expect(screen.getByRole('region', { name: 'Feedback' })).toHaveTextContent('Not quite');
    expect(screen.getByText('4 hearts left')).toBeInTheDocument();
    await user.click(cont());
    await user.click(screen.getByRole('button', { name: /README\.md$/ }));
    await user.click(check());
    await user.click(cont());
    // the missed setup item comes back at the end
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Pick the setup.');
  });

  it('a double click on Check then Continue advances only one item', async () => {
    const user = userEvent.setup();
    render(<Host items={simple} guardMs={350} />);
    await user.click(screen.getByRole('button', { name: 'Yes' }));
    await new Promise((r) => setTimeout(r, 400));
    await user.dblClick(check());
    expect(screen.getByRole('region', { name: 'Feedback' })).toBeInTheDocument();
    await user.dblClick(cont());
    // first click inside the guard is ignored, so we are still on the feedback sheet for item 1
    expect(screen.getByRole('region', { name: 'Feedback' })).toBeInTheDocument();
    await new Promise((r) => setTimeout(r, 400));
    await user.dblClick(cont());
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('What does it print?');
    expect(screen.queryByRole('region', { name: 'Feedback' })).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33');
  });

  it('keeps position, hearts, XP and selection when the language switches', async () => {
    const user = userEvent.setup();
    render(<Host items={simple} />);
    await answerRight(user, 'demo-approve');
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('What does it print?');
    const opt = screen.getByRole('button', { name: /README\.md$/ });
    await user.click(opt);
    await user.click(screen.getByRole('button', { name: '日本語' }));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('何が表示されますか？');
    expect(screen.getByRole('button', { name: /README\.md$/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33');
    expect(screen.getByText(UI.ja.heartsLeft(5))).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'English' }));
    await user.click(check());
    await user.click(cont());
    await answerRight(user, 'demo-setup');
    expect(screen.getByText('+30 XP', { exact: false })).toBeInTheDocument();
  });

  it('shows the out-of-hearts screen at 0 hearts', async () => {
    const user = userEvent.setup();
    render(<Host items={Array.from({ length: 6 }, (_, i) => ({ ...pick('demo-setup')[0]!, id: `s${i}` }))} />);
    for (let i = 0; i < 5; i++) {
      await user.click(screen.getByRole('button', { name: 'Turn permissions off' }));
      await user.click(check());
      await user.click(cont());
    }
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/out of hearts/i);
  });
});
