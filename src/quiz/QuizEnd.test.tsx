import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LangProvider } from '../i18n/LangContext';
import { fixtureParts } from '../test/fixtures';
import { QuizDone } from './QuizEnd';
import { startSession } from './session';

describe('QuizDone', () => {
  it('lists the unit\'s official docs', () => {
    const session = startSession('demo', fixtureParts.bodies.demo!.items);
    render(
      <LangProvider lang="en">
        <QuizDone session={session} docs={fixtureParts.units[0]!.docs} onHome={vi.fn()} onRetry={vi.fn()} />
      </LangProvider>,
    );
    expect(screen.getByRole('heading', { name: 'Official docs' })).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(3);
  });
});
