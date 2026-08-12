import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { createElement } from 'react';
import type { DayLog, DilrSetLog, ErrorLogEntry, MockResult, Store } from './types';
import { emptyDayLog } from './types';
import { SPRINT_END, SPRINT_START } from './seed';

const KEY = 'catprep:v1';

const EMPTY: Store = { dayLogs: {}, dilrSets: [], errors: [], mocks: [] };

function load(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Store>;
    return {
      dayLogs: parsed.dayLogs ?? {},
      dilrSets: parsed.dilrSets ?? [],
      errors: parsed.errors ?? [],
      mocks: parsed.mocks ?? [],
    };
  } catch {
    // A corrupt blob should not brick the app at 22:30.
    return EMPTY;
  }
}

export const newId = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

/** Local calendar date as 'YYYY-MM-DD' (not UTC — the user's day is the local one). */
export function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

/** The sprint is a fixed window; before it starts or after it ends, clamp to an edge. */
export function clampToSprint(date: string): string {
  if (date < SPRINT_START) return SPRINT_START;
  if (date > SPRINT_END) return SPRINT_END;
  return date;
}

type Ctx = {
  store: Store;
  /** The date the app is logging against — today, clamped into the sprint. */
  activeDate: string;
  setActiveDate: (d: string) => void;
  isBeforeSprint: boolean;
  isAfterSprint: boolean;

  dayLog: (date: string) => DayLog;
  patchDayLog: (date: string, patch: Partial<DayLog>) => void;

  addDilrSet: (s: Omit<DilrSetLog, 'id'>) => void;
  deleteDilrSet: (id: string) => void;

  addError: (e: Omit<ErrorLogEntry, 'id'>) => void;
  deleteError: (id: string) => void;

  upsertMock: (m: Omit<MockResult, 'id'> & { id?: string }) => void;
  deleteMock: (id: string) => void;

  exportJSON: () => void;
  importJSON: (file: File) => Promise<void>;
  resetAll: () => void;
};

const StoreCtx = createContext<Ctx | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<Store>(load);
  const [activeDate, setActiveDateRaw] = useState<string>(() => clampToSprint(todayISO()));

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(store));
    } catch {
      // Storage full or blocked — the session still works, it just won't persist.
    }
  }, [store]);

  const real = todayISO();

  const setActiveDate = useCallback((d: string) => setActiveDateRaw(clampToSprint(d)), []);

  const dayLog = useCallback(
    (date: string) => store.dayLogs[date] ?? emptyDayLog(date),
    [store.dayLogs],
  );

  const patchDayLog = useCallback((date: string, patch: Partial<DayLog>) => {
    setStore((s) => ({
      ...s,
      dayLogs: {
        ...s.dayLogs,
        [date]: { ...(s.dayLogs[date] ?? emptyDayLog(date)), ...patch, date },
      },
    }));
  }, []);

  const addDilrSet = useCallback((set: Omit<DilrSetLog, 'id'>) => {
    setStore((s) => ({ ...s, dilrSets: [...s.dilrSets, { ...set, id: newId() }] }));
  }, []);

  const deleteDilrSet = useCallback((id: string) => {
    setStore((s) => ({ ...s, dilrSets: s.dilrSets.filter((x) => x.id !== id) }));
  }, []);

  const addError = useCallback((e: Omit<ErrorLogEntry, 'id'>) => {
    setStore((s) => ({ ...s, errors: [...s.errors, { ...e, id: newId() }] }));
  }, []);

  const deleteError = useCallback((id: string) => {
    setStore((s) => ({ ...s, errors: s.errors.filter((x) => x.id !== id) }));
  }, []);

  const upsertMock = useCallback((m: Omit<MockResult, 'id'> & { id?: string }) => {
    setStore((s) => {
      if (m.id && s.mocks.some((x) => x.id === m.id)) {
        return {
          ...s,
          mocks: s.mocks.map((x) => (x.id === m.id ? ({ ...x, ...m } as MockResult) : x)),
        };
      }
      return { ...s, mocks: [...s.mocks, { ...m, id: m.id ?? newId() } as MockResult] };
    });
  }, []);

  const deleteMock = useCallback((id: string) => {
    setStore((s) => ({ ...s, mocks: s.mocks.filter((x) => x.id !== id) }));
  }, []);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(store, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `catprep-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [store]);

  const importJSON = useCallback(async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text) as Partial<Store>;
    setStore({
      dayLogs: parsed.dayLogs ?? {},
      dilrSets: parsed.dilrSets ?? [],
      errors: parsed.errors ?? [],
      mocks: parsed.mocks ?? [],
    });
  }, []);

  const resetAll = useCallback(() => setStore(EMPTY), []);

  const value = useMemo<Ctx>(
    () => ({
      store,
      activeDate,
      setActiveDate,
      isBeforeSprint: real < SPRINT_START,
      isAfterSprint: real > SPRINT_END,
      dayLog,
      patchDayLog,
      addDilrSet,
      deleteDilrSet,
      addError,
      deleteError,
      upsertMock,
      deleteMock,
      exportJSON,
      importJSON,
      resetAll,
    }),
    [
      store,
      activeDate,
      setActiveDate,
      real,
      dayLog,
      patchDayLog,
      addDilrSet,
      deleteDilrSet,
      addError,
      deleteError,
      upsertMock,
      deleteMock,
      exportJSON,
      importJSON,
      resetAll,
    ],
  );

  return createElement(StoreCtx.Provider, { value }, children);
}

export function useStore(): Ctx {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error('useStore must be used inside StoreProvider');
  return ctx;
}
