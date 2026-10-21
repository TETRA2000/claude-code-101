import { render, screen } from '@testing-library/react';
import { it, expect } from 'vitest';
import { App } from './App';

it('renders the course title', () => {
  render(<App />);
  expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  expect(document.title).toBe('Claude Code 101');
});
