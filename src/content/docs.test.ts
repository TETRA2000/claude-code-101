import { describe, expect, it } from 'vitest';
import { DOC_SLUGS, docHref, JA_MISSING, LINK_HOSTS } from './docs';

describe('docHref', () => {
  it('builds a Japanese href with the anchor', () => {
    expect(docHref({ slug: 'permissions', anchor: 'manage-permissions' }, 'ja')).toEqual({
      href: 'https://code.claude.com/docs/ja/permissions#manage-permissions',
      lang: 'ja',
    });
  });
  it('builds an English href without an anchor', () => {
    expect(docHref({ slug: 'plugins/install' }, 'en')).toEqual({
      href: 'https://code.claude.com/docs/en/plugins/install',
      lang: 'en',
    });
  });
  it('falls back to English for a slug missing in Japanese', () => {
    expect(docHref({ slug: 'permissions', anchor: 'x' }, 'ja', ['permissions'])).toEqual({
      href: 'https://code.claude.com/docs/en/permissions#x',
      lang: 'en',
    });
  });
  it('returns a full url unchanged, with its own language', () => {
    expect(docHref({ url: 'https://claude.com/blog/auto-mode', lang: 'en' }, 'ja')).toEqual({
      href: 'https://claude.com/blog/auto-mode',
      lang: 'en',
    });
  });
});

describe('constants', () => {
  it('lists the spec slugs and the five link hosts', () => {
    for (const s of ['overview', 'tools-reference', 'interactive-mode', 'desktop-quickstart', 'checkpointing', 'sessions', 'plugins/install', 'plugins/security']) {
      expect(DOC_SLUGS).toContain(s);
    }
    expect(new Set(DOC_SLUGS).size).toBe(DOC_SLUGS.length);
    expect(JA_MISSING).toEqual([]);
    expect(LINK_HOSTS).toEqual(['support.claude.com', 'claude.com', 'www.anthropic.com', 'trust.anthropic.com', 'github.com']);
  });
});
