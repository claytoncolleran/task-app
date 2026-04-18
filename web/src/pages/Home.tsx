import { useMemo, useState } from "react";
import type { Task } from "@task-app/shared";
import { TopNav } from "../components/TopNav.js";
import { DashboardBubbles } from "../components/DashboardBubbles.js";
import { TaskRow } from "../components/TaskRow.js";
import { AddTaskModal } from "../components/AddTaskModal.js";
import { TaskDetail } from "../components/TaskDetail.js";
import { HamburgerMenu } from "../components/HamburgerMenu.js";
import { useActiveTasks, useCompletedTasks, useGroups } from "../hooks/useTasks.js";
import { bumpAllOverdueToTomorrow, toggleTaskComplete } from "../sync/mutations.js";

type ViewMode = { kind: "all" } | { kind: "grouped" } | { kind: "group"; id: string } | { kind: "completed" };

interface Props {
  email: string | null;
  onSignOut: () => void;
}

export function Home({ email, onSignOut }: Props) {
  const active = useActiveTasks();
  const completed = useCompletedTasks();
  const groups = useGroups();

  const [view, setView] = useState<ViewMode>({ kind: "grouped" });
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [detailTask, setDetailTask] = useState<Task | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => loadCollapsed());

  const q = search.trim().toLowerCase();
  const filteredActive = useMemo(() => {
    if (!q) return active;
    return active.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q),
    );
  }, [active, q]);

  function toggleCollapsed(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      saveCollapsed(next);
      return next;
    });
  }

  async function doBumpAll() {
    const n = await bumpAllOverdueToTomorrow();
    if (n > 0) alert(`Bumped ${n} overdue task${n === 1 ? "" : "s"} to tomorrow.`);
    else alert("No overdue tasks.");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <TopNav
        search={search}
        onSearchChange={setSearch}
        onAdd={() => setAddOpen(true)}
        onOpenMenu={() => setMenuOpen(true)}
        onHome={() => setView({ kind: "grouped" })}
      />

      {view.kind !== "completed" && <DashboardBubbles tasks={active} />}

      <ViewTabs view={view} setView={setView} groups={groups} />

      <div className="pb-24">
        {view.kind === "completed" ? (
          <CompletedList tasks={completed} onOpen={setDetailTask} />
        ) : view.kind === "all" ? (
          <FlatList tasks={filteredActive} onOpen={setDetailTask} />
        ) : view.kind === "group" ? (
          <FlatList tasks={filteredActive.filter((t) => t.groupId === view.id)} onOpen={setDetailTask} />
        ) : (
          <GroupedList
            tasks={filteredActive}
            groups={groups}
            collapsed={collapsed}
            onToggle={toggleCollapsed}
            onOpen={setDetailTask}
            onOpenGroup={(id) => setView({ kind: "group", id })}
          />
        )}
      </div>

      <AddTaskModal
        open={addOpen}
        defaultGroupId={view.kind === "group" ? view.id : null}
        onClose={() => setAddOpen(false)}
      />
      <TaskDetail task={detailTask} onClose={() => setDetailTask(null)} />
      <HamburgerMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        email={email}
        onViewCompleted={() => setView({ kind: "completed" })}
        onBumpAllOverdue={() => { if (confirm("Bump all overdue tasks to tomorrow?")) void doBumpAll(); }}
        onSignOut={onSignOut}
      />
    </div>
  );
}

