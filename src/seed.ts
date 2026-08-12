import type { Archetype, DayPlan } from './types';

/**
 * The plan is fixed seed data. Nothing here is user-editable.
 *
 * The window (12 Aug – 4 Oct, 54 days, 8 weeks) is the **QA concept pass**: every QA topic
 * taught once, with roughly 20 problems of contact, alongside DILR archetype cataloguing.
 *
 * Two different DILR numbers live in this file and they are not the same thing:
 *  - `dilrSetTarget` is the *daily* checklist target (3 on normal days, 0 on full-mock
 *    days, per spec). Summed over the sprint that is 138 sets.
 *  - the week's allocation (`archetypeAllocation` + `mixedSets`) is the *mix guide* — which
 *    archetypes to draw those sets from. It counts every calendar day at 3/day, so it totals
 *    162 and runs ahead of the daily targets on weeks containing a full mock.
 * The Week view shows both, labelled, rather than silently reconciling them.
 */

/** QA areas, with their share of the section — this is what drove the topic sequence. */
export const QA_AREAS = ['Arithmetic', 'Algebra', 'Number System', 'Geometry', 'Modern Math'] as const;
export type QaArea = (typeof QA_AREAS)[number];

export const QA_AREA_WEIGHT: Record<QaArea, number> = {
  Arithmetic: 0.4,
  Algebra: 0.28,
  Geometry: 0.15,
  'Number System': 0.1,
  'Modern Math': 0.07,
};

/** Covered before the sprint opened; deliberately not seeded. */
export const PRE_COVERED_QA_TOPICS = ['Percentages', 'Ratio & Proportion'];

/**
 * Phase A catalogues archetypes by name — you know what kind of set you're sitting down to.
 * Phase B (from week 6) serves mixed unlabeled blocks, so recognition itself is the skill
 * being tested and the archetype is something you tag afterwards.
 */
export type Phase = 'A' | 'B';

export type WeekSpec = {
  id: number;
  label: string;
  start: string;
  end: string;
  phase: Phase;
  qaArea: QaArea;
  qaTheme: string;
  qaTopics: string[];
  qaPerDay: number;
  /** RC passages for the whole week, spread across the week's non-mock days. */
  rcPassages: number;
  /** Non-RC drills this week introduces; they fill the days that carry no RC passage. */
  nonRcTasks: string[];
  archetypeAllocation: Partial<Record<Archetype, number>>;
  /** Sets not tied to a named archetype — mixed review, or Phase B's unlabeled blocks. */
  mixedSets?: number;
  mixedLabel?: string;
  /** Target share of LR vs DI within this week's mixed blocks, where the plan states one. */
  lrShare?: number;
  /** Plan guidance worth surfacing in the Week view. */
  note?: string;
  sectionalDates: string[];
  fullMockDates: string[];
  consolidationDates?: string[];
};

