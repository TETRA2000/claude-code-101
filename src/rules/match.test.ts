import { describe, expect, it } from 'vitest';
import { matchesPattern, outcomeOf, parseRule, READ_ONLY, splitCompound, type Rule } from './match';

const bash = (target: string) => ({ tool: 'Bash', target });

describe('wildcard table (F12)', () => {
  // [pattern, matches, doesn't match], one row per row of the docs' table.
  const rows: [string, string[], string[]][] = [
    ['npm run build', ['npm run build'], ['npm run build --watch']],
    ['npm run *', ['npm run build', 'npm run test --watch', 'npm run'], ['npm install']],
    ['git log * main', ['git log --oneline main', 'git log -5 main', 'git log --output=<file> main'], ['git log main', 'git push origin main']],
    ['git * main', ['git merge main', 'git push origin main', 'git -c core.fsmonitor=<script> diff main'], ['git log']],
    ['* --version', ['node --version', "bash -c 'echo hi' --version"], ['node -v']],
    ['ls *', ['ls -la', 'ls'], ['lsof']],
    ['ls*', ['ls -la', 'lsof'], []],
    ['* --help *', ['npm --help x'], ['npm --help']],
  ];
  for (const [pattern, yes, no] of rows) {
    it(`Bash(${pattern})`, () => {
      for (const s of yes) expect(matchesPattern(pattern, s), `${pattern} ~ ${s}`).toBe(true);
      for (const s of no) expect(matchesPattern(pattern, s), `${pattern} !~ ${s}`).toBe(false);
    });
  }

  it('ls:* is the same as ls *', () => {
    for (const s of ['ls -la', 'ls', 'lsof']) expect(matchesPattern('ls:*', s)).toBe(matchesPattern('ls *', s));
  });

  it('a colon before * is literal anywhere but the end', () => {
    expect(matchesPattern('git:* push', 'git status push')).toBe(false);
    expect(matchesPattern('git:* push', 'git:x push')).toBe(true);
  });

  it('stays linear with many wildcards (no backtracking blow-up)', () => {
    const pattern = Array.from({ length: 20 }, () => 'a').join('*') + 'b';
    const s = 'a'.repeat(5000);
    const t0 = performance.now();
    expect(matchesPattern(pattern, s)).toBe(false);
    expect(matchesPattern(`${'*'.repeat(20)}x`, 'y'.repeat(5000))).toBe(false);
    expect(performance.now() - t0).toBeLessThan(50);
    expect(matchesPattern(`${'*a'.repeat(20)}*`, 'a'.repeat(5000))).toBe(true);
  });

  it('treats regex characters literally', () => {
    expect(matchesPattern('echo a.b', 'echo axb')).toBe(false);
    expect(matchesPattern('echo (x)+', 'echo (x)+')).toBe(true);
  });
});

describe('compound commands (F12)', () => {
  it('splits on every separator', () => {
    expect(splitCompound('a && b || c; d | e |& f & g\nh')).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
  });
  it('keeps quoted separators', () => {
    expect(splitCompound("echo 'a && b' && ls")).toEqual(["echo 'a && b'", 'ls']);
  });
  it('an allow rule must match every part', () => {
    expect(outcomeOf([{ list: 'allow', text: 'Bash(safe-cmd *)' }], bash('safe-cmd && other-cmd'))).toBe('asks');
  });
  it('a deny on any part blocks', () => {
    expect(outcomeOf([{ list: 'deny', text: 'Bash(rm *)' }], bash('cd x && rm -rf y'))).toBe('blocked');
  });
});

describe('limits: what a Bash rule does not match (F12)', () => {
  const rules: Rule[] = [{ list: 'deny', text: 'Bash(curl *)' }];
  it('blocks the plain form', () => {
    expect(outcomeOf(rules, bash('curl https://example.com'))).toBe('blocked');
  });
  it('does not stop other ways of writing it', () => {
    expect(outcomeOf(rules, bash('/usr/bin/curl https://example.com'))).toBe('asks');
    expect(outcomeOf(rules, bash("sh -c 'curl https://example.com'"))).toBe('asks');
  });
  it('the rm and git push rows', () => {
    const rm: Rule[] = [{ list: 'deny', text: 'Bash(rm *)' }];
    expect(outcomeOf(rm, bash('rm -rf build/'))).toBe('blocked');
    expect(outcomeOf(rm, bash('/bin/rm -rf build/'))).toBe('asks');
    expect(outcomeOf(rm, bash("bash -c 'rm -rf build/'"))).toBe('asks');
    const push: Rule[] = [{ list: 'ask', text: 'Bash(git push *)' }, { list: 'allow', text: 'Bash(git *)' }];
    expect(outcomeOf(push, bash('git push origin main'))).toBe('asks');
    expect(outcomeOf(push, bash('git -C . push origin main'))).toBe('runs');
    expect(outcomeOf(push, bash("git 'push' origin main"))).toBe('runs');
    expect(outcomeOf(push, bash('git -c push.default=current push origin main'))).toBe('runs');
  });
});

