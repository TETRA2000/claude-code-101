/** Real services that may appear as a destination in lesson content. Nothing is ever contacted. */
export const REAL_HOSTS: readonly string[] = [
  'paste.rs',
  'pastebin.com',
  'gist.github.com',
  'github.com',
  'raw.githubusercontent.com',
  'registry.npmjs.org',
  'www.npmjs.com',
  'npmjs.com',
  'code.claude.com',
  'docs.claude.com',
  'docs.anthropic.com',
  'www.anthropic.com',
  'claude.ai',
];

const RESERVED_SUFFIXES = ['.example', '.test', '.invalid', '.localhost'];
const RESERVED_DOMAINS = ['example', 'example.com', 'example.net', 'example.org', 'localhost'];

/** Reserved for documentation/testing (RFC 2606/6761): `*.example`, `example.com|net|org` and subdomains, `*.test`, `*.invalid`, `localhost`. */
export function isReservedHost(h: string): boolean {
  const host = h.toLowerCase().replace(/\.$/, '');
  if (RESERVED_DOMAINS.includes(host)) return true;
  if (RESERVED_DOMAINS.some((d) => host.endsWith('.' + d))) return true;
  return RESERVED_SUFFIXES.some((s) => host.endsWith(s));
}
