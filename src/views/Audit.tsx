import { useMemo, useRef, useState } from 'react';
import { useStore } from '../store';
import {
  PLAN,
  PRE_COVERED_QA_TOPICS,
  QA_AREAS,
  QA_AREA_WEIGHT,
  WEEKS,
  type QaArea,
} from '../seed';
import {
  archetypeCoverage,
  dominantErrorTag,
  hitRate,
  pct,
  triageAccuracy,
} from '../metrics';
import { HIT_RATE_TARGET, TRIAGE_TARGET, type ErrorTag } from '../types';
import { TAG_COLOR } from '../charts';
import { Button, Empty, Notice, Panel, fmtDate } from '../ui';

/**
 * What each dominant tag implies for the mastery pass that starts after 4 Oct — no new
 * topics, rising difficulty, allocation following the error log. The whole sprint funnels
 * into this one recommendation.
 */
const MASTERY_EMPHASIS: Record<ErrorTag, string> = {
  concept:
    'Theory first. The gap is knowledge, not execution — rebuild the weak topics from your error log before adding volume.',
  silly:
    'Accuracy protocol. You know the material; the leak is execution. Slow the first read, re-check the stem, verify before marking.',
  selection:
    'Triage drills. The leak is question choice — more timed sets where you must commit to attempt/later/skip in the first 30 seconds.',
  time: 'Speed and bail discipline. Tighten caps on archetypes you already own, and leave at the cap without negotiating.',
};

type TopicRow = {
  topic: string;
  weekId: number;
  area: QaArea;
  target: number;
  solved: number;
  conceptDays: number;
  days: number;
};

function topicRows(store: ReturnType<typeof useStore>['store']): TopicRow[] {
  const rows: TopicRow[] = [];
  for (const w of WEEKS) {
    for (const topic of w.qaTopics) {
      const days = PLAN.filter((d) => d.weekId === w.id && d.qaTopics.includes(topic));
      if (days.length === 0) continue;
      rows.push({
        topic,
        weekId: w.id,
        area: w.qaArea,
        days: days.length,
        target: days.reduce((s, d) => s + d.qaProblemTarget, 0),
        solved: days.reduce((s, d) => s + (store.dayLogs[d.date]?.qaProblemsSolved ?? 0), 0),
        conceptDays: days.filter((d) => store.dayLogs[d.date]?.qaConceptDone).length,
      });
    }
  }
  return rows;
}

/** "Drilled" needs the problem volume; "read" is concept work without it. */
function topicVerdict(r: TopicRow): { label: string; tone: 'good' | 'warning' | 'muted' } {
  const frac = r.target === 0 ? 0 : r.solved / r.target;
  if (frac >= 0.8) return { label: 'drilled', tone: 'good' };
  if (r.conceptDays > 0 || r.solved > 0) return { label: 'read, under-drilled', tone: 'warning' };
  return { label: 'untouched', tone: 'muted' };
}