export const WEEKS: WeekSpec[] = [
  {
    id: 1,
    label: 'Week 1',
    start: '2026-08-12',
    end: '2026-08-16',
    phase: 'A',
    qaArea: 'Arithmetic',
    qaTheme: 'Commercial arithmetic',
    qaTopics: ['Profit, Loss & Discount', 'Simple Interest', 'Compound Interest'],
    qaPerDay: 10,
    rcPassages: 3,
    nonRcTasks: [],
    archetypeAllocation: {
      'Sitting Arrangements': 6,
      'Group & Arrangements': 5,
      'Line & Bar Charts': 4,
    },
    sectionalDates: ['2026-08-15'],
    fullMockDates: ['2026-08-16'],
  },
  {
    id: 2,
    label: 'Week 2',
    start: '2026-08-17',
    end: '2026-08-23',
    phase: 'A',
    qaArea: 'Arithmetic',
    qaTheme: 'Averages & work',
    qaTopics: ['Averages', 'Mixtures & Alligation', 'Time & Work', 'Pipes & Cisterns'],
    qaPerDay: 10,
    rcPassages: 4,
    nonRcTasks: ['Para-summary drill', 'Odd-one-out drill'],
    archetypeAllocation: {
      'Order & Ranking': 6,
      'Binary & Conditional Logic': 8,
      'Data Tabulation': 7,
    },
    sectionalDates: ['2026-08-22'],
    fullMockDates: ['2026-08-23'],
  },
  {
    id: 3,
    label: 'Week 3',
    start: '2026-08-24',
    end: '2026-08-30',
    phase: 'A',
    qaArea: 'Arithmetic',
    qaTheme: 'Motion',
    qaTopics: ['Time, Speed & Distance', 'Boats & Streams', 'Trains', 'Clocks & Calendars'],
    qaPerDay: 10,
    rcPassages: 4,
    nonRcTasks: ['Para-jumbles drill'],
    archetypeAllocation: {
      Puzzles: 7,
      'Analytical Reasoning': 7,
      Caselets: 7,
    },
    note: 'Densest arithmetic topic, so it gets a full week. If the week runs tight, drop Clocks & Calendars first.',
    sectionalDates: ['2026-08-29'],
    fullMockDates: ['2026-08-30'],
    consolidationDates: ['2026-08-28'],
  },
  {
    id: 4,
    label: 'Week 4',
    start: '2026-08-31',
    end: '2026-09-06',
    phase: 'A',
    qaArea: 'Algebra',
    qaTheme: 'Equations',
    qaTopics: ['Linear Equations', 'Quadratic Equations', 'Inequalities & Absolute Value'],
    qaPerDay: 10,
    rcPassages: 4,
    nonRcTasks: ['Mixed non-RC set'],
    archetypeAllocation: {
      'Games & Tournaments': 7,
      'Mathematical Reasoning': 7,
      'Logic Based DI': 7,
    },
    sectionalDates: ['2026-09-05'],
    fullMockDates: ['2026-09-06'],
  },
  {
    id: 5,
    label: 'Week 5',
    start: '2026-09-07',
    end: '2026-09-13',
    phase: 'A',
    qaArea: 'Algebra',
    qaTheme: 'Functions & series',
    qaTopics: ['Functions & Graphs', 'Logarithms & Exponents', 'Progressions & Series'],
    qaPerDay: 10,
    rcPassages: 4,
    nonRcTasks: ['Full non-RC mix — para-jumbles, summary, odd-one-out'],
    archetypeAllocation: {
      'Set Theory': 5,
      'Pie Charts': 4,
    },
    mixedSets: 12,
    mixedLabel: 'Mixed review — weakest archetypes',
    note: 'Last week of named archetypes. The 12 mixed sets should go to whatever the coverage grid says is weakest.',
    sectionalDates: ['2026-09-12'],
    fullMockDates: ['2026-09-13'],
  },
  {
    id: 6,
    label: 'Week 6',
    start: '2026-09-14',
    end: '2026-09-20',
    phase: 'B',
    qaArea: 'Number System',
    qaTheme: 'Number System',
    qaTopics: [
      'Divisibility & Factors',
      'HCF / LCM',
      'Remainders',
      'Unit & Tens Digit',
      'Bases',
    ],
    qaPerDay: 8,
    rcPassages: 4,
    nonRcTasks: ['Non-RC mix'],
    archetypeAllocation: {},
    mixedSets: 21,
    mixedLabel: 'Mixed unlabeled blocks',
    lrShare: 0.75,
    note: 'Phase B begins — blocks arrive unlabeled, so recognition is the skill under test. Aim 75% LR / 25% DI. Tag each set with what it turned out to be.',
    sectionalDates: ['2026-09-19'],
    fullMockDates: ['2026-09-20'],
  },
  {
    id: 7,
    label: 'Week 7',
    start: '2026-09-21',
    end: '2026-09-27',
    phase: 'B',
    qaArea: 'Geometry',
    qaTheme: 'Geometry',
    qaTopics: ['Geometry', 'Mensuration', 'Coordinate Geometry'],
    qaPerDay: 10,
    rcPassages: 4,
    nonRcTasks: ['Non-RC mix'],
    archetypeAllocation: {},
    mixedSets: 21,
    mixedLabel: 'Mixed unlabeled blocks',
    lrShare: 0.75,
    sectionalDates: ['2026-09-26'],
    fullMockDates: ['2026-09-27'],
  },
  {
    id: 8,
    label: 'Week 8',
    start: '2026-09-28',
    end: '2026-10-04',
    phase: 'B',
    qaArea: 'Modern Math',
    qaTheme: 'Modern Math',
    qaTopics: ['Permutations & Combinations', 'Probability', 'Set Theory'],
    qaPerDay: 10,
    rcPassages: 4,
    nonRcTasks: ['Non-RC mix'],
    archetypeAllocation: {},
    mixedSets: 21,
    mixedLabel: 'Mixed unlabeled blocks',
    lrShare: 0.75,
    note: 'QA concept pass completes 4 Oct. Month-end audit is due the same day.',
    sectionalDates: ['2026-10-03'],
    fullMockDates: ['2026-10-04'],
  },
];

