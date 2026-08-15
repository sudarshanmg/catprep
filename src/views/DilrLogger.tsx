import { useEffect, useMemo, useState } from 'react';
import {
  DI_ARCHETYPES,
  LR_ARCHETYPES,
  TIMED_CAP_MIN,
  type Archetype,
  type DilrSetLog,
  type SetMode,
  type TriageCall,
} from '../types';
import { weekForDate } from '../seed';
import { weakestArchetypes } from '../metrics';
import { useStore } from '../store';
import { Button, Field, Segmented, Stepper, fmtDate, inputClass, selectClass } from '../ui';

const SCAFFOLDS = ['grid', 'table', 'timeline', 'network', 'venn'];

/**
 * Used three times a day, so the form is ordered by how fast each answer arrives:
 * archetype (one tap if it's in this week's mix) → mode → the three timed questions.
 * Everything below the fold is optional.
 */
export function DilrLogger({
  date,
  onClose,
}: {
  date: string;
  onClose: () => void;
}) {
  const { addDilrSet, store } = useStore();
  const week = weekForDate(date);
  const phaseB = week?.phase === 'B';

  /**
   * One-tap chips. In Phase A they are the week's planned archetypes. In Phase B the blocks
   * are unlabeled and you tag what a set turned out to be, so the plan can't suggest —
   * the weakest archetypes in the coverage grid are the useful shortlist instead. Week 5
   * is both: its named pair first, then weakest to fill its 12 mixed sets.
   */
  const suggested = useMemo(() => {
    const named = Object.keys(week?.archetypeAllocation ?? {}) as Archetype[];
    if (!phaseB && (week?.mixedSets ?? 0) === 0) return named;
    const weak = weakestArchetypes(store.dilrSets, 8)
      .map((c) => c.archetype)
      .filter((a) => !named.includes(a));
    return [...named, ...weak].slice(0, phaseB ? 5 : 5);
  }, [week, phaseB, store.dilrSets]);

  // Phase A can pre-select the week's first planned archetype. Phase B must not: the set
  // arrived unlabeled, so pre-filling a guess would put a wrong tag one tap from saved.
  const [archetype, setArchetype] = useState<Archetype | ''>(
    phaseB ? '' : (suggested[0] ?? ''),
  );
  const [mode, setMode] = useState<SetMode>('timed');
  const [triageCall, setTriageCall] = useState<TriageCall | undefined>();
  const [minutes, setMinutes] = useState(TIMED_CAP_MIN);
  const [cracked, setCracked] = useState<boolean | undefined>();
  const [callCorrect, setCallCorrect] = useState<boolean | undefined>();
  const [scaffold, setScaffold] = useState('');
  const [stall, setStall] = useState('');

  // Switching mode resets the default duration to something sane for that mode.
  useEffect(() => {
    setMinutes(mode === 'timed' ? TIMED_CAP_MIN : 20);
  }, [mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const timed = mode === 'timed';
  const canSave =
    archetype !== '' &&
    (!timed || (triageCall !== undefined && cracked !== undefined && callCorrect !== undefined));

  function save() {
    if (archetype === '') return;
    const entry: Omit<DilrSetLog, 'id'> = {
      date,
      archetype,
      mode,
      minutesSpent: minutes,
      ...(timed
        ? { triageCall, triageWasCorrect: callCorrect, crackedInCap: cracked }
        : {}),
      ...(scaffold.trim() ? { scaffoldUsed: scaffold.trim() } : {}),
      ...(stall.trim() ? { stallPoint: stall.trim() } : {}),
    };
    addDilrSet(entry);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end sm:items-center sm:justify-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-ink/80 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Log a DILR set"
        className="brackets relative flex max-h-[92dvh] w-full flex-col border border-line bg-slate sm:max-w-lg"
      >
        {/* Lit edge, as on every panel — this sheet is the one the user sees most. */}
        <span
          aria-hidden
          className="glow absolute top-0 right-3 left-3 h-px bg-dilr"
          style={{ ['--glow' as string]: 'var(--color-dilr)' }}
        />
        <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <div className="eyebrow">Log a DILR set</div>
            <h2 className="mt-0.5 font-display text-lg leading-tight font-medium">
              {fmtDate(date)}
              {week && <span className="text-chalk-mute"> · {week.label}</span>}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="-mr-1 grid h-10 w-10 place-items-center text-chalk-mute hover:text-chalk"
            aria-label="Close"
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none">
              <path
                d="M3 3l10 10M13 3L3 13"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-4 py-4">
          {/* Archetype: chips for the likely few, dropdown for everything else. */}
          <div>
            <span className="eyebrow mb-2 block">
              {phaseB ? 'Archetype — what did it turn out to be?' : 'Archetype'}
            </span>
            {phaseB && (
              <p className="mb-2 text-xs text-chalk-mute">
                Phase B blocks are unlabeled. Suggestions below are your weakest archetypes.
              </p>
            )}
            {suggested.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-2">
                {suggested.map((a) => {
                  const active = archetype === a;
                  return (
                    <button
                      key={a}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setArchetype(a)}
                      className="min-h-11 border px-3 text-sm transition-colors"
                      style={{
                        borderColor: active ? 'var(--color-dilr)' : 'var(--color-line)',
                        background: active
                          ? 'color-mix(in oklab, var(--color-dilr) 16%, transparent)'
                          : 'transparent',
                        color: active ? 'var(--color-chalk)' : 'var(--color-chalk-dim)',
                      }}
                    >
                      {a}
                    </button>
                  );
                })}
              </div>
            )}
            <select
              className={selectClass}
              value={archetype}
              onChange={(e) => setArchetype(e.target.value as Archetype)}
            >
              <option value="">Pick an archetype…</option>
              <optgroup label="Logical Reasoning">
                {LR_ARCHETYPES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Data Interpretation">
                {DI_ARCHETYPES.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <Segmented
            label="Mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'learning', label: 'Learning', hint: 'no cap' },
              { value: 'timed', label: 'Timed', hint: `${TIMED_CAP_MIN}m cap` },
            ]}
          />

          {timed && (
            <>
              <Segmented
                label="Triage call — what did you decide on sight?"
                value={triageCall}
                onChange={setTriageCall}
                options={[
                  { value: 'attempt', label: 'Attempt' },
                  { value: 'later', label: 'Later' },
                  { value: 'skip', label: 'Skip' },
                ]}
              />

              <div>
                <Stepper
                  label="minutes spent"
                  value={minutes}
                  onChange={setMinutes}
                  target={TIMED_CAP_MIN}
                />
                {minutes > TIMED_CAP_MIN && (
                  <p className="num mt-2 text-center text-xs text-warning">
                    {minutes - TIMED_CAP_MIN}m over the cap
                  </p>
                )}
              </div>

              <Segmented
                label={`Cracked it inside ${TIMED_CAP_MIN} minutes?`}
                value={cracked === undefined ? undefined : cracked ? 'yes' : 'no'}
                onChange={(v) => setCracked(v === 'yes')}
                options={[
                  { value: 'yes', label: 'Cracked' },
                  { value: 'no', label: 'Not cracked' },
                ]}
                colorFor={(v) => (v === 'yes' ? 'var(--color-varc)' : 'var(--color-chalk-mute)')}
              />

              <Segmented
                label="Did the triage call turn out right?"
                value={callCorrect === undefined ? undefined : callCorrect ? 'yes' : 'no'}
                onChange={(v) => setCallCorrect(v === 'yes')}
                options={[
                  { value: 'yes', label: 'Right call' },
                  { value: 'no', label: 'Wrong call' },
                ]}
                colorFor={(v) => (v === 'yes' ? 'var(--color-dilr)' : 'var(--color-chalk-mute)')}
              />
            </>
          )}

          {!timed && (
            <Stepper label="minutes spent" value={minutes} onChange={setMinutes} step={5} />
          )}

          {/* Optional tail — never blocks a save. */}
          <div className="space-y-4 border-t border-line-soft pt-4">
            <Field label="Scaffold used" hint="Optional">
              <div className="mb-2 flex flex-wrap gap-2">
                {SCAFFOLDS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={scaffold === s}
                    onClick={() => setScaffold(scaffold === s ? '' : s)}
                    className="min-h-10 border px-3 text-sm transition-colors"
                    style={{
                      borderColor: scaffold === s ? 'var(--color-chalk-mute)' : 'var(--color-line)',
                      background: scaffold === s ? 'var(--color-raised)' : 'transparent',
                      color: scaffold === s ? 'var(--color-chalk)' : 'var(--color-chalk-dim)',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <input
                className={inputClass}
                value={scaffold}
                onChange={(e) => setScaffold(e.target.value)}
                placeholder="or type your own"
              />
            </Field>

            <Field label="Stall point" hint="Optional — where did it break down?">
              <input
                className={inputClass}
                value={stall}
                onChange={(e) => setStall(e.target.value)}
                placeholder="e.g. couldn't fix the seating parity"
              />
            </Field>
          </div>
        </div>

        <footer className="flex gap-2 border-t border-line px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <div className="flex-1">
            <Button variant="primary" onClick={save} disabled={!canSave} full>
              Save set
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