function Answer({
  n,
  question,
  children,
}: {
  n: number;
  question: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-line-soft pt-4 first:border-0 first:pt-0">
      <div className="flex gap-3">
        <span className="num shrink-0 text-sm text-chalk-mute">{n}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base leading-snug font-medium text-chalk">{question}</h3>
          <div className="mt-2 text-sm text-chalk-dim">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Audit() {
  const ctx = useStore();
  const { store, exportJSON, importJSON, resetAll } = ctx;
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const coverage = useMemo(() => archetypeCoverage(store.dilrSets), [store.dilrSets]);
  const topics = useMemo(() => topicRows(store), [store]);
  const tri = triageAccuracy(store.dilrSets);
  const hit = hitRate(store.dilrSets);
  const dominant = dominantErrorTag(store.errors);

  const solid = coverage.filter((c) => c.state === 'solid');
  const familiar = coverage.filter((c) => c.state === 'familiar');
  const exposed = coverage.filter((c) => c.state === 'exposed');
  const untouched = coverage.filter((c) => c.state === 'not started');

  const toneClass = (t: 'good' | 'warning' | 'muted') =>
    t === 'good' ? 'text-good' : t === 'warning' ? 'text-warning' : 'text-chalk-mute';

  const hasData =
    store.dilrSets.length > 0 || store.errors.length > 0 || Object.keys(store.dayLogs).length > 0;

  return (
    <div className="space-y-3">
      <Panel
        eyebrow="Due 4 Oct · answers computed from your logs"
        title="Month-end audit"
        aside={
          <span className="num text-xs text-chalk-mute">
            end of the concept pass
          </span>
        }
      >
        {!hasData && (
          <div className="mb-4">
            <Empty>Nothing logged yet — the audit fills itself in as the sprint runs.</Empty>
          </div>
        )}

        <div className="space-y-4">
          <Answer n={1} question="Which QA topics did I actually drill, versus only read?">
            <p className="mb-3 text-xs text-chalk-mute">
              The concept pass aims for ~20 problems of contact per topic. Grouped by area,
              with each area's share of the QA section — under-drilling Arithmetic costs more
              than under-drilling Modern Math.
            </p>
            <div className="space-y-3">
              {QA_AREAS.filter((a) => topics.some((r) => r.area === a)).map((area) => {
                const rows = topics.filter((r) => r.area === area);
                const solved = rows.reduce((s, r) => s + r.solved, 0);
                const target = rows.reduce((s, r) => s + r.target, 0);
                return (
                  <div key={area}>
                    <div className="mb-1 flex items-baseline justify-between gap-2">
                      <span className="eyebrow">
                        {area} · {Math.round(QA_AREA_WEIGHT[area] * 100)}% of QA
                      </span>
                      <span className="num text-xs text-chalk-mute">
                        {solved}/{target}
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {rows.map((r) => {
                        const v = topicVerdict(r);
                        return (
                          <li key={`${r.weekId}-${r.topic}`} className="flex items-baseline gap-2">
                            <span className="num shrink-0 text-[0.6875rem] text-chalk-mute">
                              W{r.weekId}
                            </span>
                            <span className="min-w-0 flex-1 truncate">{r.topic}</span>
                            <span className="num shrink-0 text-xs text-chalk-mute">
                              {r.solved}/{r.target}
                            </span>
                            <span className={`shrink-0 text-xs ${toneClass(v.tone)}`}>
                              {v.label}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-chalk-mute">
              Not seeded because they were covered before 12 Aug:{' '}
              {PRE_COVERED_QA_TOPICS.join(', ')}.
            </p>
          </Answer>

          <Answer n={2} question="Which DILR archetypes can I recognise on sight?">
            <div className="space-y-2">
              <p>
                <span className="text-good">{solid.length} solid</span> ·{' '}
                <span className="text-warning">{familiar.length} familiar</span> ·{' '}
                {exposed.length} exposed · {untouched.length} untouched
              </p>
              {solid.length > 0 && (
                <p>
                  <span className="text-chalk">Own them:</span>{' '}
                  {solid.map((c) => c.archetype).join(', ')}
                </p>
              )}
              {(familiar.length > 0 || exposed.length > 0) && (
                <p>
                  <span className="text-chalk">Still shaky:</span>{' '}
                  {[...familiar, ...exposed].map((c) => c.archetype).join(', ')}
                </p>
              )}
              {untouched.length > 0 && (
                <p>
                  <span className="text-chalk">Never attempted:</span>{' '}
                  {untouched.map((c) => c.archetype).join(', ')}
                </p>
              )}
            </div>
          </Answer>

          <Answer n={3} question={`Triage accuracy against the ${pct(TRIAGE_TARGET)} target?`}>
            {tri.value === null ? (
              <span className="text-chalk-mute">No timed sets logged.</span>
            ) : (
              <p>
                <span
                  className={`num text-xl font-medium ${
                    tri.value >= TRIAGE_TARGET ? 'text-good' : 'text-warning'
                  }`}
                >
                  {pct(tri)}
                </span>{' '}
                over {tri.den} timed sets —{' '}
                {tri.value >= TRIAGE_TARGET
                  ? `${pct(tri.value - TRIAGE_TARGET)} above target.`
                  : `${pct(TRIAGE_TARGET - tri.value)} short.`}
              </p>
            )}
          </Answer>

          <Answer n={4} question={`Hit rate against the ${pct(HIT_RATE_TARGET)} target?`}>
            {hit.value === null ? (
              <span className="text-chalk-mute">No timed sets logged.</span>
            ) : (
              <p>
                <span
                  className={`num text-xl font-medium ${
                    hit.value >= HIT_RATE_TARGET ? 'text-good' : 'text-warning'
                  }`}
                >
                  {pct(hit)}
                </span>{' '}
                cracked inside the cap —{' '}
                {hit.value >= HIT_RATE_TARGET
                  ? `${pct(hit.value - HIT_RATE_TARGET)} above target.`
                  : `${pct(HIT_RATE_TARGET - hit.value)} short.`}
              </p>
            )}
          </Answer>

          <Answer n={5} question="What should the mastery pass emphasise?">
            {dominant.tags.length === 0 ? (
              <span className="text-chalk-mute">No errors logged, so no emphasis to derive.</span>
            ) : (
              <div>
                <p className="mb-2">
                  Dominant tag{dominant.tags.length > 1 ? 's' : ''}:{' '}
                  {dominant.tags.map((t) => (
                    <span key={t} className="font-medium" style={{ color: TAG_COLOR[t] }}>
                      {t}{' '}
                    </span>
                  ))}
                  <span className="num text-chalk-mute">({dominant.count}× each)</span>
                </p>
                <ul className="space-y-2">
                  {dominant.tags.map((t) => (
                    <li
                      key={t}
                      className="border-l-2 pl-3"
                      style={{ borderColor: TAG_COLOR[t] }}
                    >
                      {MASTERY_EMPHASIS[t]}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Answer>
        </div>
      </Panel>

      <Panel eyebrow="Backup" title="Your data">
        <p className="mb-3 text-sm text-chalk-dim">
          Everything lives in this browser's localStorage. Export before clearing site data or
          switching devices.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={exportJSON}>Export JSON</Button>
          <Button onClick={() => fileRef.current?.click()}>Import JSON</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setImportError(null);
              try {
                await importJSON(f);
              } catch {
                setImportError("That file isn't a valid backup.");
              }
              e.target.value = '';
            }}
          />
          {confirmReset ? (
            <>
              <Button
                variant="danger"
                onClick={() => {
                  resetAll();
                  setConfirmReset(false);
                }}
              >
                Yes, erase everything
              </Button>
              <Button variant="ghost" onClick={() => setConfirmReset(false)}>
                Keep it
              </Button>
            </>
          ) : (
            <Button variant="danger" onClick={() => setConfirmReset(true)}>
              Erase all logs
            </Button>
          )}
        </div>
        {importError && (
          <div className="mt-3">
            <Notice tone="critical">{importError}</Notice>
          </div>
        )}
        <p className="num mt-3 text-xs text-chalk-mute">
          {Object.keys(store.dayLogs).length} day logs · {store.dilrSets.length} sets ·{' '}
          {store.errors.length} errors · {store.mocks.length} mocks
          {store.dilrSets.length > 0 &&
            ` · first ${fmtDate(
              [...store.dilrSets].sort((a, b) => a.date.localeCompare(b.date))[0].date,
            )}`}
        </p>
      </Panel>
    </div>
  );
}
