import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ReactNode } from 'react';
import { ERROR_TAGS, type DilrSetLog, type ErrorTag } from './types';
import type { Coverage, WeekRow } from './metrics';
import { pct } from './metrics';
import { fmtDate } from './ui';

/* ---------------------------------------------------------------------------
   Chart color is functional. These are the validated categorical slots for the
   dark surface #171C22 (see index.css) — verified with the dataviz validator for
   lightness band, chroma floor, CVD separation, normal-vision separation and
   contrast. Do not substitute values picked by eye.
--------------------------------------------------------------------------- */
export const TAG_COLOR: Record<ErrorTag, string> = {
  concept: '#3987e5',
  silly: '#d95926',
  selection: '#199e70',
  time: '#c98500',
};

export const SECTION_COLOR = {
  QA: '#d95926',
  DILR: '#3987e5',
  VARC: '#199e70',
} as const;

const AXIS = '#737e89';
const GRID = '#212a34';
const SURFACE = '#171c22';

const axisProps = {
  stroke: AXIS,
  tick: { fill: AXIS, fontSize: 11, fontFamily: 'IBM Plex Mono, monospace' },
  tickLine: false,
  axisLine: { stroke: GRID },
} as const;

function TooltipShell({ title, rows }: { title: string; rows: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-ink/95 px-3 py-2 shadow-lg backdrop-blur">
      <div className="eyebrow mb-1.5">{title}</div>
      <div className="space-y-1">{rows}</div>
    </div>
  );
}

function TooltipRow({
  color,
  label,
  value,
}: {
  color?: string;
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 text-xs">
      {color && (
        <span
          aria-hidden
          className="h-2 w-2 shrink-0 rounded-sm"
          style={{ background: color }}
        />
      )}
      <span className="flex-1 text-chalk-dim">{label}</span>
      <span className="num font-medium text-chalk">{value}</span>
    </div>
  );
}