function ViewTabs({ view, setView, groups }: { view: ViewMode; setView: (v: ViewMode) => void; groups: { id: string; name: string }[] }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-ink-100 px-2 py-1 text-sm">
      <Tab active={view.kind === "all"} onClick={() => setView({ kind: "all" })}>All</Tab>
      <Tab active={view.kind === "grouped"} onClick={() => setView({ kind: "grouped" })}>By group</Tab>
      {view.kind === "group" && (
        <Tab active onClick={() => setView({ kind: "grouped" })}>
          {groups.find((g) => g.id === view.id)?.name ?? "Group"}
        </Tab>
      )}
      {view.kind === "completed" && (
        <Tab active onClick={() => setView({ kind: "grouped" })}>Completed</Tab>
      )}
    </div>
  );
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-full px-2.5 py-1 ${active ? "bg-ink-900 text-white" : "text-ink-700 hover:bg-ink-50"}`}>
      {children}
    </button>
  );
}

function FlatList({ tasks, onOpen }: { tasks: Task[]; onOpen: (t: Task) => void }) {
  if (tasks.length === 0) return <Empty />;
  return (
    <div>
      {tasks.map((t) => <TaskRow key={t.id} task={t} onOpen={onOpen} />)}
    </div>
  );
}

function GroupedList({
  tasks,
  groups,
  collapsed,
  onToggle,
  onOpen,
  onOpenGroup,
}: {
  tasks: Task[];
  groups: { id: string; name: string }[];
  collapsed: Set<string>;
  onToggle: (id: string) => void;
  onOpen: (t: Task) => void;
  onOpenGroup: (id: string) => void;
}) {
  const byGroup = new Map<string, Task[]>();
  const ungrouped: Task[] = [];
  for (const t of tasks) {
    if (t.groupId) {
      const arr = byGroup.get(t.groupId) ?? [];
      arr.push(t);
      byGroup.set(t.groupId, arr);
    } else {
      ungrouped.push(t);
    }
  }

  if (tasks.length === 0) return <Empty />;

  return (
    <div>
      {groups.map((g) => {
        const items = byGroup.get(g.id) ?? [];
        if (items.length === 0) return null;
        const isCollapsed = collapsed.has(g.id);
        return (
          <div key={g.id}>
            <div className="sticky top-[49px] z-10 flex items-center justify-between border-b border-ink-100 bg-ink-50/80 px-3 py-1.5 backdrop-blur">
              <button onClick={() => onToggle(g.id)} className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-ink-700">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isCollapsed ? "" : "rotate-90"}>
                  <path d="M9 6l6 6-6 6" />
                </svg>
                {g.name}
                <span className="text-ink-300">· {items.length}</span>
              </button>
              <button onClick={() => onOpenGroup(g.id)} className="text-xs text-ink-500 hover:text-ink-900">
                Open
              </button>
            </div>
            {!isCollapsed && items.map((t) => <TaskRow key={t.id} task={t} onOpen={onOpen} />)}
          </div>
        );
      })}
      {ungrouped.length > 0 && (
        <div>
          <div className="sticky top-[49px] z-10 border-b border-ink-100 bg-ink-50/80 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-ink-500 backdrop-blur">
            No group · {ungrouped.length}
          </div>
          {ungrouped.map((t) => <TaskRow key={t.id} task={t} onOpen={onOpen} />)}
        </div>
      )}
    </div>
  );
}

function CompletedList({ tasks, onOpen }: { tasks: Task[]; onOpen: (t: Task) => void }) {
  if (tasks.length === 0) return <Empty label="No completed tasks yet." />;

  const byDay = new Map<string, Task[]>();
  for (const t of tasks) {
    const d = t.completedDate ? new Date(t.completedDate) : new Date();
    const key = d.toISOString().slice(0, 10);
    const arr = byDay.get(key) ?? [];
    arr.push(t);
    byDay.set(key, arr);
  }

  return (
    <div>
      {[...byDay.entries()].map(([day, items]) => (
        <div key={day}>
          <div className="border-b border-ink-100 bg-ink-50/80 px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-ink-500">
            {new Date(day).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
          </div>
          {items.map((t) => (
            <div key={t.id} className="flex items-center gap-3 border-b border-ink-50 px-3 py-2">
              <button
                onClick={() => {
                  if (confirm("Reactivate this task?")) void toggleTaskComplete(t.id, false);
                }}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-ink-300 bg-ink-900"
                aria-label="Uncheck"
              >
                <span className="h-2.5 w-2.5 rounded-full bg-white" />
              </button>
              <button onClick={() => onOpen(t)} className="flex-1 truncate text-left text-sm text-ink-500 line-through">
                {t.title}
              </button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function Empty({ label = "No tasks. Add one with +" }: { label?: string }) {
  return <div className="py-16 text-center text-sm text-ink-300">{label}</div>;
}

const COLLAPSED_KEY = "task-app:collapsed";
function loadCollapsed(): Set<string> {
  try {
    const raw = localStorage.getItem(COLLAPSED_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw) as string[]);
  } catch {
    return new Set();
  }
}
function saveCollapsed(set: Set<string>) {
  localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...set]));
}
