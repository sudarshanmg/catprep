# CAT Sprint

A single-user tracker for a CAT 2026 prep sprint: **12 Aug – 4 Oct 2026** (54 days, 8 weeks). The window is the QA concept pass — every QA topic taught once — plus DILR archetype cataloguing.

It is not a todo app. The checkboxes are input; the derived metrics are the point:

- **Triage accuracy** — of the timed DILR sets, how often was the attempt/later/skip call right? Target 60%.
- **Hit rate** — how often was a set cracked inside the 12-minute cap? Target 40%.
- **Archetype coverage** — which of the 14 DILR archetypes still aren't recognisable on sight.
- **Dominant error tag** — concept / silly / selection / time. This is the headline output of the sprint and drives what the mastery pass emphasises after 4 Oct.

## Running it

```bash
npm install
npm run dev
```

No backend, no auth, no API calls. Everything persists to `localStorage` in one browser, so use **Audit → Export JSON** before clearing site data or switching devices.

## Layout

| File | What's in it |
|---|---|
| `src/seed.ts` | The fixed 54-day plan — weeks, QA topic rotation, DILR archetype allocation, weekly RC quota. Read-only. |
| `src/metrics.ts` | Every derived metric. Ratios with no denominator return `null`, never `0`. |
| `src/types.ts` | Data model and the 14-archetype enum. |
| `src/charts.tsx` | Recharts components and the validated chart palette. |
| `src/views/` | One file per tab: Today, Dashboard, Errors, Mocks, Weeks, Audit. |

## Two things worth knowing

**Phase A vs Phase B.** Weeks 1–5 name the archetypes you'll drill. From week 6 the blocks arrive unlabeled, so recognition is itself the skill under test — the logger stops pre-selecting an archetype and asks what the set turned out to be, and the week view checks the LR/DI balance of what you tagged instead of a per-archetype tally.

**Two DILR numbers that aren't the same.** The daily target (3 sets, 0 on full-mock days) sums to 138 across the sprint. The plan's archetype mix guide counts every calendar day at 3/day and so totals 162. The Week view shows both, labelled, rather than reconciling them.

## Chart colours are computed, not chosen

Mark colours come from a palette validated for lightness band, chroma floor, colour-vision-deficiency separation, normal-vision separation, and contrast against the dark surface. If you change them, re-validate rather than eyeballing — the first hand-picked triad for this app failed three of those five checks.
