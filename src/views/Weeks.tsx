import { useStore } from '../store';
import {
  PLAN,
  WEEKS,
  weekAllocationTotal,
  weekDilrDailyTarget,
  type WeekSpec,
} from '../seed';
import { hitRate, loggedByArchetype, pct, triageAccuracy } from '../metrics';
import { Panel, fmtDate } from '../ui';
import { SECTION_COLOR } from '../charts';
import { LR_ARCHETYPES, type Archetype } from '../types';

/** target-vs-actual row with a fill bar. Over-target is fine and shown as full, not scolded. */
function MeterRow({
  label,
  actual,
  target,
  color,
  suffix,
}: {
  label: string;
  actual: number;
  target: number;
  color: string;
  suffix?: string;
}) {
  const frac = target === 0 ? (actual > 0 ? 1 : 0) : Math.min(1, actual / target);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs text-chalk-dim">{label}</span>
        <span className="num text-xs text-chalk">
          {actual}
          <span className="text-chalk-mute">
            /{target}
            {suffix}
          </span>
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden bg-line">
        <div
          className="h-full transition-[width]"
          style={{ width: `${frac * 100}%`, background: color }}
        />
      </div>
    </div>
  );
}

function WeekCard({ w, past }: { w: WeekSpec; past: boolean }) {
  const { store } = useStore();
  const days = PLAN.filter((d) => d.weekId === w.id);
  const inWeek = <T extends { date: string }>(rows: T[]) =>
    rows.filter((r) => r.date >= w.start && r.date <= w.end);

  const sets = inWeek(store.dilrSets);
  const errs = inWeek(store.errors);
  const mocks = inWeek(store.mocks);

  const qaTarget = days.reduce((s, d) => s + d.qaProblemTarget, 0);
  const qaActual = days.reduce((s, d) => s + (store.dayLogs[d.date]?.qaProblemsSolved ?? 0), 0);

  // RC is a weekly quota; non-RC drills are the other days. Counted separately so a week
  // of drills can't paper over unread passages.
  const rcDays = days.filter((d) => d.varcKind === 'rc');
  const rcActual = rcDays.filter((d) => store.dayLogs[d.date]?.varcDone).length;
  const nonRcDays = days.filter((d) => d.varcKind === 'non-rc');
  const nonRcActual = nonRcDays.filter((d) => store.dayLogs[d.date]?.varcDone).length;
  const readingActual = days.filter((d) => store.dayLogs[d.date]?.readingDone).length;

  const dilrTarget = weekDilrDailyTarget(w.id);
  const logged = loggedByArchetype(sets);
  const allocTotal = weekAllocationTotal(w);
  const named = Object.entries(w.archetypeAllocation) as [Archetype, number][];

  // Phase B: the plan states an LR/DI balance rather than named archetypes, so measure it.
  const lrCount = sets.filter((s) => (LR_ARCHETYPES as Archetype[]).includes(s.archetype)).length;
  const diCount = sets.length - lrCount;
  const lrPct = sets.length === 0 ? null : lrCount / sets.length;

  const tri = triageAccuracy(sets);
  const hit = hitRate(sets);

  return (
    <Panel
      eyebrow={`${fmtDate(w.start)} – ${fmtDate(w.end)} · ${w.qaArea} · ${w.qaTheme}`}
      title={
        <span className="flex items-center gap-2">
          {w.label}
          <span
            className="num px-1.5 py-0.5 text-[0.625rem] font-normal"
            style={{
              background:
                w.phase === 'B'
                  ? 'color-mix(in oklab, var(--color-dilr) 20%, transparent)'
                  : 'var(--color-line)',
              color: w.phase === 'B' ? 'var(--color-dilr)' : 'var(--color-chalk-mute)',
            }}
          >
            phase {w.phase}
          </span>
        </span>
      }
      aside={
        <div className="text-right">
          <div className="num text-xs text-chalk-mute">
            triage {pct(tri)} · hit {pct(hit)}
          </div>
          {mocks.length > 0 && (
            <div className="num text-[0.6875rem] text-chalk-mute">
              {mocks.length} mock{mocks.length === 1 ? '' : 's'}
            </div>
          )}
        </div>
      }
      className={past ? '' : 'opacity-95'}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-2.5">
          <MeterRow
            label="QA problems"
            actual={qaActual}
            target={qaTarget}
            color={SECTION_COLOR.QA}
          />
          <MeterRow
            label="DILR sets"
            actual={sets.length}
            target={dilrTarget}
            color={SECTION_COLOR.DILR}
          />
          <MeterRow
            label="RC passages"
            actual={rcActual}
            target={w.rcPassages}
            color={SECTION_COLOR.VARC}
          />
          {nonRcDays.length > 0 && (
            <MeterRow
              label="Non-RC drills"
              actual={nonRcActual}
              target={nonRcDays.length}
              color={SECTION_COLOR.VARC}
            />
          )}
          <MeterRow
            label="Reading days"
            actual={readingActual}
            target={days.length}
            color="var(--color-chalk-mute)"
          />
        </div>

        <div>
          <div className="eyebrow mb-2">
            {named.length > 0 ? 'Archetype mix' : 'Phase B blocks'} · {allocTotal} sets planned
          </div>
          <ul className="space-y-1.5">
            {named.map(([a, n]) => {
              const done = logged[a] ?? 0;
              return (
                <li key={a} className="flex items-center gap-2">
                  <span className="min-w-0 flex-1 truncate text-xs text-chalk-dim">{a}</span>
                  <span className="flex gap-[2px]">
                    {Array.from({ length: n }).map((_, i) => (
                      <span
                        key={i}
                        className="h-3 w-1.5"
                        style={{
                          background: i < done ? SECTION_COLOR.DILR : 'var(--color-line)',
                        }}
                      />
                    ))}
                  </span>
                  <span className="num w-9 text-right text-[0.6875rem] text-chalk-mute">
                    {done}/{n}
                  </span>
                </li>
              );
            })}
            {w.mixedSets !== undefined && (
              <li className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-xs text-chalk-dim">
                  {w.mixedLabel ?? 'Mixed sets'}
                </span>
                <span className="num w-9 text-right text-[0.6875rem] text-chalk-mute">
                  {w.mixedSets}
                </span>
              </li>
            )}
          </ul>

          {/* Phase B blocks are unlabeled, so the only checkable thing is the LR/DI balance
              of what you actually tagged. */}
          {w.lrShare !== undefined && (
            <div className="mt-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-chalk-dim">LR share of tagged sets</span>
                <span className="num text-xs text-chalk">
                  {lrPct === null ? '—' : `${Math.round(lrPct * 100)}%`}
                  <span className="text-chalk-mute">/{Math.round(w.lrShare * 100)}%</span>
                </span>
              </div>
              <div className="mt-1 flex h-1.5 overflow-hidden bg-line">
                <div
                  className="h-full"
                  style={{
                    width: `${(lrPct ?? 0) * 100}%`,
                    background: SECTION_COLOR.DILR,
                  }}
                />
              </div>
              <p className="num mt-1 text-[0.6875rem] text-chalk-mute">
                {lrCount} LR · {diCount} DI
              </p>
            </div>
          )}

          {errs.length > 0 && (
            <p className="num mt-2 text-[0.6875rem] text-chalk-mute">
              {errs.length} error{errs.length === 1 ? '' : 's'} logged
            </p>
          )}
        </div>
      </div>

      {w.note && (
        <p className="mt-3 border-l-2 border-line pl-3 text-xs text-chalk-mute">{w.note}</p>
      )}
    </Panel>
  );
}

export function Weeks() {
  const { activeDate } = useStore();

  return (
    <div className="space-y-3">
      <Panel eyebrow="Target vs actual · 54 days" title="Eight weeks">
        <p className="text-sm text-chalk-dim">
          The <span className="text-chalk">DILR sets</span> target is the sum of each week's daily
          targets, which skip full-mock days — 138 across the sprint. The{' '}
          <span className="text-chalk">mix guide</span> beside it is the plan's allocation, which
          counts every calendar day at three sets and so totals 162. Both are shown rather than
          reconciled.
        </p>
        <p className="mt-2 text-sm text-chalk-dim">
          Weeks 1–5 name their archetypes. From week 6{' '}
          <span className="text-chalk">Phase B</span> serves unlabeled blocks, so the check there
          is the LR/DI balance of what you tagged, not a per-archetype tally.
        </p>
      </Panel>
      {WEEKS.map((w) => (
        <WeekCard key={w.id} w={w} past={w.end <= activeDate} />
      ))}
    </div>
  );
}
