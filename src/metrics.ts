import {
  ARCHETYPES,
  ERROR_TAGS,
  type Archetype,
  type DilrSetLog,
  type ErrorLogEntry,
  type ErrorTag,
  type MockResult,
  type Section,
  type Store,
} from './types';
import { PLAN, WEEKS, weekIdForDate } from './seed';

/**
 * A ratio with no denominator is `null`, never 0 — an unattempted metric must not
 * render as a failing one.
 */
export type Ratio = { value: number | null; num: number; den: number };

const ratio = (num: number, den: number): Ratio => ({
  value: den === 0 ? null : num / den,
  num,
  den,
});

export const timedOnly = (sets: DilrSetLog[]) => sets.filter((s) => s.mode === 'timed');

// ---- headline DILR metrics -------------------------------------------------

export const triageAccuracy = (sets: DilrSetLog[]): Ratio => {
  const timed = timedOnly(sets);
  return ratio(timed.filter((s) => s.triageWasCorrect).length, timed.length);
};

export const hitRate = (sets: DilrSetLog[]): Ratio => {
  const timed = timedOnly(sets);
  return ratio(timed.filter((s) => s.crackedInCap).length, timed.length);
};

// ---- date windows ---------------------------------------------------------

/** Shifts a 'YYYY-MM-DD' by n days, in UTC so it can't slip across a DST boundary. */
export function shiftDate(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** The 7-day window ending on `end`, inclusive of both ends. */
export function rolling7<T extends { date: string }>(rows: T[], end: string): T[] {
  const start = shiftDate(end, -6);
  return rows.filter((r) => r.date >= start && r.date <= end);
}

// ---- archetype coverage ---------------------------------------------------

export type ConfidenceState = 'not started' | 'exposed' | 'familiar' | 'solid';

export type Coverage = {
  archetype: Archetype;
  sets: number;
  timedSets: number;
  hitRate: Ratio;
  state: ConfidenceState;
};

/**
 * Confidence is derived, never entered:
 *   0 sets → not started · 1–3 → exposed · 4+ → familiar (<50% hit) or solid (>=50%).
 * `sets` counts every set of that archetype (learning + timed) because exposure is what
 * drives recognition; the hit rate that splits familiar from solid uses timed sets only,
 * since a learning set has no cap to be cracked within.
 */
export function confidenceState(sets: number, hr: number | null): ConfidenceState {
  if (sets === 0) return 'not started';
  if (sets <= 3) return 'exposed';
  return hr !== null && hr >= 0.5 ? 'solid' : 'familiar';
}

export function archetypeCoverage(sets: DilrSetLog[]): Coverage[] {
  return ARCHETYPES.map((a) => {
    const mine = sets.filter((s) => s.archetype === a);
    const timed = timedOnly(mine);
    const hr = ratio(timed.filter((s) => s.crackedInCap).length, timed.length);
    return {
      archetype: a,
      sets: mine.length,
      timedSets: timed.length,
      hitRate: hr,
      state: confidenceState(mine.length, hr.value),
    };
  });
}

/** Weakest first: fewest sets, then lowest hit rate. Drives Week 5's mixed review. */
export function weakestArchetypes(sets: DilrSetLog[], n = 5): Coverage[] {
  return [...archetypeCoverage(sets)]
    .sort((a, b) => a.sets - b.sets || (a.hitRate.value ?? 0) - (b.hitRate.value ?? 0))
    .slice(0, n);
}

// ---- error tags ----------------------------------------------------------

export type TagCounts = Record<ErrorTag, number>;

export const emptyTagCounts = (): TagCounts => ({
  concept: 0,
  silly: 0,
  selection: 0,
  time: 0,
});

export function tagCounts(errors: ErrorLogEntry[]): TagCounts {
  const c = emptyTagCounts();
  for (const e of errors) c[e.tag] += 1;
  return c;
}

/** Mode of the tag distribution. Ties return every tied tag, so we never fake a winner. */
export function dominantErrorTag(errors: ErrorLogEntry[]): {
  tags: ErrorTag[];
  count: number;
} {
  const c = tagCounts(errors);
  const max = Math.max(...ERROR_TAGS.map((t) => c[t]));
  if (max === 0) return { tags: [], count: 0 };
  return { tags: ERROR_TAGS.filter((t) => c[t] === max), count: max };
}

// ---- QA progress --------------------------------------------------------

/**
 * `upTo` stops the denominator at the current date so early in the sprint the number
 * reflects days that have actually happened, not the whole month.
 */
export function qaProgress(store: Store, upTo?: string): Ratio {
  const days = upTo ? PLAN.filter((d) => d.date <= upTo) : PLAN;
  const target = days.reduce((s, d) => s + d.qaProblemTarget, 0);
  const solved = days.reduce((s, d) => s + (store.dayLogs[d.date]?.qaProblemsSolved ?? 0), 0);
  return ratio(solved, target);
}

// ---- per-week rollups (chart series) ------------------------------------

export type WeekRow = {
  weekId: number;
  label: string;
  triage: Ratio;
  hit: Ratio;
  tags: TagCounts;
  timedSets: number;
  totalSets: number;
};

export function weekRows(store: Store): WeekRow[] {
  return WEEKS.map((w) => {
    const sets = store.dilrSets.filter((s) => s.date >= w.start && s.date <= w.end);
    const errs = store.errors.filter((e) => e.date >= w.start && e.date <= w.end);
    return {
      weekId: w.id,
      label: `W${w.id}`,
      triage: triageAccuracy(sets),
      hit: hitRate(sets),
      tags: tagCounts(errs),
      timedSets: timedOnly(sets).length,
      totalSets: sets.length,
    };
  });
}

/** Weeks that have at least one timed set — chart lines should not plot empty future weeks. */
export const weeksWithData = (rows: WeekRow[]) => rows.filter((r) => r.timedSets > 0);

// ---- streaks & totals ---------------------------------------------------

/**
 * A day counts as "touched" if anything was logged against it. Counted backwards from
 * `upTo`; days before the sprint start end the streak.
 */
export function currentStreak(store: Store, upTo: string): number {
  let streak = 0;
  let d = upTo;
  const first = PLAN[0]?.date ?? upTo;
  while (d >= first) {
    const log = store.dayLogs[d];
    const touched =
      (log &&
        (log.qaConceptDone ||
          log.qaProblemsSolved > 0 ||
          log.varcDone ||
          log.readingDone ||
          log.formulaSheetUpdated)) ||
      store.dilrSets.some((s) => s.date === d) ||
      store.mocks.some((m) => m.date === d);
    if (!touched) break;
    streak += 1;
    d = shiftDate(d, -1);
  }
  return streak;
}

// ---- mocks -------------------------------------------------------------

export const mocksByDate = (mocks: MockResult[]) =>
  [...mocks].sort((a, b) => a.date.localeCompare(b.date));

export const unanalysedMocks = (mocks: MockResult[]) => mocks.filter((m) => !m.analysisDone);

export const sectionKey = (s: Section): 'qa' | 'dilr' | 'varc' =>
  s === 'QA' ? 'qa' : s === 'DILR' ? 'dilr' : 'varc';

// ---- misc --------------------------------------------------------------

export const pct = (r: Ratio | number | null, digits = 0): string => {
  const v = typeof r === 'number' || r === null ? r : r.value;
  return v === null ? '—' : `${(v * 100).toFixed(digits)}%`;
};

export const setsLoggedOn = (store: Store, date: string) =>
  store.dilrSets.filter((s) => s.date === date).length;

/** Week-level DILR set counts actually logged, by archetype. */
export function loggedByArchetype(
  sets: DilrSetLog[],
): Partial<Record<Archetype, number>> {
  const out: Partial<Record<Archetype, number>> = {};
  for (const s of sets) out[s.archetype] = (out[s.archetype] ?? 0) + 1;
  return out;
}

export const weekIdOf = weekIdForDate;
