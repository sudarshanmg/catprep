import { useState } from 'react';
import { SECTIONS, computeScore, type MockResult, type SectionScore } from '../types';
import { useStore } from '../store';
import { SECTION_COLOR } from '../charts';
import { Button, Field, Notice, Segmented, fmtDate, inputClass } from '../ui';
import { sectionKey } from '../metrics';

type Draft = { attempted: string; correct: string; incorrect: string };
const emptyDraft = (): Draft => ({ attempted: '', correct: '', incorrect: '' });

const toScore = (d: Draft): SectionScore | undefined => {
  const attempted = Number(d.attempted);
  const correct = Number(d.correct);
  const incorrect = Number(d.incorrect);
  if (!d.attempted && !d.correct && !d.incorrect) return undefined;
  return {
    attempted: attempted || 0,
    correct: correct || 0,
    incorrect: incorrect || 0,
    score: computeScore(correct || 0, incorrect || 0),
  };
};

/** Attempted must cover correct + incorrect, or the entry is a typo. */
const draftError = (d: Draft): string | null => {
  const a = Number(d.attempted) || 0;
  const c = Number(d.correct) || 0;
  const i = Number(d.incorrect) || 0;
  if (!d.attempted && !d.correct && !d.incorrect) return null;
  if (c + i > a) return `correct + incorrect (${c + i}) exceeds attempted (${a})`;
  return null;
};

export function MockForm({
  date,
  defaultKind = 'full',
  existing,
  onDone,
}: {
  date: string;
  defaultKind?: 'full' | 'sectional';
  existing?: MockResult;
  onDone?: () => void;
}) {
  const { upsertMock } = useStore();
  const [kind, setKind] = useState<'full' | 'sectional'>(existing?.kind ?? defaultKind);
  const [name, setName] = useState(existing?.name ?? '');
  const [percentile, setPercentile] = useState(
    existing?.overallPercentile !== undefined ? String(existing.overallPercentile) : '',
  );
  const [analysisDone, setAnalysisDone] = useState(existing?.analysisDone ?? false);
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() => {
    const seed: Record<string, Draft> = {};
    for (const s of SECTIONS) {
      const k = sectionKey(s);
      const v = existing?.[k];
      seed[s] = v
        ? {
            attempted: String(v.attempted),
            correct: String(v.correct),
            incorrect: String(v.incorrect),
          }
        : emptyDraft();
    }
    return seed;
  });

  const errors = SECTIONS.map((s) => ({ s, err: draftError(drafts[s]) })).filter((x) => x.err);
  const anyData = SECTIONS.some((s) => toScore(drafts[s]) !== undefined);

  function save() {
    if (errors.length > 0 || !anyData) return;
    upsertMock({
      id: existing?.id,
      date,
      kind,
      ...(name.trim() ? { name: name.trim() } : {}),
      qa: toScore(drafts.QA),
      dilr: toScore(drafts.DILR),
      varc: toScore(drafts.VARC),
      ...(percentile !== '' ? { overallPercentile: Number(percentile) } : {}),
      analysisDone,
    });
    onDone?.();
  }

  const numInput = `${inputClass} num text-center`;

  return (
    <div className="space-y-5">
      <Segmented
        label="Kind"
        value={kind}
        onChange={setKind}
        options={[
          { value: 'full', label: 'Full mock' },
          { value: 'sectional', label: 'Sectional' },
        ]}
      />

      <Field label="Name" hint="Optional — e.g. SIMCAT 4">
        <input
          className={inputClass}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mock name"
        />
      </Field>

      <div>
        <div className="eyebrow mb-2">Per section · score is +3 correct, −1 incorrect</div>
        <div className="space-y-2">
          <div className="grid grid-cols-[3.25rem_1fr_1fr_1fr_3rem] gap-2 px-1">
            {['', 'att', 'corr', 'incorr', 'score'].map((h, i) => (
              <span key={i} className="eyebrow text-center">
                {h}
              </span>
            ))}
          </div>
          {SECTIONS.map((s) => {
            const d = drafts[s];
            const sc = toScore(d);
            const err = draftError(d);
            const set = (patch: Partial<Draft>) =>
              setDrafts((prev) => ({ ...prev, [s]: { ...prev[s], ...patch } }));
            return (
              <div key={s}>
                <div className="grid grid-cols-[3.25rem_1fr_1fr_1fr_3rem] items-center gap-2">
                  <span
                    className="border-l-2 pl-2 text-xs font-semibold"
                    style={{ borderColor: SECTION_COLOR[s] }}
                  >
                    {s}
                  </span>
                  <input
                    className={numInput}
                    inputMode="numeric"
                    value={d.attempted}
                    onChange={(e) => set({ attempted: e.target.value.replace(/\D/g, '') })}
                    aria-label={`${s} attempted`}
                  />
                  <input
                    className={numInput}
                    inputMode="numeric"
                    value={d.correct}
                    onChange={(e) => set({ correct: e.target.value.replace(/\D/g, '') })}
                    aria-label={`${s} correct`}
                  />
                  <input
                    className={numInput}
                    inputMode="numeric"
                    value={d.incorrect}
                    onChange={(e) => set({ incorrect: e.target.value.replace(/\D/g, '') })}
                    aria-label={`${s} incorrect`}
                  />
                  <span
                    className="num text-center text-base font-semibold"
                    style={{ color: sc ? SECTION_COLOR[s] : 'var(--color-chalk-mute)' }}
                  >
                    {sc ? sc.score : '—'}
                  </span>
                </div>
                {err && <p className="num mt-1 pl-1 text-xs text-critical">{err}</p>}
              </div>
            );
          })}
        </div>
      </div>

      <Field label="Overall percentile" hint="Optional">
        <input
          className={`${inputClass} num`}
          inputMode="decimal"
          value={percentile}
          onChange={(e) => setPercentile(e.target.value.replace(/[^\d.]/g, ''))}
          placeholder="e.g. 94.2"
        />
      </Field>

      <Segmented
        label="Was the 3-hour analysis done?"
        value={analysisDone ? 'yes' : 'no'}
        onChange={(v) => setAnalysisDone(v === 'yes')}
        options={[
          { value: 'yes', label: 'Analysed' },
          { value: 'no', label: 'Not yet' },
        ]}
        colorFor={(v) => (v === 'yes' ? 'var(--color-good)' : 'var(--color-warning)')}
      />

      {!analysisDone && (
        <Notice tone="warning">An unanalysed mock is a wasted mock. Block out the 3 hours.</Notice>
      )}

      <Button variant="primary" onClick={save} disabled={errors.length > 0 || !anyData} full>
        {existing ? 'Update' : 'Save'} result for {fmtDate(date)}
      </Button>
    </div>
  );
}
