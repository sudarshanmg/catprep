export type Section = 'QA' | 'DILR' | 'VARC';
export type ErrorTag = 'concept' | 'silly' | 'selection' | 'time';
export type SetMode = 'learning' | 'timed';
export type TriageCall = 'attempt' | 'later' | 'skip';

export type Archetype =
  // Logical Reasoning (9)
  | 'Mathematical Reasoning'
  | 'Set Theory'
  | 'Games & Tournaments'
  | 'Group & Arrangements'
  | 'Sitting Arrangements'
  | 'Puzzles'
  | 'Order & Ranking'
  | 'Analytical Reasoning'
  | 'Binary & Conditional Logic'
  // Data Interpretation (5)
  | 'Line & Bar Charts'
  | 'Pie Charts'
  | 'Data Tabulation'
  | 'Caselets'
  | 'Logic Based DI';

export const ARCHETYPES: Archetype[] = [
  'Mathematical Reasoning',
  'Set Theory',
  'Games & Tournaments',
  'Group & Arrangements',
  'Sitting Arrangements',
  'Puzzles',
  'Order & Ranking',
  'Analytical Reasoning',
  'Binary & Conditional Logic',
  'Line & Bar Charts',
  'Pie Charts',
  'Data Tabulation',
  'Caselets',
  'Logic Based DI',
];

export const LR_ARCHETYPES = ARCHETYPES.slice(0, 9);
export const DI_ARCHETYPES = ARCHETYPES.slice(9);

export const ERROR_TAGS: ErrorTag[] = ['concept', 'silly', 'selection', 'time'];
export const SECTIONS: Section[] = ['QA', 'DILR', 'VARC'];

/** The timed-set cap for this entire month, in minutes. */
export const TIMED_CAP_MIN = 12;
/** Targets for the month. */
export const HIT_RATE_TARGET = 0.4;
export const TRIAGE_TARGET = 0.6;

export type DayType = 'study' | 'sectional' | 'fullmock';

/**
 * What the day's VARC slot actually is. RC passages are a *weekly* quota (3 in week 1,
 * 4 thereafter) spread across the week, so most days carry a non-RC drill or nothing but
 * the daily reading — this field is what lets the checklist and the week view tell those
 * apart instead of implying an RC passage every day.
 */
export type VarcKind = 'rc' | 'non-rc' | 'reading' | 'mock-analysis';

export type DayPlan = {
  date: string; // 'YYYY-MM-DD'
  weekId: number; // 1..8
  qaTopics: string[];
  qaProblemTarget: number;
  dilrSetTarget: number;
  varcTask: string;
  varcKind: VarcKind;
  dayType: DayType;
  /** Set on the one cold-review day; the checklist swaps the QA block for a review prompt. */
  consolidation?: boolean;
};

export type DayLog = {
  date: string;
  qaConceptDone: boolean;
  qaProblemsSolved: number;
  varcDone: boolean;
  readingDone: boolean;
  formulaSheetUpdated: boolean;
  notes?: string;
};

export type DilrSetLog = {
  id: string;
  date: string;
  archetype: Archetype;
  mode: SetMode;
  triageCall?: TriageCall;
  triageWasCorrect?: boolean;
  crackedInCap?: boolean;
  minutesSpent: number;
  scaffoldUsed?: string;
  stallPoint?: string;
};

export type ErrorLogEntry = {
  id: string;
  date: string;
  section: Section;
  topic: string;
  tag: ErrorTag;
  note?: string;
};

export type SectionScore = {
  attempted: number;
  correct: number;
  incorrect: number;
  score: number;
};

export type MockResult = {
  id: string;
  date: string;
  kind: 'full' | 'sectional';
  name?: string;
  varc?: SectionScore;
  dilr?: SectionScore;
  qa?: SectionScore;
  overallPercentile?: number;
  analysisDone: boolean;
};

export type Store = {
  dayLogs: Record<string, DayLog>;
  dilrSets: DilrSetLog[];
  errors: ErrorLogEntry[];
  mocks: MockResult[];
};

export const emptyDayLog = (date: string): DayLog => ({
  date,
  qaConceptDone: false,
  qaProblemsSolved: 0,
  varcDone: false,
  readingDone: false,
  formulaSheetUpdated: false,
});

/** +3 for a correct answer, −1 for an incorrect one. */
export const computeScore = (correct: number, incorrect: number) => correct * 3 - incorrect;
