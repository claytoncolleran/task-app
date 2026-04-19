import { useEffect, useState } from "react";
import { getSyncStatus, runSync, subscribeSyncStatus } from "../sync/sync.js";

interface Props {
  open: boolean;
  onClose: () => void;
  onViewCompleted: () => void;
  onBumpAllOverdue: () => void;
  onSignOut: () => void;
  email: string | null;
}

export function HamburgerMenu({ open, onClose, onViewCompleted, onBumpAllOverdue, onSignOut, email }: Props) {
  const [status, setStatus] = useState(getSyncStatus());

  useEffect(() => subscribeSyncStatus(() => setStatus(getSyncStatus())), []);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose}>
      <div className="absolute right-2 top-12 w-64 rounded-lg border border-ink-100 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
        {email && <div className="truncate border-b border-ink-100 px-3 py-2 text-xs text-ink-500">{email}</div>}
        <MenuItem onClick={() => { onClose(); onViewCompleted(); }}>Completed tasks</MenuItem>
        <MenuItem onClick={() => { onClose(); onBumpAllOverdue(); }}>Bump all overdue</MenuItem>
        <div className="border-t border-ink-100" />
        <MenuItem onClick={() => void runSync()}>
          {status.inFlight ? "Syncing..." : "Sync now"}
        </MenuItem>
        <div className="border-b border-ink-100 px-3 pb-2 text-[11px] text-ink-500">
          {status.lastSyncErr ? (
            <span className="text-overdue">Error: {status.lastSyncErr}</span>
          ) : status.lastSyncOk ? (
            <span>Last synced {timeAgo(status.lastSyncOk)}</span>
          ) : (
            <span>Not synced yet</span>
          )}
        </div>
        <MenuItem onClick={() => { onClose(); onSignOut(); }}>Sign out</MenuItem>
      </div>
    </div>
  );
}

function MenuItem({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="block w-full px-3 py-2 text-left text-sm hover:bg-ink-50">
      {children}
    </button>
  );
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 5_000) return "just now";
  if (ms < 60_000) return `${Math.round(ms / 1000)}s ago`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m ago`;
  return new Date(iso).toLocaleTimeString();
}
