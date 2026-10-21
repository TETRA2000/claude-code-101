# Claude Code 101

A bilingual (English/Japanese) Vite + React + TypeScript course app that teaches Claude Code through short Learn cards and Duolingo-style practice. It runs entirely in the browser with no real AI and no command execution. The full design is in `docs/superpowers/specs/2026-10-21-claude-code-101-design.md`.

## Global Constraints

- Every learner-facing string is a `Localized` (`{ en: string; ja: string }`), and both values are non-empty. English is written first. Japanese is a full, natural translation, with no review step.
- Commands, file paths, code, URLs, tool names and terminal output are never translated. They live in plain `string` fields.
- UI strings live in `src/i18n/ui.ts`, typed so a missing Japanese key fails `tsc`. Components never hard-code learner-facing text. Lesson text lives only in `content/*.json`.
- Language default: the stored choice, else `ja` if the browser's first language starts with `ja`, else `en`. Keep `<html lang>` in sync.
- No real AI, no command execution, no network requests except loading the site and Google Fonts (Bricolage Grotesque, DM Sans, JetBrains Mono, Noto Sans JP).
- Content safety:
  - Fake secrets contain `FAKE`.
  - URLs use reserved hosts (`*.example`, `example.com|net|org` and subdomains, `*.test`, `*.invalid`, `localhost`) or the real-host allowlist in `src/content/hosts.ts`.
  - There are no copy buttons anywhere.
- Rules: `HEARTS_PER_RUN = 5`, `XP_FIRST_TRY = 10`, `XP_RETRY = 5`, `XP_HINT_COST = 5` (taken off that item's award, never below 0), `ACTIVATION_GUARD_MS = 350`.
- Ready units have 3–5 Learn cards and 8–12 practice items. Every ready unit has `lastChecked` (`YYYY-MM-DD`) and at least one source URL.
- Design tokens are copied from cascade-learn's `src/styles/tokens.css`. Accessibility:
  - real `<button>`s, `aria-pressed` on selectable tiles, `aria-live` feedback, `role="progressbar"` with values;
  - targets ≥44px, contrast ≥4.5:1;
  - right/wrong shown with icon and text, not color alone;
  - `prefers-reduced-motion` respected.
- Laptop first, but no horizontal page scroll at 390px width. Long commands and URLs wrap (`overflow-wrap: anywhere`).
- Each item says which app it shows: `surface: 'terminal' | 'desktop'`. Unit 3 recommends the default "ask before acting" mode. Turning permissions off is always wrong in setup items.

## Adding a unit

Write `content/units/<key>.json`, set the unit's `status` to `ready` in `content/course.json`, run `npm test`.
