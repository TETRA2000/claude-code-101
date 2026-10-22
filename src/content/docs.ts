import type { Lang } from '../i18n/lang';
import type { DocRef } from './types';

/** Doc pages (under code.claude.com/docs/<lang>/) that content may link to. Verified in en and ja on 2026-10-21. */
export const DOC_SLUGS: readonly string[] = [
  'overview',
  'claude-directory',
  'how-claude-code-works',
  'context-window',
  'memory',
  'features-overview',
  'checkpointing',
  'sessions',
  'permissions',
  'permission-modes',
  'security',
  'desktop',
  'desktop-quickstart',
  'tools-reference',
  'interactive-mode',
  'mcp',
  'mcp-quickstart',
  'chrome',
  'computer-use',
  'settings',
  'settings-reference',
  'sandboxing',
  'sandbox-environments',
  'devcontainer',
  'claude-code-on-the-web',
  'env-vars',
  'skills',
  'plugins/install',
  'plugins/security',
  'sub-agents',
  'hooks-guide',
  'hooks',
  'auto-mode-config',
];

/** Slugs with no Japanese page. All spec slugs had one on 2026-10-21. */
export const JA_MISSING: readonly string[] = [];

/** Hosts other than code.claude.com that links may point to (github.com only under /anthropics/). */
export const LINK_HOSTS: readonly string[] = [
  'support.claude.com',
  'claude.com',
  'www.anthropic.com',
  'trust.anthropic.com',
  'github.com',
];

export const DOCS_ORIGIN = 'https://code.claude.com/docs';

/** The URL to open for `ref` in `lang`, and the language of the page it opens. */
export function docHref(ref: DocRef, lang: Lang, missing: readonly string[] = JA_MISSING): { href: string; lang: Lang } {
  if ('url' in ref) return { href: ref.url, lang: ref.lang };
  const pageLang: Lang = lang === 'ja' && missing.includes(ref.slug) ? 'en' : lang;
  const hash = ref.anchor ? `#${ref.anchor}` : '';
  return { href: `${DOCS_ORIGIN}/${pageLang}/${ref.slug}${hash}`, lang: pageLang };
}
