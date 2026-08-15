import { useMemo } from 'react';
import { useStore } from '../store';
import {
  archetypeCoverage,
  dominantErrorTag,
  hitRate,
  pct,
  qaProgress,
  rolling7,
  timedOnly,
  triageAccuracy,
  weekRows,
} from '../metrics';
import { HIT_RATE_TARGET, TRIAGE_TARGET } from '../types';
import {
  CoverageCell,
  CoverageLegend,
  Legend,
  RatioTrend,
  TAG_COLOR,
  TagStack,
  TriageTape,
} from '../charts';
import { Notice, Panel, Stat } from '../ui';
import { ERROR_TAGS } from '../types';

/** Rolling and all-time side by side, so improvement is visible rather than averaged away. */
function PairedStat({
  label,
  all,
  rolling,
  target,
}: {
  label: string;
  all: ReturnType<typeof triageAccuracy>;
  rolling: ReturnType<typeof triageAccuracy>;
  target: number;
}) {
  const tone =
    all.value === null ? 'default' : all.value >= target ? 'good' : ('warning' as const);
  return (
    <div className="flex items-end justify-between gap-4">
      <Stat
        label="all time"
        value={pct(all)}
        sub={`${all.num}/${all.den} timed sets`}
        tone={tone}
      />
      <Stat
        label="last 7 days"
        value={pct(rolling)}
        sub={rolling.den > 0 ? `${rolling.num}/${rolling.den} sets` : 'no sets'}
      />
      <div className="pb-1 text-right">
        <div className="eyebrow">target</div>
        <div className="num mt-1 text-base text-chalk-dim">{pct(target)}</div>
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function Dashboard() {
  const { store, activeDate } = useStore();
  const sets = store.dilrSets;

  const rows = useMemo(() => weekRows(store), [store]);
  const coverage = useMemo(() => archetypeCoverage(sets), [sets]);
  const recentSets = useMemo(() => rolling7(sets, activeDate), [sets, activeDate]);
  const recentErrors = useMemo(() => rolling7(store.errors, activeDate), [store.errors, activeDate]);

  const triageAll = triageAccuracy(sets);
  const triage7 = triageAccuracy(recentSets);
  const hitAll = hitRate(sets);
  const hit7 = hitRate(recentSets);

  const dominantAll = dominantErrorTag(store.errors);
  const dominant7 = dominantErrorTag(recentErrors);
  const qa = qaProgress(store, activeDate);

  const timedCount = timedOnly(sets).length;
  const tagTotals = ERROR_TAGS.map((t) => ({
    tag: t,
    n: store.errors.filter((e) => e.tag === t).length,
  }));

  return (
    <div className="space-y-3">
      {/* The tape: the whole month of timed sets in one glance. */}
      <Panel
        eyebrow="Every timed set, in order"
        title="Triage tape"
        aside={
          <span className="num text-xs text-chalk-mute">
            {timedCount} of {sets.length} sets timed
          </span>
        }
      >
        <TriageTape sets={sets} />
      </Panel>

      <div className="grid gap-3 lg:grid-cols-2">
        <Panel
          eyebrow="Was the call right?"
          title="Triage accuracy"
          aside={
            <span className="num text-xs text-chalk-mute">
              {pct(TRIAGE_TARGET)} target
            </span>
          }
        >
          <PairedStat
            label="Triage accuracy"
            all={triageAll}
            rolling={triage7}
            target={TRIAGE_TARGET}
          />
          <div className="mt-4">
            <RatioTrend
              rows={rows}
              metric="triage"
              target={TRIAGE_TARGET}
              color="#2fd8f5"
              targetLabel="60% target"
            />
          </div>
        </Panel>

        <Panel
          eyebrow="Cracked inside the cap?"
          title="Hit rate"
          aside={
            <span className="num text-xs text-chalk-mute">
              {pct(HIT_RATE_TARGET)} target
            </span>
          }
        >
          <PairedStat
            label="Hit rate"
            all={hitAll}
            rolling={hit7}
            target={HIT_RATE_TARGET}
          />
          <div className="mt-4">
            <RatioTrend
              rows={rows}
              metric="hit"
              target={HIT_RATE_TARGET}
              color="#c9f24d"
              targetLabel="40% target"
            />
          </div>
        </Panel>
      </div>

      <Panel
        eyebrow="Which ones can't I recognise yet?"
        title="Archetype coverage"
        aside={
          <span className="num text-xs text-chalk-mute">
            {coverage.filter((c) => c.state === 'solid').length} solid ·{' '}
            {coverage.filter((c) => c.state === 'not started').length} untouched
          </span>
        }
      >
        <div className="space-y-3">
          <div>
            <div className="eyebrow mb-2">Logical Reasoning</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {coverage.slice(0, 9).map((c) => (
                <CoverageCell key={c.archetype} c={c} />
              ))}
            </div>
          </div>
          <div>
            <div className="eyebrow mb-2">Data Interpretation</div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {coverage.slice(9).map((c) => (
                <CoverageCell key={c.archetype} c={c} />
              ))}
            </div>
          </div>
        </div>
        <CoverageLegend />
        <p className="mt-2 text-xs text-chalk-mute">
          Cell shows sets logged and hit rate on timed sets. 1–3 sets is exposure; 4+ splits into
          familiar or solid at 50% hit.
        </p>
      </Panel>

      <Panel
        eyebrow="What kind of mistake dominates?"
        title="Error tag distribution"
        aside={
          <span className="num text-xs text-chalk-mute">{store.errors.length} logged</span>
        }
      >
        {dominantAll.tags.length > 0 ? (
          <div className="mb-4">
            <div className="eyebrow">dominant tag {dominantAll.tags.length > 1 && '(tied)'}</div>
            <div className="mt-1 flex items-baseline gap-2">
              <span
                className="font-display text-2xl leading-none font-medium"
                style={{ color: TAG_COLOR[dominantAll.tags[0]] }}
              >
                {dominantAll.tags.join(' / ')}
              </span>
              <span className="num text-sm text-chalk-mute">
                {dominantAll.count}×
              </span>
            </div>
            {dominant7.tags.length > 0 && (
              <div className="num mt-1 text-xs text-chalk-mute">
                last 7 days: {dominant7.tags.join(' / ')} ({dominant7.count}×)
              </div>
            )}
          </div>
        ) : (
          <div className="mb-4">
            <Notice>No errors logged yet — the dominant tag appears once you log some.</Notice>
          </div>
        )}
        <TagStack rows={rows} />
        <Legend
          items={ERROR_TAGS.map((t) => ({
            color: TAG_COLOR[t],
            label: t,
            value: tagTotals.find((x) => x.tag === t)?.n,
          }))}
        />
      </Panel>

      <Panel eyebrow="Volume" title="QA problems">
        <div className="flex items-end justify-between gap-4">
          <Stat
            label="through today"
            value={pct(qa)}
            sub={`${qa.num} of ${qa.den} problems`}
          />
          <Stat label="sets logged" value={sets.length} sub={`${timedCount} timed`} />
          <Stat
            label="mocks"
            value={store.mocks.length}
            sub={`${store.mocks.filter((m) => !m.analysisDone).length} unanalysed`}
            tone={store.mocks.some((m) => !m.analysisDone) ? 'warning' : 'default'}
          />
        </div>
        <div className="mt-3 h-1.5 overflow-hidden bg-line">
          <div
            className="h-full"
            style={{
              width: `${Math.min(100, (qa.value ?? 0) * 100)}%`,
              background: 'var(--color-qa)',
            }}
          />
        </div>
      </Panel>
    </div>
  );
}
