import { useState } from 'react';
import {
  PLAN_BY_DATE,
  SPRINT_DAYS,
  SPRINT_END,
  SPRINT_START,
  dayNumber,
  mockNumberFor,
  rcDatesForWeek,
  weekForDate,
} from '../seed';
import { useStore } from '../store';
import { currentStreak, shiftDate } from '../metrics';
import { SECTION_COLOR } from '../charts';
import { Button, CheckRow, Notice, Panel, Stepper, fmtDate, fmtWeekday } from '../ui';
import { DilrLogger } from './DilrLogger';
import { MockForm } from './MockForm';
import { TIMED_CAP_MIN } from '../types';

export function Today() {
  const { activeDate, setActiveDate, store, dayLog, patchDayLog, deleteDilrSet, isBeforeSprint } =
    useStore();
  const [loggerOpen, setLoggerOpen] = useState(false);

  const plan = PLAN_BY_DATE[activeDate];
  const week = weekForDate(activeDate);
  const log = dayLog(activeDate);
  const todaysSets = store.dilrSets.filter((s) => s.date === activeDate);
  const mock = store.mocks.find((m) => m.date === activeDate);
  const streak = currentStreak(store, activeDate);

  const isMockDay = plan?.dayType === 'fullmock';
  const mockNo = mockNumberFor(activeDate);
  // Which of the week's RC passages this is — "RC day 2 of 4" is more useful than "1 RC".
  const rcDayOrdinal = rcDatesForWeek(plan?.weekId ?? 0).indexOf(activeDate) + 1;
  const atStart = activeDate <= SPRINT_START;
  const atEnd = activeDate >= SPRINT_END;

  if (!plan) {
    return (
      <Panel eyebrow="Off-plan" title="No plan for this date">
        <Notice>The sprint runs {fmtDate(SPRINT_START)} – {fmtDate(SPRINT_END)}.</Notice>
      </Panel>
    );
  }

  return (
    <div className="space-y-3">
      {/* Date bar — doubles as the backfill control for a day logged late. */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveDate(shiftDate(activeDate, -1))}
          disabled={atStart}
          aria-label="Previous day"
          className="grid h-11 w-11 shrink-0 place-items-center border border-line bg-slate text-chalk-dim transition-colors hover:border-neon hover:text-neon disabled:opacity-30 disabled:hover:border-line disabled:hover:text-chalk-dim"
        >
          ‹
        </button>
        <div className="min-w-0 flex-1 text-center">
          <div className="eyebrow">
            {week?.label} · day {dayNumber(activeDate)} of {SPRINT_DAYS}
            {plan.dayType !== 'study' && ` · ${plan.dayType === 'fullmock' ? 'full mock' : 'sectional pair'}`}
            {plan.consolidation && ' · consolidation'}
          </div>
          <h1 className="font-display text-xl leading-tight font-medium">
            {fmtWeekday(activeDate)}{' '}
            <span className="num text-chalk-dim">{fmtDate(activeDate)}</span>
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setActiveDate(shiftDate(activeDate, 1))}
          disabled={atEnd}
          aria-label="Next day"
          className="grid h-11 w-11 shrink-0 place-items-center border border-line bg-slate text-chalk-dim transition-colors hover:border-neon hover:text-neon disabled:opacity-30 disabled:hover:border-line disabled:hover:text-chalk-dim"
        >
          ›
        </button>
      </div>

      {isBeforeSprint && (
        <Notice>
          The sprint starts {fmtDate(SPRINT_START)}. You're looking at day one — log against it
          from tomorrow.
        </Notice>
      )}

      {isMockDay ? (
        /* Mock day: the checklist is replaced by the result form. */
        <Panel
          eyebrow={mockNo ? `Full Mock ${mockNo} of 8` : 'Full mock day'}
          title={mock ? 'Mock result' : 'Log mock result'}
          aside={
            <span className="num text-xs text-chalk-mute">
              {plan.varcTask}
            </span>
          }
        >
          <MockForm date={activeDate} defaultKind="full" existing={mock} />
        </Panel>
      ) : (
        <>
          {/* DILR first — it's the primary action of the day. */}
          <Panel
            eyebrow="DILR"
            title={
              <span className="num">
                {todaysSets.length}{' '}
                <span className="font-sans text-base font-normal text-chalk-dim">
                  of {plan.dilrSetTarget} sets logged
                </span>
              </span>
            }
            aside={
              <span className="num text-xs text-chalk-mute">{TIMED_CAP_MIN}m cap</span>
            }
          >
            <div className="mb-3 flex gap-1.5" aria-hidden>
              {Array.from({ length: Math.max(plan.dilrSetTarget, todaysSets.length) }).map(
                (_, i) => (
                  <span
                    key={i}
                    /* Filled pips are lit, like the bar's workspace indicator. */
                    className={i < todaysSets.length ? 'glow h-1.5 flex-1' : 'h-1.5 flex-1'}
                    style={{
                      background:
                        i < todaysSets.length ? SECTION_COLOR.DILR : 'var(--color-line)',
                      ['--glow' as string]: SECTION_COLOR.DILR,
                    }}
                  />
                ),
              )}
            </div>

            <Button variant="primary" onClick={() => setLoggerOpen(true)} full>
              Log a set
            </Button>

            {todaysSets.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {todaysSets.map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center gap-2 bg-raised/50 px-2.5 py-2 text-xs"
                  >
                    <span className="min-w-0 flex-1 truncate text-chalk">{s.archetype}</span>
                    <span className="num text-chalk-mute">{s.minutesSpent}m</span>
                    {s.mode === 'timed' ? (
                      <>
                        <span
                          className="num px-1.5 py-0.5 text-[0.625rem]"
                          style={{
                            background: s.crackedInCap
                              ? 'color-mix(in oklab, var(--color-varc) 20%, transparent)'
                              : 'var(--color-line)',
                            color: s.crackedInCap ? 'var(--color-varc)' : 'var(--color-chalk-mute)',
                          }}
                        >
                          {s.crackedInCap ? 'cracked' : 'no crack'}
                        </span>
                        <span
                          className="num px-1.5 py-0.5 text-[0.625rem]"
                          style={{
                            background: s.triageWasCorrect
                              ? 'color-mix(in oklab, var(--color-dilr) 20%, transparent)'
                              : 'var(--color-line)',
                            color: s.triageWasCorrect
                              ? 'var(--color-dilr)'
                              : 'var(--color-chalk-mute)',
                          }}
                        >
                          {s.triageWasCorrect ? 'call ✓' : 'call ✗'}
                        </span>
                      </>
                    ) : (
                      <span className="num bg-line px-1.5 py-0.5 text-[0.625rem] text-chalk-mute">
                        learning
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteDilrSet(s.id)}
                      aria-label={`Delete ${s.archetype} set`}
                      className="text-chalk-mute hover:text-critical"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {/* QA */}
          <Panel
            eyebrow="QA"
            title={plan.qaTopics.length > 0 ? plan.qaTopics.join(' · ') : 'Review'}
            aside={
              week && <span className="num text-xs text-chalk-mute">{week.qaTheme}</span>
            }
          >
            {plan.qaProblemTarget > 0 ? (
              <Stepper
                label="problems solved"
                value={log.qaProblemsSolved}
                onChange={(v) => patchDayLog(activeDate, { qaProblemsSolved: v })}
                target={plan.qaProblemTarget}
              />
            ) : (
              <Notice>
                {plan.consolidation
                  ? 'Cold review day — no new problems. Rebuild the formula sheet from memory first.'
                  : 'No problem target today.'}
              </Notice>
            )}
            <div className="mt-3">
              <CheckRow
                checked={log.qaConceptDone}
                onChange={(v) => patchDayLog(activeDate, { qaConceptDone: v })}
                label={plan.consolidation ? 'Cold review done' : 'Concept work done'}
                accent={SECTION_COLOR.QA}
              />
            </div>
          </Panel>

          {/* VARC + habits. RC is a weekly quota, so some days carry no VARC drill at
              all — on those the reading toggle is the whole VARC slot. */}
          <Panel
            eyebrow={
              plan.varcKind === 'rc'
                ? `VARC · RC day ${rcDayOrdinal} of ${week?.rcPassages}`
                : 'VARC & habits'
            }
            title={plan.varcTask}
          >
            <div className="space-y-2">
              {plan.varcKind !== 'reading' && (
                <CheckRow
                  checked={log.varcDone}
                  onChange={(v) => patchDayLog(activeDate, { varcDone: v })}
                  label={plan.varcKind === 'rc' ? 'RC passage done' : 'Non-RC drill done'}
                  hint={plan.varcTask}
                  accent={SECTION_COLOR.VARC}
                />
              )}
              <CheckRow
                checked={log.readingDone}
                onChange={(v) => patchDayLog(activeDate, { readingDone: v })}
                label="Daily reading done"
                accent={SECTION_COLOR.VARC}
              />
              <CheckRow
                checked={log.formulaSheetUpdated}
                onChange={(v) => patchDayLog(activeDate, { formulaSheetUpdated: v })}
                label="Formula sheet updated"
              />
            </div>
          </Panel>

          {plan.dayType === 'sectional' && (
            <Panel eyebrow="Sectional pair" title="Log the sectional result">
              <MockForm
                date={activeDate}
                defaultKind="sectional"
                existing={store.mocks.find((m) => m.date === activeDate)}
              />
            </Panel>
          )}
        </>
      )}

      <Panel eyebrow="Notes" title={undefined}>
        <textarea
          className="min-h-20 w-full resize-y border border-line bg-raised px-3 py-2 text-sm text-chalk placeholder:text-chalk-mute focus:border-chalk-mute"
          value={log.notes ?? ''}
          onChange={(e) => patchDayLog(activeDate, { notes: e.target.value })}
          placeholder="Anything worth remembering about today"
        />
        <p className="num mt-2 text-xs text-chalk-mute">
          {streak > 0 ? `${streak}-day streak` : 'No streak yet — start one whenever.'}
        </p>
      </Panel>

      {loggerOpen && <DilrLogger date={activeDate} onClose={() => setLoggerOpen(false)} />}
    </div>
  );
}