export const SPRINT_START = '2026-08-12';
export const SPRINT_END = '2026-10-04';

/** Sprint length in days; also the denominator in "day N of 54". */
export const SPRINT_DAYS = 54;

/** Inclusive list of 'YYYY-MM-DD' between two dates, using UTC to dodge DST drift. */
function dateRange(start: string, end: string): string[] {
  const out: string[] = [];
  const cur = new Date(start + 'T00:00:00Z');
  const last = new Date(end + 'T00:00:00Z');
  while (cur <= last) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setUTCDate(cur.getUTCDate() + 1);
  }
  return out;
}

/**
 * Spreads `count` RC passages evenly over `n` candidate days and returns the chosen
 * indices. Even spacing beats front-loading so the week doesn't open with every passage
 * and close with none.
 */
function spreadIndices(n: number, count: number): Set<number> {
  const picked = new Set<number>();
  if (n <= 0 || count <= 0) return picked;
  if (count >= n) {
    for (let i = 0; i < n; i++) picked.add(i);
    return picked;
  }
  for (let k = 0; k < count; k++) {
    picked.add(Math.min(n - 1, Math.round(((k + 0.5) * n) / count - 0.5)));
  }
  return picked;
}

function buildPlan(): DayPlan[] {
  const plan: DayPlan[] = [];
  for (const w of WEEKS) {
    const days = dateRange(w.start, w.end);

    // RC passages are a weekly quota. Candidates exclude the full mock (that day's VARC
    // slot is the analysis) and the cold-review day (reading only), then the quota is
    // spread across what's left.
    const rcCandidates = days.filter(
      (d) => !w.fullMockDates.includes(d) && !(w.consolidationDates?.includes(d) ?? false),
    );
    const rcPicks = spreadIndices(rcCandidates.length, w.rcPassages);
    const rcDates = new Set([...rcPicks].map((i) => rcCandidates[i]));

    // Topic rotation walks only the days that actually drill QA, so no topic is
    // "used up" by a mock day.
    let topicCursor = 0;
    let nonRcCursor = 0;
    for (const date of days) {
      const isMock = w.fullMockDates.includes(date);
      const isSectional = w.sectionalDates.includes(date);
      const isConsolidation = w.consolidationDates?.includes(date) ?? false;

      const dayType: DayPlan['dayType'] = isMock
        ? 'fullmock'
        : isSectional
          ? 'sectional'
          : 'study';

      let qaTopics: string[];
      let qaProblemTarget: number;
      if (isMock) {
        qaTopics = [];
        qaProblemTarget = 0;
      } else if (isConsolidation) {
        qaTopics = [`Cold formula-sheet review — Weeks 1–${w.id}`];
        qaProblemTarget = 0;
      } else {
        qaTopics = [w.qaTopics[topicCursor % w.qaTopics.length]];
        topicCursor += 1;
        qaProblemTarget = w.qaPerDay;
      }

      let varcTask: string;
      let varcKind: DayPlan['varcKind'];
      if (isMock) {
        varcTask = 'Mock analysis — VARC section review';
        varcKind = 'mock-analysis';
      } else if (isConsolidation) {
        varcTask = 'Reading only — cold-review day';
        varcKind = 'reading';
      } else if (rcDates.has(date)) {
        varcTask = `1 RC passage — ${w.rcPassages} this week`;
        varcKind = 'rc';
      } else if (w.nonRcTasks.length > 0) {
        varcTask = w.nonRcTasks[nonRcCursor % w.nonRcTasks.length];
        nonRcCursor += 1;
        varcKind = 'non-rc';
      } else {
        // Week 1 has no non-RC work yet, so a non-RC day is reading and nothing else.
        varcTask = 'Reading only — no RC today';
        varcKind = 'reading';
      }

      plan.push({
        date,
        weekId: w.id,
        qaTopics,
        qaProblemTarget,
        dilrSetTarget: isMock ? 0 : 3,
        varcTask,
        varcKind,
        dayType,
        ...(isConsolidation ? { consolidation: true } : {}),
      });
    }
  }
  return plan;
}

