import { db, getMeta, setMeta } from "../db/dexie.js";
import { api, getSessionToken } from "../api/client.js";

const LAST_PULLED_KEY = "lastPulledAt";
const DIRTY_SINCE_KEY = "dirtySince";

export async function markDirty(): Promise<void> {
  const current = await getMeta(DIRTY_SINCE_KEY);
  if (!current) await setMeta(DIRTY_SINCE_KEY, new Date().toISOString());
}

let syncing = false;
let queued = false;

export async function runSync(): Promise<void> {
  if (!getSessionToken()) return;
  if (!navigator.onLine) return;
  if (syncing) {
    queued = true;
    return;
  }
  syncing = true;
  try {
    await pushLocalChanges();
    await pullServerChanges();
  } catch (err) {
    console.warn("[sync] failed:", err);
  } finally {
    syncing = false;
    if (queued) {
      queued = false;
      void runSync();
    }
  }
}

async function pushLocalChanges(): Promise<void> {
  const dirtySince = await getMeta(DIRTY_SINCE_KEY);
  if (!dirtySince) return;

  const since = new Date(dirtySince);
  const tasks = (await db.tasks.toArray()).filter((t) => new Date(t.updatedAt) >= since);
  const groups = (await db.groups.toArray()).filter((g) => new Date(g.updatedAt) >= since);

  if (tasks.length === 0 && groups.length === 0) {
    await setMeta(DIRTY_SINCE_KEY, "");
    return;
  }

  await api.pushSync({ tasks, groups });
  await setMeta(DIRTY_SINCE_KEY, "");
}

async function pullServerChanges(): Promise<void> {
  const since = (await getMeta(LAST_PULLED_KEY)) || null;
  const res = await api.pullSync(since);

  await db.transaction("rw", db.tasks, db.groups, async () => {
    for (const g of res.groups) {
      const local = await db.groups.get(g.id);
      if (!local || new Date(g.updatedAt) > new Date(local.updatedAt)) {
        await db.groups.put(g);
      }
    }
    for (const t of res.tasks) {
      const local = await db.tasks.get(t.id);
      if (!local || new Date(t.updatedAt) > new Date(local.updatedAt)) {
        await db.tasks.put(t);
      }
    }
  });

  await setMeta(LAST_PULLED_KEY, res.serverTime);
}

export function startSyncLoop(): () => void {
  void runSync();
  const onOnline = () => void runSync();
  const interval = window.setInterval(() => void runSync(), 30_000);
  window.addEventListener("online", onOnline);
  return () => {
    window.clearInterval(interval);
    window.removeEventListener("online", onOnline);
  };
}

export async function clearLocalData(): Promise<void> {
  await db.transaction("rw", db.tasks, db.groups, db.meta, async () => {
    await db.tasks.clear();
    await db.groups.clear();
    await db.meta.clear();
  });
}
