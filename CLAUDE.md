# CAT Prep Tracker

A single-user web app to track a CAT 2026 preparation sprint: **Aug 12 – Oct 4, 2026** (54 days, 8 weeks). This window is the **QA concept pass** — every QA topic taught once with ~20 problems of contact — plus DILR archetype cataloguing.

## Purpose

This is **not** a generic todo app. It tracks a specific exam-prep plan where the *derived metrics matter more than the checkboxes*. The user can already tell whether they studied; what they can't easily see is whether their **triage accuracy** is improving, which **DILR archetypes** they still can't recognise, and which **error tag** dominates their mistakes. Those three answers drive what they study next month. Build for that.

## Tech stack

- **React + TypeScript + Vite**
- **Tailwind CSS** for styling
- **localStorage** for persistence (single user, single device, no auth, no backend)
- **Recharts** for the metrics charts
- No router needed if you use tab-based navigation; if you add one, use `react-router-dom`

Keep it a small number of files. No server, no database, no API calls.

## Data model

```ts
type Section = 'QA' | 'DILR' | 'VARC';
type ErrorTag = 'concept' | 'silly' | 'selection' | 'time';
type SetMode = 'learning' | 'timed';
type TriageCall = 'attempt' | 'later' | 'skip';

// ---- Static plan (seeded, read-only) ----
type DayPlan = {
  date: string;              // 'YYYY-MM-DD'
  weekId: number;            // 1..8
  qaTopics: string[];
  qaProblemTarget: number;   // per-day
  dilrSetTarget: number;     // 3 on normal days, 0 on mock days
  varcTask: string;
  dayType: 'study' | 'sectional' | 'fullmock';
};

// ---- User-entered logs ----
type DayLog = {
  date: string;
  qaConceptDone: boolean;
  qaProblemsSolved: number;
  varcDone: boolean;
  readingDone: boolean;
  formulaSheetUpdated: boolean;
  notes?: string;
};

type DilrSetLog = {
  id: string;
  date: string;
  archetype: Archetype;
  mode: SetMode;
  // timed sets only:
  triageCall?: TriageCall;
  triageWasCorrect?: boolean;   // did the call turn out right?
  crackedInCap?: boolean;       // solved correctly within the cap?
  minutesSpent: number;
  scaffoldUsed?: string;        // 'grid' | 'table' | 'timeline' | 'network' | 'venn' | free text
  stallPoint?: string;          // where it broke down
};

type ErrorLogEntry = {
  id: string;
  date: string;
  section: Section;
  topic: string;
  tag: ErrorTag;
  note?: string;
};

type SectionScore = { attempted: number; correct: number; incorrect: number; score: number };

type MockResult = {
  id: string;
  date: string;
  kind: 'full' | 'sectional';
  name?: string;
  varc?: SectionScore;
  dilr?: SectionScore;
  qa?: SectionScore;
  overallPercentile?: number;
  analysisDone: boolean;   // was the 3h analysis actually done?
};
```

### The 14 DILR archetypes (fixed enum)

```ts
type Archetype =
  // Logical Reasoning (9)
  | 'Mathematical Reasoning' | 'Set Theory' | 'Games & Tournaments'
  | 'Group & Arrangements' | 'Sitting Arrangements' | 'Puzzles'
  | 'Order & Ranking' | 'Analytical Reasoning' | 'Binary & Conditional Logic'
  // Data Interpretation (5)
  | 'Line & Bar Charts' | 'Pie Charts' | 'Data Tabulation'
  | 'Caselets' | 'Logic Based DI';
```

## Seed data — the plan

Covers **Aug 12 – Oct 4**, the QA concept pass. Timed-set cap throughout: **12 minutes**. Targets: **40% hit rate, 60% triage accuracy**.

> **Already covered before Aug 12 (do not seed):** Percentages, Ratio & Proportion.

QA weighting drives the sequence — Arithmetic is ~40% of the section, Algebra ~28%, Geometry ~15%, Number System ~10%, Modern Math ~7%. Arithmetic is therefore front-loaded.