export const PLAN: DayPlan[] = buildPlan();

export const PLAN_BY_DATE: Record<string, DayPlan> = Object.fromEntries(
  PLAN.map((d) => [d.date, d]),
);

export const PLAN_DATES: string[] = PLAN.map((d) => d.date);

/** 1-based position in the sprint, or 0 if the date is off-plan. */
export const dayNumber = (date: string): number => PLAN_DATES.indexOf(date) + 1;

export const weekForDate = (date: string): WeekSpec | undefined =>
  WEEKS.find((w) => date >= w.start && date <= w.end);

export const weekIdForDate = (date: string): number | undefined => weekForDate(date)?.id;

export const weekById = (id: number): WeekSpec | undefined => WEEKS.find((w) => w.id === id);

export const planDatesForWeek = (weekId: number): string[] =>
  PLAN.filter((d) => d.weekId === weekId).map((d) => d.date);

/** Sum of the week's per-day DILR targets (excludes full-mock days by design). */
export const weekDilrDailyTarget = (weekId: number): number =>
  PLAN.filter((d) => d.weekId === weekId).reduce((s, d) => s + d.dilrSetTarget, 0);

/** The week's mix-guide total: named archetypes plus any free/mixed sets. */
export const weekAllocationTotal = (w: WeekSpec): number =>
  Object.values(w.archetypeAllocation).reduce((s, n) => s + (n ?? 0), 0) + (w.mixedSets ?? 0);

/** The dates in a week that carry an RC passage. Length always equals `w.rcPassages`. */
export const rcDatesForWeek = (weekId: number): string[] =>
  PLAN.filter((d) => d.weekId === weekId && d.varcKind === 'rc').map((d) => d.date);

/** The dates in a week that carry a non-RC drill. */
export const nonRcDatesForWeek = (weekId: number): string[] =>
  PLAN.filter((d) => d.weekId === weekId && d.varcKind === 'non-rc').map((d) => d.date);

/** Full mocks are numbered in date order; Mock 1 is 16 Aug, Mock 8 is 4 Oct. */
export const FULL_MOCK_DATES: string[] = WEEKS.flatMap((w) => w.fullMockDates).sort();

export const mockNumberFor = (date: string): number | undefined => {
  const i = FULL_MOCK_DATES.indexOf(date);
  return i === -1 ? undefined : i + 1;
};

/** 4 Oct carries the month-end audit alongside Full Mock 8. */
export const AUDIT_DATE = '2026-10-04';
