import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { LangProvider } from '../i18n/LangContext';
import { fixtureParts } from '../test/fixtures';
import { Learn } from './Learn';

const unit = fixtureParts.units.find((u) => u.key === 'demo')!;
const cards = fixtureParts.bodies.demo!.cards;
const last = cards.length - 1;

function setup(card: number) {
  const dispatch = vi.fn();
  render(
    <LangProvider lang="en">
      <Learn unit={unit} cards={cards} card={card} dispatch={dispatch} />
    </LangProvider>,
  );
  return dispatch;
}

describe('Learn docs links', () => {
  it('shows the card\'s Learn more link', () => {
    setup(0);
    const a = screen.getByRole('link', { name: /Learn more/ });
    expect(a).toHaveAttribute('href', 'https://code.claude.com/docs/en/claude-directory');
    expect(a).toHaveAttribute('target', '_blank');
  });
  it('shows the unit\'s official docs list on the last card only', () => {
    setup(0);
    expect(screen.queryByRole('heading', { name: 'Official docs' })).toBeNull();
    cleanup();
    setup(last);
    expect(screen.getByRole('heading', { name: 'Official docs' })).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(unit.docs!.length);
    expect(screen.getByText('Read this for the safety model.')).toBeInTheDocument();
  });
});

describe('Learn new card kinds', () => {
  it('renders a rules demo with a labeled rule input', () => {
    setup(cards.findIndex((c) => c.demo?.kind === 'rules'));
    expect(screen.getByRole('textbox', { name: 'Rule' })).toBeInTheDocument();
  });
  it('renders a modes demo with the Shift+Tab button and the desktop selector', () => {
    setup(cards.findIndex((c) => c.demo?.kind === 'modes'));
    expect(screen.getByRole('button', { name: 'Press Shift+Tab' })).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Mode selector' })).toBeInTheDocument();
  });
  it('renders a closed details for a deep section', () => {
    setup(1);
    const summary = screen.getByText('Under the hood');
    expect(summary.tagName).toBe('SUMMARY');
    const details = summary.closest('details')!;
    expect(details).not.toHaveAttribute('open');
    expect(details).toHaveTextContent('How the prompt is built');
  });
  it('renders the Try it card with data-try', () => {
    setup(1);
    expect(screen.getByRole('heading', { name: 'Try it' })).toBeInTheDocument();
    expect(document.querySelector('[data-try]')).not.toBeNull();
  });
});

describe('Learn', () => {
  it('first card: no Back, shows key idea, Next goes to card 1', async () => {
    const dispatch = setup(0);
    expect(screen.queryByRole('button', { name: 'Back' })).toBeNull();
    expect(screen.getByText('Key idea')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', String(Math.round(100 / cards.length)));
    await userEvent.click(screen.getByRole('button', { name: 'Next' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'gotoCard', card: 1 });
  });
  it('Back goes to previous card', async () => {
    const dispatch = setup(1);
    await userEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'gotoCard', card: 0 });
  });
  it('last card finishes with practice or done', async () => {
    const dispatch = setup(last);
    expect(screen.queryByRole('button', { name: 'Next' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Practice this' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'finishLearn', practice: true });
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'finishLearn', practice: false });
  });
  it('close goes home and language switch dispatches', async () => {
    const dispatch = setup(0);
    await userEvent.click(screen.getByRole('button', { name: 'Quit' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'goHome' });
    await userEvent.click(screen.getByRole('button', { name: '日本語' }));
    expect(dispatch).toHaveBeenCalledWith({ type: 'setLang', lang: 'ja' });
  });
  it('on card change, scrolls the content back to the top and focuses the title', () => {
    const props = { unit, cards, dispatch: vi.fn() };
    const { rerender } = render(
      <LangProvider lang="en">
        <Learn {...props} card={0} />
      </LangProvider>,
    );
    const main = screen.getByRole('main');
    main.scrollTop = 400;
    screen.getByRole('button', { name: 'Next' }).focus();
    rerender(
      <LangProvider lang="en">
        <Learn {...props} card={1} />
      </LangProvider>,
    );
    expect(screen.getByRole('main').scrollTop).toBe(0);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(cards[1]!.title.en);
    expect(h1).toHaveFocus();
  });
});
