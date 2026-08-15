import { useMemo, useState } from 'react';
import { useStore } from '../store';
import { mocksByDate, unanalysedMocks } from '../metrics';
import { Legend, MockScoreTrend, SECTION_COLOR } from '../charts';
import { Button, Empty, Notice, Panel, Stat, fmtDate } from '../ui';
import { MockForm } from './MockForm';
import { SECTIONS } from '../types';

export function Mocks() {
  const { store, activeDate, deleteMock, upsertMock } = useStore();
  const [editing, setEditing] = useState<string | 'new' | null>(null);

  const sorted = useMemo(() => mocksByDate(store.mocks), [store.mocks]);
  const pending = unanalysedMocks(store.mocks);

  const chartData = useMemo(
    () =>
      sorted.map((m, i) => ({
        date: m.date,
        label: m.name?.slice(0, 8) ?? `${m.kind === 'full' ? 'M' : 'S'}${i + 1}`,
        QA: m.qa?.score ?? null,
        DILR: m.dilr?.score ?? null,
        VARC: m.varc?.score ?? null,
      })),
    [sorted],
  );

  const best = (k: 'qa' | 'dilr' | 'varc') => {
    const vals = sorted.map((m) => m[k]?.score).filter((v): v is number => v !== undefined);
    return vals.length ? Math.max(...vals) : null;
  };

  const editingMock = editing && editing !== 'new' ? sorted.find((m) => m.id === editing) : undefined;

  return (
    <div className="space-y-3">
      {pending.length > 0 && (
        <Notice tone="warning">
          <strong className="font-semibold text-chalk">
            {pending.length} unanalysed mock{pending.length === 1 ? '' : 's'}
          </strong>
          {' — '}
          {pending.map((m) => m.name ?? fmtDate(m.date)).join(', ')}. An unanalysed mock is a
          wasted mock.
        </Notice>
      )}

      <Panel
        eyebrow="Section scores over time"
        title="Mock trend"
        aside={
          <span className="num text-xs text-chalk-mute">
            {sorted.length} logged
          </span>
        }
      >
        <MockScoreTrend data={chartData} />
        <Legend
          items={SECTIONS.map((s) => ({
            color: SECTION_COLOR[s],
            label: s,
            value: best(s === 'QA' ? 'qa' : s === 'DILR' ? 'dilr' : 'varc') ?? undefined,
          }))}
        />
        <p className="mt-2 text-xs text-chalk-mute">Legend values are each section's best score.</p>
      </Panel>

      <Panel
        eyebrow="All mocks"
        title="Results"
        aside={
          <Button onClick={() => setEditing(editing === 'new' ? null : 'new')}>
            {editing === 'new' ? 'Close' : 'Add a mock'}
          </Button>
        }
      >
        {editing === 'new' && (
          <div className="mb-4 border border-line bg-raised/40 p-3">
            <MockForm date={activeDate} onDone={() => setEditing(null)} />
          </div>
        )}

        {sorted.length === 0 ? (
          <Empty>No mocks yet. Mock 1 lands on 16 Aug.</Empty>
        ) : (
          <div className="-mx-1 overflow-x-auto">
            <table className="w-full min-w-[34rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-line">
                  {['date', 'mock', 'varc', 'dilr', 'qa', 'total', '%ile', ''].map((h) => (
                    <th key={h} className="eyebrow px-2 py-2 text-left font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((m) => {
                  const total =
                    (m.varc?.score ?? 0) + (m.dilr?.score ?? 0) + (m.qa?.score ?? 0);
                  return (
                    <tr key={m.id} className="border-b border-line-soft">
                      <td className="num px-2 py-2.5 whitespace-nowrap text-chalk-dim">
                        {fmtDate(m.date)}
                      </td>
                      <td className="px-2 py-2.5">
                        <button
                          type="button"
                          onClick={() => setEditing(editing === m.id ? null : m.id)}
                          className="text-left text-chalk hover:underline"
                        >
                          {m.name ?? (m.kind === 'full' ? 'Full mock' : 'Sectional')}
                        </button>
                        {!m.analysisDone && (
                          <span
                            className="num ml-2 px-1.5 py-0.5 text-[0.625rem]"
                            style={{
                              background: 'color-mix(in oklab, var(--color-warning) 20%, transparent)',
                              color: 'var(--color-warning)',
                            }}
                          >
                            unanalysed
                          </span>
                        )}
                      </td>
                      {(['varc', 'dilr', 'qa'] as const).map((k) => (
                        <td key={k} className="num px-2 py-2.5">
                          {m[k] ? (
                            <span
                              style={{
                                color:
                                  SECTION_COLOR[
                                    k === 'qa' ? 'QA' : k === 'dilr' ? 'DILR' : 'VARC'
                                  ],
                              }}
                            >
                              {m[k]!.score}
                            </span>
                          ) : (
                            <span className="text-chalk-mute">—</span>
                          )}
                        </td>
                      ))}
                      <td className="num px-2 py-2.5 font-semibold">{total}</td>
                      <td className="num px-2 py-2.5 text-chalk-dim">
                        {m.overallPercentile ?? '—'}
                      </td>
                      <td className="px-2 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => deleteMock(m.id)}
                          aria-label={`Delete mock ${m.name ?? m.date}`}
                          className="text-chalk-mute hover:text-critical"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {editingMock && (
          <div className="mt-4 border border-line bg-raised/40 p-3">
            <div className="eyebrow mb-3">
              Editing {editingMock.name ?? fmtDate(editingMock.date)}
            </div>
            <MockForm
              date={editingMock.date}
              existing={editingMock}
              onDone={() => setEditing(null)}
            />
          </div>
        )}
      </Panel>

      {sorted.length > 0 && (
        <Panel eyebrow="Analysis discipline" title="Follow-through">
          <div className="flex items-end justify-between gap-4">
            <Stat
              label="analysed"
              value={`${sorted.length - pending.length}/${sorted.length}`}
              tone={pending.length === 0 ? 'good' : 'warning'}
            />
            <Stat
              label="best total"
              value={Math.max(
                ...sorted.map(
                  (m) => (m.varc?.score ?? 0) + (m.dilr?.score ?? 0) + (m.qa?.score ?? 0),
                ),
              )}
            />
            {pending.length > 0 && (
              <Button
                onClick={() =>
                  pending.forEach((m) => upsertMock({ ...m, analysisDone: true }))
                }
              >
                Mark all analysed
              </Button>
            )}
          </div>
        </Panel>
      )}
    </div>
  );
}
