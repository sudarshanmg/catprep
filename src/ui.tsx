import type { ReactNode } from 'react';

/* ---------------------------------------------------------------------------
   Shared primitives. Two rules hold everywhere:
   - every number wears `.num` (mono, tabular) so metric columns align
   - anything tappable is at least 44px tall; the logging forms are used at 22:30
--------------------------------------------------------------------------- */

export function Panel({
  eyebrow,
  title,
  aside,
  children,
  className = '',
}: {
  eyebrow?: string;
  title?: ReactNode;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-line bg-slate p-4 sm:p-5 ${className}`}
    >
      {(eyebrow || title || aside) && (
        <header className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            {title && (
              <h2 className="mt-1 font-display text-lg leading-tight font-medium text-chalk">
                {title}
              </h2>
            )}
          </div>
          {aside && <div className="shrink-0 text-right">{aside}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

export function Stat({
  label,
  value,
  sub,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: 'default' | 'good' | 'warning' | 'critical';
}) {
  const toneClass =
    tone === 'good'
      ? 'text-good'
      : tone === 'warning'
        ? 'text-warning'
        : tone === 'critical'
          ? 'text-critical'
          : 'text-chalk';
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div className={`num mt-1 text-2xl leading-none font-medium ${toneClass}`}>{value}</div>
      {sub && <div className="num mt-1.5 text-xs text-chalk-mute">{sub}</div>}
    </div>
  );
}

/** A full-width checkbox row. The whole row is the target, not just the box. */
export function CheckRow({
  checked,
  onChange,
  label,
  hint,
  accent,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
  accent?: string;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-14 w-full items-center gap-3 rounded-lg border border-line-soft bg-raised/50 px-3 text-left transition-colors hover:bg-raised active:bg-raised"
    >
      <span
        aria-hidden
        className="grid h-6 w-6 shrink-0 place-items-center rounded-[5px] border-2 transition-colors"
        style={{
          borderColor: checked ? (accent ?? 'var(--color-chalk)') : 'var(--color-line)',
          background: checked ? (accent ?? 'var(--color-chalk)') : 'transparent',
        }}
      >
        {checked && (
          <svg viewBox="0 0 14 14" className="h-3.5 w-3.5" fill="none">
            <path
              d="M2 7.5 5.5 11 12 3.5"
              stroke="var(--color-ink)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-[0.9375rem] leading-snug ${
            checked ? 'text-chalk-dim line-through decoration-chalk-mute' : 'text-chalk'
          }`}
        >
          {label}
        </span>
        {hint && <span className="num mt-0.5 block text-xs text-chalk-mute">{hint}</span>}
      </span>
    </button>
  );
}

/** −/+ counter. Big targets; the number is the centrepiece. */
export function Stepper({
  value,
  onChange,
  target,
  step = 1,
  min = 0,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  target?: number;
  step?: number;
  min?: number;
  label: string;
}) {
  const btn =
    'grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-line bg-raised text-xl text-chalk transition-colors hover:border-chalk-mute active:bg-line disabled:opacity-30';
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.max(min, value - step))}
        disabled={value <= min}
        aria-label={`Decrease ${label}`}
      >
        −
      </button>
      <div className="flex-1 text-center">
        <div className="num text-3xl leading-none font-medium text-chalk">
          {value}
          {target !== undefined && (
            <span className="text-lg text-chalk-mute"> / {target}</span>
          )}
        </div>
        <div className="eyebrow mt-1">{label}</div>
      </div>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(value + step)}
        aria-label={`Increase ${label}`}
      >
        +
      </button>
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  colorFor,
  columns,
}: {
  options: readonly { value: T; label: string; hint?: string }[];
  value: T | undefined;
  onChange: (v: T) => void;
  label: string;
  colorFor?: (v: T) => string;
  columns?: number;
}) {
  return (
    <fieldset>
      <legend className="eyebrow mb-2">{label}</legend>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}
      >
        {options.map((o) => {
          const active = value === o.value;
          const accent = colorFor?.(o.value) ?? 'var(--color-chalk)';
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.value)}
              className="min-h-12 rounded-lg border px-2 py-2 text-center text-sm transition-colors"
              style={{
                borderColor: active ? accent : 'var(--color-line)',
                background: active ? `color-mix(in oklab, ${accent} 16%, transparent)` : 'transparent',
                color: active ? 'var(--color-chalk)' : 'var(--color-chalk-dim)',
              }}
            >
              <span className="block leading-tight">{o.label}</span>
              {o.hint && (
                <span className="num mt-0.5 block text-[0.6875rem] text-chalk-mute">
                  {o.hint}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="eyebrow mb-2 block">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-chalk-mute">{hint}</span>}
    </label>
  );
}

export const inputClass =
  'w-full min-h-12 rounded-lg border border-line bg-raised px-3 text-[0.9375rem] text-chalk placeholder:text-chalk-mute focus:border-chalk-mute';

export const selectClass = `${inputClass} appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 8'%3E%3Cpath d='M1 1.5 6 6.5l5-5' stroke='%23737e89' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")] bg-[length:12px] bg-[position:right_0.85rem_center] bg-no-repeat pr-9`;

export function Button({
  children,
  onClick,
  variant = 'secondary',
  type = 'button',
  disabled,
  full,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  type?: 'button' | 'submit';
  disabled?: boolean;
  full?: boolean;
}) {
  const base =
    'inline-flex min-h-12 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors disabled:opacity-40';
  const variants = {
    primary: 'bg-chalk text-ink hover:bg-white',
    secondary: 'border border-line bg-raised text-chalk hover:border-chalk-mute',
    ghost: 'text-chalk-dim hover:text-chalk',
    danger: 'border border-critical/40 text-critical hover:bg-critical/10',
  } as const;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${full ? 'w-full' : ''}`}
    >
      {children}
    </button>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-line px-3 py-6 text-center text-sm text-chalk-mute">
      {children}
    </p>
  );
}

/** Neutral notice. Never scolds — a missed day is shown, not punished. */
export function Notice({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'warning' | 'critical';
  children: ReactNode;
}) {
  const color =
    tone === 'critical'
      ? 'var(--color-critical)'
      : tone === 'warning'
        ? 'var(--color-warning)'
        : 'var(--color-chalk-mute)';
  return (
    <div
      className="rounded-lg border-l-2 bg-raised/60 px-3 py-2.5 text-sm text-chalk-dim"
      style={{ borderLeftColor: color }}
    >
      {children}
    </div>
  );
}

export const fmtDate = (iso: string, opts?: Intl.DateTimeFormatOptions) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', opts ?? { day: 'numeric', month: 'short' });

export const fmtWeekday = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long' });