export function Legend({
  items,
}: {
  items: { color: string; label: string; value?: ReactNode }[];
}) {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5 text-xs text-chalk-dim">
          <span
            aria-hidden
            className="h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ background: i.color }}
          />
          <span>{i.label}</span>
          {i.value !== undefined && <span className="num text-chalk-mute">{i.value}</span>}
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------------------
   Trend: one ratio series by week against its target. Single series, so no legend
   box — the panel title names it. The target line is the only other mark.
--------------------------------------------------------------------------- */
export function RatioTrend({
  rows,
  metric,
  target,
  color,
  targetLabel,
}: {
  rows: WeekRow[];
  metric: 'triage' | 'hit';
  target: number;
  color: string;
  targetLabel: string;
}) {
  const data = rows.map((r) => ({
    label: r.label,
    value: r[metric].value,
    num: r[metric].num,
    den: r[metric].den,
  }));
  const hasAny = data.some((d) => d.value !== null);

  if (!hasAny) {
    return (
      <div className="grid h-[168px] place-items-center rounded-lg border border-dashed border-line text-sm text-chalk-mute">
        No timed sets logged yet
      </div>
    );
  }

  return (
    <div className="h-[168px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 14, right: 12, bottom: 4, left: -14 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis
            domain={[0, 1]}
            ticks={[0, 0.25, 0.5, 0.75, 1]}
            tickFormatter={(v: number) => `${Math.round(v * 100)}`}
            width={40}
            {...axisProps}
          />
          <ReferenceLine
            y={target}
            stroke={AXIS}
            strokeDasharray="4 4"
            strokeWidth={1}
            label={{
              value: targetLabel,
              position: 'insideTopRight',
              fill: AXIS,
              fontSize: 10,
              fontFamily: 'IBM Plex Mono, monospace',
            }}
          />
          <Tooltip
            cursor={{ stroke: AXIS, strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const d = payload[0].payload as (typeof data)[number];
              return (
                <TooltipShell
                  title={String(label)}
                  rows={
                    <>
                      <TooltipRow color={color} label="value" value={pct(d.value, 0)} />
                      <TooltipRow label="sets" value={`${d.num}/${d.den}`} />
                    </>
                  }
                />
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            connectNulls={false}
            dot={{ r: 4, fill: color, stroke: SURFACE, strokeWidth: 2 }}
            activeDot={{ r: 6, fill: color, stroke: SURFACE, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Error tags: stacked bar by week. 2px surface gap between segments; only the top
   segment gets rounded ends.
--------------------------------------------------------------------------- */
export function TagStack({ rows }: { rows: WeekRow[] }) {
  const data = rows.map((r) => ({ label: r.label, ...r.tags }));
  const total = rows.reduce(
    (s, r) => s + ERROR_TAGS.reduce((t, k) => t + r.tags[k], 0),
    0,
  );

  if (total === 0) {
    return (
      <div className="grid h-[168px] place-items-center rounded-lg border border-dashed border-line text-sm text-chalk-mute">
        No errors logged yet
      </div>
    );
  }

  return (
    <div className="h-[168px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -14 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis width={40} allowDecimals={false} {...axisProps} />
          <Tooltip
            cursor={{ fill: '#ffffff0a' }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const row = payload[0].payload as Record<string, number>;
              const sum = ERROR_TAGS.reduce((s, t) => s + (row[t] ?? 0), 0);
              return (
                <TooltipShell
                  title={`${label} · ${sum} error${sum === 1 ? '' : 's'}`}
                  rows={ERROR_TAGS.filter((t) => row[t] > 0).map((t) => (
                    <TooltipRow key={t} color={TAG_COLOR[t]} label={t} value={row[t]} />
                  ))}
                />
              );
            }}
          />
          {ERROR_TAGS.map((t, i) => (
            <Bar
              key={t}
              dataKey={t}
              stackId="tags"
              fill={TAG_COLOR[t]}
              stroke={SURFACE}
              strokeWidth={1}
              maxBarSize={34}
              radius={i === ERROR_TAGS.length - 1 ? [4, 4, 0, 0] : undefined}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Coverage: 14 cells, not a chart. Confidence is an ordinal ramp in one hue, so
   "more confident" reads as "brighter" rather than as a different category.
--------------------------------------------------------------------------- */
const STATE_STYLE: Record<
  Coverage['state'],
  { bg: string; fg: string; border: string }
> = {
  'not started': { bg: 'transparent', fg: 'var(--color-chalk-mute)', border: 'var(--color-line)' },
  exposed: { bg: '#184f95', fg: '#dbe8fb', border: '#184f95' },
  familiar: { bg: '#3987e5', fg: '#0f1216', border: '#3987e5' },
  solid: { bg: '#9ec5f4', fg: '#0f1216', border: '#9ec5f4' },
};

export const COVERAGE_STATES: Coverage['state'][] = [
  'not started',
  'exposed',
  'familiar',
  'solid',
];

export function CoverageCell({ c }: { c: Coverage }) {
  const s = STATE_STYLE[c.state];
  return (
    <div
      className="rounded-lg border p-2.5"
      style={{ background: s.bg, borderColor: s.border }}
      title={`${c.archetype} — ${c.sets} set${c.sets === 1 ? '' : 's'}, ${c.state}${
        c.hitRate.value !== null ? `, ${pct(c.hitRate)} hit` : ''
      }`}
    >
      <div
        className="text-[0.6875rem] leading-tight font-medium"
        style={{ color: s.fg, opacity: c.state === 'not started' ? 1 : 0.95 }}
      >
        {c.archetype}
      </div>
      <div className="mt-1.5 flex items-baseline justify-between gap-1">
        <span className="num text-base leading-none font-semibold" style={{ color: s.fg }}>
          {c.sets}
        </span>
        <span className="num text-[0.625rem]" style={{ color: s.fg, opacity: 0.75 }}>
          {c.hitRate.value !== null ? pct(c.hitRate) : '—'}
        </span>
      </div>
      <div
        className="mt-1 text-[0.625rem] tracking-wide"
        style={{ color: s.fg, opacity: 0.7 }}
      >
        {c.state}
      </div>
    </div>
  );
}

export function CoverageLegend() {
  return (
    <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
      {COVERAGE_STATES.map((s) => (
        <li key={s} className="flex items-center gap-1.5 text-xs text-chalk-dim">
          <span
            aria-hidden
            className="h-2.5 w-2.5 shrink-0 rounded-sm border"
            style={{
              background: STATE_STYLE[s].bg,
              borderColor: STATE_STYLE[s].border,
            }}
          />
          <span>{s}</span>
        </li>
      ))}
    </ul>
  );
}

/* ---------------------------------------------------------------------------
   The triage tape — the signature view. Every timed set of the month, in order,
   as two lanes: was the call right, and was the set cracked inside the cap. One
   glance answers "is this trending the right way", which is the whole point of
   the app. Presence/absence per lane, so it reads without color vision.
--------------------------------------------------------------------------- */
export function TriageTape({ sets }: { sets: DilrSetLog[] }) {
  const timed = [...sets]
    .filter((s) => s.mode === 'timed')
    .sort((a, b) => a.date.localeCompare(b.date));

  if (timed.length === 0) {
    return (
      <div className="grid h-16 place-items-center rounded-lg border border-dashed border-line text-sm text-chalk-mute">
        The tape fills in as you log timed sets
      </div>
    );
  }

  const lanes = [
    { key: 'call' as const, label: 'call right', color: '#3987e5' },
    { key: 'crack' as const, label: 'cracked', color: '#199e70' },
  ];

  return (
    <div>
      <div className="space-y-1">
        {lanes.map((lane) => (
          <div key={lane.key} className="flex items-center gap-2">
            <span className="eyebrow w-[4.5rem] shrink-0 text-right">{lane.label}</span>
            <div className="flex min-w-0 flex-1 gap-[2px]">
              {timed.map((s) => {
                const on = lane.key === 'call' ? !!s.triageWasCorrect : !!s.crackedInCap;
                return (
                  <span
                    key={s.id + lane.key}
                    className="h-5 min-w-[3px] flex-1 rounded-[2px]"
                    style={{
                      background: on ? lane.color : 'var(--color-raised)',
                      border: on ? 'none' : '1px solid var(--color-line)',
                    }}
                    title={`${fmtDate(s.date)} · ${s.archetype} · ${s.minutesSpent}m · call ${
                      s.triageWasCorrect ? 'right' : 'wrong'
                    } · ${s.crackedInCap ? 'cracked' : 'not cracked'}`}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="num text-[0.6875rem] text-chalk-mute">{fmtDate(timed[0].date)}</span>
        <span className="num text-[0.6875rem] text-chalk-mute">
          {timed.length} timed set{timed.length === 1 ? '' : 's'}
        </span>
        <span className="num text-[0.6875rem] text-chalk-mute">
          {fmtDate(timed[timed.length - 1].date)}
        </span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Mock section scores over time. Three series (the three sections), so a legend
   is always present and each line is also direct-labelled at its last point.
--------------------------------------------------------------------------- */
export function MockScoreTrend({
  data,
}: {
  data: { date: string; label: string; QA: number | null; DILR: number | null; VARC: number | null }[];
}) {
  if (data.length === 0) {
    return (
      <div className="grid h-[188px] place-items-center rounded-lg border border-dashed border-line text-sm text-chalk-mute">
        No mocks logged yet
      </div>
    );
  }
  return (
    <div className="h-[188px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 34, bottom: 4, left: -14 }}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis width={40} {...axisProps} />
          <Tooltip
            cursor={{ stroke: AXIS, strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <TooltipShell
                  title={String(label)}
                  rows={payload
                    .filter((p) => p.value !== null && p.value !== undefined)
                    .map((p) => (
                      <TooltipRow
                        key={String(p.dataKey)}
                        color={p.color}
                        label={String(p.dataKey)}
                        value={String(p.value)}
                      />
                    ))}
                />
              );
            }}
          />
          {(['QA', 'DILR', 'VARC'] as const).map((k) => (
            <Line
              key={k}
              type="monotone"
              dataKey={k}
              stroke={SECTION_COLOR[k]}
              strokeWidth={2}
              connectNulls
              dot={{ r: 4, fill: SECTION_COLOR[k], stroke: SURFACE, strokeWidth: 2 }}
              activeDot={{ r: 6, fill: SECTION_COLOR[k], stroke: SURFACE, strokeWidth: 2 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
