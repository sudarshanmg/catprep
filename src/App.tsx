import { useState, type ReactElement } from 'react';
import { StoreProvider, useStore } from './store';
import { Today } from './views/Today';
import { Dashboard } from './views/Dashboard';
import { Errors } from './views/Errors';
import { Mocks } from './views/Mocks';
import { Weeks } from './views/Weeks';
import { Audit } from './views/Audit';
import { hitRate, pct, triageAccuracy, unanalysedMocks } from './metrics';
import { SPRINT_END, SPRINT_START } from './seed';
import { fmtDate } from './ui';

type Tab = 'today' | 'metrics' | 'errors' | 'mocks' | 'weeks' | 'audit';

const TABS: { id: Tab; label: string; icon: ReactElement }[] = [
  {
    id: 'today',
    label: 'Today',
    icon: (
      <path d="M3 6.5h12M3 6.5v7.5a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1V6.5M6 4v2.5M12 4v2.5" />
    ),
  },
  {
    id: 'metrics',
    label: 'Metrics',
    icon: <path d="M3 14V8m4 6V4m4 10v-4m4 4V6" />,
  },
  {
    id: 'errors',
    label: 'Errors',
    icon: <path d="M9 3.5 15.5 15h-13L9 3.5ZM9 7.5v3.5M9 12.8v.2" />,
  },
  {
    id: 'mocks',
    label: 'Mocks',
    icon: <path d="M3.5 4h11v11h-11zM6 8h6M6 11h4" />,
  },
  {
    id: 'weeks',
    label: 'Weeks',
    icon: <path d="M3 4h12v11H3zM3 8h12M7 8v7M11 8v7" />,
  },
  {
    id: 'audit',
    label: 'Audit',
    icon: <path d="M11.5 11.5 15 15M4 8.5a4.5 4.5 0 1 0 9 0 4.5 4.5 0 0 0-9 0Z" />,
  },
];

function Shell() {
  const [tab, setTab] = useState<Tab>('today');
  const { store } = useStore();

  const tri = triageAccuracy(store.dilrSets);
  const hit = hitRate(store.dilrSets);
  const pending = unanalysedMocks(store.mocks).length;

  return (
    <div className="min-h-dvh bg-ink pb-[calc(4.5rem+env(safe-area-inset-bottom))] md:pb-8">
      {/* Header: the two numbers that matter, always in view. */}
      <header className="sticky top-0 z-30 border-b border-line bg-ink/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-2.5">
          <div className="min-w-0">
            <h1 className="font-display text-sm leading-none font-bold tracking-tight">
              CAT SPRINT
            </h1>
            <p className="num mt-0.5 text-[0.625rem] leading-none text-chalk-mute">
              {fmtDate(SPRINT_START)} – {fmtDate(SPRINT_END, { day: 'numeric', month: 'short', year: '2-digit' })}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <div className="text-right">
              <div className="eyebrow leading-none">triage</div>
              <div className="num mt-1 text-sm leading-none text-dilr">{pct(tri)}</div>
            </div>
            <div className="text-right">
              <div className="eyebrow leading-none">hit</div>
              <div className="num mt-1 text-sm leading-none text-varc">{pct(hit)}</div>
            </div>
          </div>
        </div>

        {/* Desktop tabs live in the header; mobile gets the bottom bar. */}
        <nav className="mx-auto hidden max-w-5xl gap-1 px-4 md:flex" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => setTab(t.id)}
              className={`relative -mb-px border-b-2 px-3 py-2 text-sm transition-colors ${
                tab === t.id
                  ? 'border-chalk text-chalk'
                  : 'border-transparent text-chalk-mute hover:text-chalk-dim'
              }`}
            >
              {t.label}
              {t.id === 'mocks' && pending > 0 && (
                <span className="num ml-1.5 rounded bg-warning/20 px-1 text-[0.625rem] text-warning">
                  {pending}
                </span>
              )}
            </button>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-5xl px-3 py-3 sm:px-4">
        {tab === 'today' && <Today />}
        {tab === 'metrics' && <Dashboard />}
        {tab === 'errors' && <Errors />}
        {tab === 'mocks' && <Mocks />}
        {tab === 'weeks' && <Weeks />}
        {tab === 'audit' && <Audit />}
      </main>

      <nav
        aria-label="Sections"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
      >
        <div className="flex">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                aria-current={active ? 'page' : undefined}
                onClick={() => setTab(t.id)}
                className="relative flex min-h-[4.25rem] flex-1 flex-col items-center justify-center gap-1 px-1"
              >
                <svg
                  viewBox="0 0 18 18"
                  className="h-[18px] w-[18px]"
                  fill="none"
                  stroke={active ? 'var(--color-chalk)' : 'var(--color-chalk-mute)'}
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  {t.icon}
                </svg>
                <span
                  className={`text-[0.625rem] leading-none ${
                    active ? 'text-chalk' : 'text-chalk-mute'
                  }`}
                >
                  {t.label}
                </span>
                {t.id === 'mocks' && pending > 0 && (
                  <span
                    aria-label={`${pending} unanalysed`}
                    className="absolute top-3 right-1/2 h-1.5 w-1.5 translate-x-3 rounded-full bg-warning"
                  />
                )}
                {active && (
                  <span
                    aria-hidden
                    className="absolute top-0 h-0.5 w-8 rounded-full bg-chalk"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  );
}
