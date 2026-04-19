import { useEffect, useState } from "react";
import { clearSessionToken, getSessionToken } from "./api/client.js";
import { Home } from "./pages/Home.js";
import { Login } from "./pages/Login.js";
import { clearLocalData, runSync, startSyncLoop } from "./sync/sync.js";

interface LocalUser {
  id: string;
  email: string;
}

const USER_KEY = "task-app:user";
const USER_ID_KEY = "task-app:user-id";

function loadUser(): LocalUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as LocalUser) : null;
  } catch {
    return null;
  }
}

function saveUser(user: LocalUser) {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(USER_ID_KEY, user.id);
}

function clearUser() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

export default function App() {
  const [user, setUser] = useState<LocalUser | null>(() => (getSessionToken() ? loadUser() : null));

  useEffect(() => {
    if (!user) return;
    void runSync();
    const stop = startSyncLoop();
    return stop;
  }, [user]);

  function handleSignedIn(u: LocalUser) {
    saveUser(u);
    setUser(u);
  }

  async function signOut() {
    clearSessionToken();
    clearUser();
    await clearLocalData();
    setUser(null);
  }

  if (!user) return <Login onSignedIn={handleSignedIn} />;
  return <Home email={user.email} onSignOut={signOut} />;
}
