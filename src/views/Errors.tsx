import { useMemo, useState } from 'react';
import { ERROR_TAGS, SECTIONS, type ErrorTag, type Section } from '../types';
import { useStore } from '../store';
import { WEEKS, weekIdForDate } from '../seed';
import { TAG_COLOR, SECTION_COLOR } from '../charts';
import { tagCounts } from '../metrics';
import {
  Button,
  Empty,
  Field,
  Panel,
  Segmented,
  fmtDate,
  inputClass,
  selectClass,
} from '../ui';

const TAG_HINT: Record<ErrorTag, string> = {
  concept: "didn't know it",
  silly: 'knew it, slipped',
  selection: 'wrong question to pick',
  time: 'ran out of clock',
};

export function Errors() {
  const { store, activeDate, addError, deleteError } = useStore();

  const [section, setSection] = useState<Section>('QA');
  const [tag, setTag] = useState<ErrorTag | undefined>();
  const [topic, setTopic] = useState('');
  const [note, setNote] = useState('');

  const [fSection, setFSection] = useState<Section | 'all'>('all');
  const [fTag, setFTag] = useState<ErrorTag | 'all'>('all');
  const [fWeek, setFWeek] = useState<number | 'all'>('all');

  const filtered = useMemo(
    () =>
      [...store.errors]
        .filter((e) => fSection === 'all' || e.section === fSection)
        .filter((e) => fTag === 'all' || e.tag === fTag)
        .filter((e) => fWeek === 'all' || weekIdForDate(e.date) === fWeek)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [store.errors, fSection, fTag, fWeek],
  );

  const counts = tagCounts(filtered);

  function add() {
    if (!topic.trim() || !tag) return;
    addError({
      date: activeDate,
      section,
      topic: topic.trim(),
      tag,
      ...(note.trim() ? { note: note.trim() } : {}),
    });
    setTopic('');
    setNote('');
    setTag(undefined);
  }

  return (
    <div className="space-y-3">
      <Panel eyebrow={`Logging against ${fmtDate(activeDate)}`} title="Add an error">
        <div className="space-y-4">
          <Segmented
            label="Section"
            value={section}
            onChange={setSection}
            options={SECTIONS.map((s) => ({ value: s, label: s }))}
            colorFor={(s) => SECTION_COLOR[s]}
          />

          <Segmented
            label="Tag"
            value={tag}
            onChange={setTag}
            columns={2}
            options={ERROR_TAGS.map((t) => ({
              value: t,
              label: t,
              hint: TAG_HINT[t],
            }))}
            colorFor={(t) => TAG_COLOR[t]}
          />

          <Field label="Topic">
            <input
              className={inputClass}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Remainders — Fermat"
              onKeyDown={(e) => e.key === 'Enter' && add()}
            />
          </Field>

          <Field label="Note" hint="Optional">
            <input
              className={inputClass}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What exactly went wrong"
            />
          </Field>

          <Button variant="primary" onClick={add} disabled={!topic.trim() || !tag} full>
            Add error
          </Button>
        </div>
      </Panel>

      <Panel
        eyebrow={`${filtered.length} of ${store.errors.length} shown`}
        title="Error log"
        aside={
          <div className="flex flex-wrap justify-end gap-1.5">
            {ERROR_TAGS.filter((t) => counts[t] > 0).map((t) => (
              <span
                key={t}
                className="num rounded px-1.5 py-0.5 text-[0.625rem]"
                style={{
                  background: `color-mix(in oklab, ${TAG_COLOR[t]} 20%, transparent)`,
                  color: TAG_COLOR[t],
                }}
              >
                {t} {counts[t]}
              </span>
            ))}
          </div>
        }
      >
        <div className="mb-3 grid grid-cols-3 gap-2">
          <select
            className={selectClass}
            value={fSection}
            onChange={(e) => setFSection(e.target.value as Section | 'all')}
            aria-label="Filter by section"
          >
            <option value="all">All sections</option>
            {SECTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={fTag}
            onChange={(e) => setFTag(e.target.value as ErrorTag | 'all')}
            aria-label="Filter by tag"
          >
            <option value="all">All tags</option>
            {ERROR_TAGS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            className={selectClass}
            value={fWeek}
            onChange={(e) =>
              setFWeek(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            aria-label="Filter by week"
          >
            <option value="all">All weeks</option>
            {WEEKS.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </select>
        </div>

        {filtered.length === 0 ? (
          <Empty>
            {store.errors.length === 0
              ? 'Nothing logged yet.'
              : 'No errors match these filters.'}
          </Empty>
        ) : (
          <ul className="divide-y divide-line-soft">
            {filtered.map((e) => (
              <li key={e.id} className="flex items-start gap-3 py-2.5">
                <span
                  className="mt-1 h-2.5 w-2.5 shrink-0 rounded-sm"
                  style={{ background: TAG_COLOR[e.tag] }}
                  title={e.tag}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className="text-sm text-chalk">{e.topic}</span>
                    <span className="num text-[0.6875rem] text-chalk-mute">
                      {e.section} · {e.tag} · {fmtDate(e.date)}
                    </span>
                  </div>
                  {e.note && <p className="mt-0.5 text-xs text-chalk-dim">{e.note}</p>}
                </div>
                <button
                  type="button"
                  onClick={() => deleteError(e.id)}
                  aria-label={`Delete error ${e.topic}`}
                  className="shrink-0 px-1 text-chalk-mute hover:text-critical"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
