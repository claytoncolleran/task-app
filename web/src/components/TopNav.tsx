import { useState } from "react";

interface Props {
  search: string;
  onSearchChange: (value: string) => void;
  onAdd: () => void;
  onOpenMenu: () => void;
  onHome: () => void;
}

export function TopNav({ search, onSearchChange, onAdd, onOpenMenu, onHome }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="sticky top-0 z-30 flex items-center gap-2 border-b border-ink-100 bg-white/95 px-3 py-2 backdrop-blur">
      <button
        onClick={onHome}
        aria-label="Home"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-900 text-white"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 13l4 4L19 7" />
        </svg>
      </button>

      <div className={`flex flex-1 items-center rounded-lg border px-2 ${focused ? "border-ink-300" : "border-ink-100"} bg-ink-50`}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-500">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search tasks"
          className="w-full bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-ink-300"
        />
      </div>

      <button
        onClick={onAdd}
        aria-label="Add task"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-100 hover:border-ink-300"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <button
        onClick={onOpenMenu}
        aria-label="Menu"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ink-100 hover:border-ink-300"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 6h18M3 12h18M3 18h18" />
        </svg>
      </button>
    </div>
  );
}
