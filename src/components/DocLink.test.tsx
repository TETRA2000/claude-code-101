import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LangProvider } from '../i18n/LangContext';
import type { Lang } from '../i18n/lang';
import { UI } from '../i18n/ui';
import { DocLink } from './DocLink';
import type { DocRef } from '../content/types';

const wrap = (ref: DocRef, lang: Lang, label?: string) =>
  render(
    <LangProvider lang={lang}>
      <DocLink docRef={ref} label={label} />
    </LangProvider>,
  );

describe('DocLink', () => {
  it('opens in a new tab safely, with screen-reader text', () => {
    wrap({ slug: 'permissions', anchor: 'a' }, 'en', 'Permissions');
    const a = screen.getByRole('link');
    expect(a).toHaveAttribute('href', 'https://code.claude.com/docs/en/permissions#a');
    expect(a).toHaveAttribute('target', '_blank');
    expect(a).toHaveAttribute('rel', 'noopener noreferrer');
    expect(a).toHaveTextContent(UI.en.opensNewTab);
    expect(a).toHaveTextContent('Permissions');
    expect(a).not.toHaveTextContent(UI.en.englishPage);
  });
  it('uses the Japanese page in Japanese', () => {
    wrap({ slug: 'permissions' }, 'ja');
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://code.claude.com/docs/ja/permissions');
    expect(screen.getByRole('link')).toHaveTextContent(UI.ja.learnMore);
  });
  it('labels an English page shown in a Japanese UI', () => {
    wrap({ url: 'https://claude.com/blog/auto-mode', lang: 'en' }, 'ja');
    expect(screen.getByRole('link')).toHaveTextContent(UI.ja.englishPage);
  });
});