### Week 1 — Aug 12–16 (5 days)
- **QA:** Profit/Loss/Discount, Simple Interest, Compound Interest — ~10 problems/day
- **DILR (15 sets):** Sitting Arrangements ×6, Group & Arrangements ×5, Line & Bar Charts ×4
- **VARC:** 3 RC passages + daily reading
- Aug 15 = sectional pair · Aug 16 = **Full Mock 1**

### Week 2 — Aug 17–23
- **QA:** Averages, Mixtures & Alligation, Time & Work, Pipes & Cisterns — ~10/day
- **DILR (21 sets):** Order & Ranking ×6, Binary & Conditional Logic ×8, Data Tabulation ×7
- **VARC:** 4 RC + introduce para-summary, odd-one-out
- Aug 22 = sectional pair · Aug 23 = **Full Mock 2**

### Week 3 — Aug 24–30
- **QA:** Time-Speed-Distance, Boats & Streams, Trains, Clocks & Calendars — ~10/day
  *(Densest arithmetic topic; gets a full week. Drop Clocks & Calendars first if the week runs tight.)*
- **DILR (21 sets):** Puzzles ×7, Analytical Reasoning ×7, Caselets ×7
- **VARC:** 4 RC + para-jumbles
- Aug 28 = **consolidation** (cold formula-sheet review)
- Aug 29 = sectional pair · Aug 30 = **Full Mock 3**

### Week 4 — Aug 31 – Sep 6
- **QA:** Linear Equations, Quadratic Equations, Inequalities & Absolute Value — ~10/day
- **DILR (21 sets):** Games & Tournaments ×7, Mathematical Reasoning ×7, Logic Based DI ×7
- **VARC:** 4 RC + mixed non-RC
- Sep 5 = sectional pair · Sep 6 = **Full Mock 4**

### Week 5 — Sep 7–13
- **QA:** Functions & Graphs, Logarithms & Exponents, Progressions & Series — ~10/day
- **DILR (21 sets):** Set Theory ×5, Pie Charts ×4, Mixed review ×12 (weakest archetypes)
- **VARC:** 4 RC + full non-RC mix
- Sep 12 = sectional pair · Sep 13 = **Full Mock 5**

### Week 6 — Sep 14–20
- **QA:** Number System — Divisibility & Factors, HCF/LCM, Remainders, Unit & Tens Digit, Bases — ~8/day
- **DILR (21 sets):** mixed unlabeled blocks (75% LR / 25% DI) — **Phase B begins**
- **VARC:** 4 RC + non-RC mix
- Sep 19 = sectional pair · Sep 20 = **Full Mock 6**

### Week 7 — Sep 21–27
- **QA:** Geometry, Mensuration, Coordinate Geometry — ~10/day
- **DILR (21 sets):** mixed unlabeled blocks
- **VARC:** 4 RC + non-RC mix
- Sep 26 = sectional pair · Sep 27 = **Full Mock 7**

### Week 8 — Sep 28 – Oct 4
- **QA:** Permutations & Combinations, Probability, Set Theory — ~10/day
  **QA concept pass complete Oct 4.**
- **DILR (21 sets):** mixed unlabeled blocks
- **VARC:** 4 RC + non-RC mix
- Oct 3 = sectional pair · Oct 4 = **Full Mock 8**
- **Month-end audit due Oct 4**

> **After Oct 4:** Saturdays upgrade from sectional pairs to full mocks (2/week from Oct 10/11). QA shifts from concept pass to mastery pass — no new topics, difficulty rises, allocation follows the error log.

## Features, in build order

### 1. Today view (the default screen)
Shows today's plan and its checkboxes. Must be usable in under 60 seconds at 22:30 when the user is tired.
- Today's QA topics + problem counter (increment/decrement)
- DILR: "2 of 3 sets logged" + a prominent **Log a set** button
- VARC + reading + formula sheet toggles
- On mock days, replace the study checklist with a **Log mock result** form

### 2. DILR set logger
The most important input form. Optimise it hard — it's used 3×/day.
- Archetype (dropdown, 14 options)
- Mode: learning / timed
- If **timed**: triage call (attempt/later/skip) → minutes → cracked? → was the triage call correct?
- Scaffold used, stall point (both optional, free text)
- Should take under 20 seconds to fill