describe('order: deny, then ask, then allow (F12)', () => {
  it('deny beats a narrower allow', () => {
    const rules: Rule[] = [
      { list: 'allow', text: 'Bash(aws s3 ls)' },
      { list: 'deny', text: 'Bash(aws *)' },
    ];
    expect(outcomeOf(rules, bash('aws s3 ls'))).toBe('blocked');
  });
  it('ask beats allow', () => {
    const rules: Rule[] = [
      { list: 'allow', text: 'Bash(git push origin main)' },
      { list: 'ask', text: 'Bash(git push *)' },
    ];
    expect(outcomeOf(rules, bash('git push origin main'))).toBe('asks');
  });
  it('an allow lets a matching call run', () => {
    expect(outcomeOf([{ list: 'allow', text: 'Bash(npm test)' }], bash('npm test'))).toBe('runs');
  });
  it('a bare tool name matches every use; Bash(*) equals Bash', () => {
    expect(outcomeOf([{ list: 'deny', text: 'Bash' }], bash('ls'))).toBe('blocked');
    expect(outcomeOf([{ list: 'allow', text: 'Bash(*)' }], bash('npm test && make'))).toBe('runs');
  });
});

describe('read-only commands (F14)', () => {
  it('lists the documented set', () => {
    expect(READ_ONLY).toEqual(['ls', 'cat', 'echo', 'pwd', 'head', 'tail', 'grep', 'find', 'wc', 'which', 'diff', 'stat', 'du', 'cd']);
  });
  it('runs read-only commands with no rules and asks for others', () => {
    expect(outcomeOf([], bash('ls -la'))).toBe('runs');
    expect(outcomeOf([], bash('cd src && cat a.txt'))).toBe('runs');
    expect(outcomeOf([], bash('npm test'))).toBe('asks');
    expect(outcomeOf([], bash('lsof'))).toBe('asks');
  });
  it('a deny or ask rule still applies to a read-only command', () => {
    expect(outcomeOf([{ list: 'ask', text: 'Bash(cat *)' }], bash('cat a.txt'))).toBe('asks');
    expect(outcomeOf([{ list: 'deny', text: 'Bash(cat *)' }], bash('cat a.txt'))).toBe('blocked');
  });
});

describe('other tools', () => {
  it('Read runs by default inside the folder; a Read deny blocks its path only', () => {
    const deny: Rule[] = [{ list: 'deny', text: 'Read(./.env)' }];
    expect(outcomeOf([], { tool: 'Read', target: './.env' })).toBe('runs');
    expect(outcomeOf(deny, { tool: 'Read', target: './.env' })).toBe('blocked');
    expect(outcomeOf(deny, { tool: 'Read', target: './README.md' })).toBe('runs');
    expect(outcomeOf([{ list: 'deny', text: 'Read(./.env.*)' }], { tool: 'Read', target: './.env.local' })).toBe('blocked');
  });
  it('rules for one tool never match another', () => {
    expect(outcomeOf([{ list: 'deny', text: 'Read(./.env)' }], bash('./.env'))).toBe('asks');
    expect(outcomeOf([{ list: 'allow', text: 'Bash(npm test)' }], { tool: 'Edit', target: 'npm test' })).toBe('asks');
  });
  it('WebFetch(domain:…) matches the host, case-insensitive', () => {
    const allow = (d: string): Rule[] => [{ list: 'allow', text: `WebFetch(domain:${d})` }];
    const fetch = (url: string) => ({ tool: 'WebFetch', target: url });
    expect(outcomeOf([], fetch('https://example.com/a'))).toBe('asks');
    expect(outcomeOf(allow('example.com'), fetch('https://Example.com/a'))).toBe('runs');
    expect(outcomeOf(allow('example.com'), fetch('https://docs.example.com/a'))).toBe('asks');
    expect(outcomeOf(allow('*.example.com'), fetch('https://docs.example.com/a'))).toBe('runs');
    expect(outcomeOf(allow('*.example.com'), fetch('https://example.com/a'))).toBe('asks');
    expect(outcomeOf(allow('*'), fetch('https://anything.test/'))).toBe('runs');
  });
});

describe('malformed rules (Review Focus 5)', () => {
  it('parses the documented shapes', () => {
    expect(parseRule('Bash')).toEqual({ tool: 'Bash', spec: null });
    expect(parseRule('Bash(*)')).toEqual({ tool: 'Bash', spec: null });
    expect(parseRule(' Bash(npm run *) ')).toEqual({ tool: 'Bash', spec: 'npm run *' });
    expect(parseRule('Read(./.env)')).toEqual({ tool: 'Read', spec: './.env' });
    expect(parseRule('WebFetch(domain:example.com)')).toEqual({ tool: 'WebFetch', spec: 'domain:example.com' });
  });
  it('returns null for what it does not understand', () => {
    for (const s of ['', '   ', 'Bash(', 'Bash(npm *) extra', '(x)', 'Bash()', 'Bsh(ls)', 'bash(ls)', 'WebFetch(example.com)', 'WebFetch(domain:)', 'Bash)(']) {
      expect(parseRule(s), JSON.stringify(s)).toBeNull();
    }
  });
  it('a command with an unclosed quote cannot be parsed, so it asks (F14) unless a part is denied', () => {
    expect(outcomeOf([], bash("echo 'x && rm -rf y"))).toBe('asks');
    expect(outcomeOf([{ list: 'allow', text: 'Bash(*)' }], bash('echo "x'))).toBe('asks');
    expect(outcomeOf([{ list: 'deny', text: 'Bash(echo *)' }], bash("echo 'x && rm -rf y"))).toBe('blocked');
  });
  it('a rule it cannot parse matches nothing', () => {
    expect(outcomeOf([{ list: 'deny', text: 'Bash(' }], bash('rm -rf x'))).toBe('asks');
  });
});
