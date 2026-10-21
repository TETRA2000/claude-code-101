import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LangProvider } from '../i18n/LangContext';
import { LangSwitch } from './LangSwitch';

describe('LangSwitch', () => {
  it('has two buttons with aria-pressed reflecting lang, and reports changes', () => {
    const onChange = vi.fn();
    render(
      <LangProvider lang="en">
        <LangSwitch lang="en" onChange={onChange} />
      </LangProvider>,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveAttribute('aria-pressed', 'true');
    expect(buttons[1]).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(buttons[1]!);
    expect(onChange).toHaveBeenCalledWith('ja');
  });
});