### 3. Metrics dashboard
The reason the app exists. Four panels:
- **Triage accuracy** — rolling % over timed sets, line chart by week, with a 60% target line
- **Hit rate** — % of timed sets cracked within cap, same treatment, 40% target line
- **Archetype coverage** — 14-cell grid. Each cell shows sets done and a confidence state derived from hit rate on that archetype: `not started` / `exposed` (1–3 sets) / `familiar` (4+ sets, <50% hit) / `solid` (4+ sets, ≥50% hit). This directly answers "which archetypes can't I recognise yet?"
- **Error tag distribution** — stacked bar by week across concept/silly/selection/time. The dominant tag is the headline output of the whole month.

### 4. Error log
Quick-add form + filterable list (by section, tag, week). Nothing fancy.

### 5. Mock tracker
- Entry form per section: attempted / correct / incorrect → auto-compute score (+3 correct, −1 incorrect)
- Table of all mocks + a line chart of section scores over time
- Flag prominently if `analysisDone` is false — an unanalysed mock is a wasted mock

### 6. Week view
Grid of the 8 weeks × their targets vs actuals. Lets the user see if they're drifting.

## Derived metrics — implement exactly

```
triageAccuracy = timedSets.filter(s => s.triageWasCorrect).length / timedSets.length
hitRate        = timedSets.filter(s => s.crackedInCap).length / timedSets.length
archetypeCoverage[a] = { sets: count(a), hitRate: hitRate within a }
dominantErrorTag = mode of errorLog.tag, computed per week and overall
qaProgress = sum(qaProblemsSolved) / sum(qaProblemTarget)
```

Show rolling 7-day values alongside all-time so improvement is visible.

## Design notes

- **Dark by default.** Used at 5am and 10pm.
- Mobile-first layout — it will be used on a phone as often as a laptop.
- Big tap targets on the logging forms.
- Show streaks and totals, but never gamify with guilt. If a day is missed, show it neutrally.
- The Today view should never require scrolling to reach the primary actions.

### Visual system — "Spider-Verse HUD"

Two sources, fused. Tokens live in `src/index.css`; primitives in `src/ui.tsx`.

- **Structure** is copied from the user's quickshell shell (`~/.config/quickshell`): every
  surface is framed by a lit hairline along one edge plus two L-shaped corner brackets
  (`.brackets`), corners are hard (radius is not part of this system), bloom is a stacked
  box-shadow rather than a blur (`.glow`, mirroring `components/Glow.qml`), and every live
  value is mono — JetBrains Mono, the shell's own font.
- **Hue** comes from the *Into the Spider-Verse* leap-of-faith frame: violet-black ground
  (`--color-ink` #0A0716), cyan primary (`--color-neon`), hot magenta accent
  (`--color-hot`, used for the brackets). Spider red is reserved for `--color-critical`
  and never appears as a data mark.
- **Art** (`public/`, downscaled from `~/.config/backgrounds`): `ground.jpg` from sp6 sits
  fixed behind everything at low contrast under a Ben-Day halftone; `mask.jpg` from sp1
  shows through empty states only, screened so its black drops out. Panels stay opaque —
  the data never competes with the art. `<html>` must not carry a background, or it paints
  over the negative-z-index ground layers.
- Chart slots (`charts.tsx`): QA magenta, DILR cyan, VARC lime, error tag `time` violet.
  Same constraints as before — one lightness band, wide hue steps for CVD.

## Non-goals

- No auth, no multi-user, no cloud sync
- No study-material content, no question bank — this tracks activity only
- No notifications or reminders (Google Calendar already handles scheduling)
- Don't build a generic habit tracker; the plan is fixed and hardcoded as seed data

## Nice-to-have (only after the above works)

- Export all logs as JSON (backup) and import back
- Month-end audit view that answers the five audit questions automatically:
  1. QA topics drilled vs read
  2. Archetypes recognisable (from coverage grid)
  3. Triage accuracy vs 60% target
  4. Hit rate vs 40% target
  5. Dominant error tag → recommended October emphasis