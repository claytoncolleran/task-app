interface Props {
  open: boolean;
  onClose: () => void;
  onViewCompleted: () => void;
  onBumpAllOverdue: () => void;
  onSignOut: () => void;
  email: string | null;
}

export function HamburgerMenu({ open, onClose, onViewCompleted, onBumpAllOverdue, onSignOut, email }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose}>
      <div className="absolute right-2 top-12 w-56 rounded-lg border border-ink-100 bg-white shadow-lg" onClick={(e) => e.stopPropagation()}>
        {email && <div className="truncate border-b border-ink-100 px-3 py-2 text-xs text-ink-500">{email}</div>}
        <MenuItem onClick={() => { onClose(); onViewCompleted(); }}>Completed tasks</MenuItem>
        <MenuItem onClick={() => { onClose(); onBumpAllOverdue(); }}>Bump all overdue</MenuItem>
        <div className="border-t border-ink-100" />
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
