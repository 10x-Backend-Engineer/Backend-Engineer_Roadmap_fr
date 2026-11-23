"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type ProgressState = Record<string, true>;

type ProgressCtx = {
  ready: boolean;
  has: (id: string) => boolean;
  toggle: (id: string) => void;
  reset: () => void;
  doneCount: (ids: string[]) => number;
  doneTotal: number;
  total: number;
};

const KEY = "backend-roadmap:progress:v1";

const Ctx = createContext<ProgressCtx | null>(null);

export function ProgressProvider({
  children,
  total,
}: {
  children: React.ReactNode;
  total: number;
}) {
  const [state, setState] = useState<ProgressState>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setState(JSON.parse(raw) as ProgressState);
    } catch {
      /* stockage indisponible : on continue en mémoire */
    }
    setReady(true);
  }, []);

  const persist = useCallback((next: ProgressState) => {
    setState(next);
    try {
      window.localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  const toggle = useCallback(
    (id: string) => {
      persist((() => {
        const next = { ...state };
        if (next[id]) delete next[id];
        else next[id] = true;
        return next;
      })());
    },
    [persist, state],
  );

  const reset = useCallback(() => persist({}), [persist]);

  const value = useMemo<ProgressCtx>(
    () => ({
      ready,
      has: (id) => Boolean(state[id]),
      toggle,
      reset,
      doneCount: (ids) => ids.filter((id) => state[id]).length,
      doneTotal: Object.keys(state).length,
      total,
    }),
    [ready, state, toggle, reset, total],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProgress doit être utilisé dans ProgressProvider");
  return ctx;
}

export function ProgressCheck({
  id,
  label,
  className = "",
}: {
  id: string;
  label?: string;
  className?: string;
}) {
  const { has, toggle, ready } = useProgress();
  const checked = ready && has(id);
  return (
    <label className={`check ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={() => toggle(id)}
        aria-label={label ?? "marquer comme fait"}
      />
      <span className="box" aria-hidden="true">
        ✓
      </span>
      {label ? <span className="lbl">{label}</span> : null}
    </label>
  );
}

export function ProgressBlock({
  ids,
  label = "progression",
  showCount = true,
}: {
  ids: string[];
  label?: string;
  showCount?: boolean;
}) {
  const { ready, doneCount } = useProgress();
  const done = ready ? doneCount(ids) : 0;
  const pct = ids.length ? Math.round((done / ids.length) * 100) : 0;
  return (
    <div style={{ display: "grid", gap: 6 }}>
      {showCount ? (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "var(--dim)" }}>
          <span style={{ letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
          <span className="mono">
            {done}/{ids.length}
          </span>
        </div>
      ) : null}
      <div className="bar" aria-hidden="true">
        <i style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
