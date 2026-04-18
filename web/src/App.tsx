import { useEffect, useState } from "react";
import { api, clearSessionToken, getSessionToken, setSessionToken } from "./api/client.js";
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
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    if (window.location.pathname === "/auth/verify" && token) {
      setVerifying(true);
      api.verifyMagicLink(token)
        .then((res) => {
          setSessionToken(res.token);
          const u = { id: res.user.id, email: res.user.email };
          saveUser(u);
          setUser(u);
          window.history.replaceState({}, "", "/");
        })
        .catch((err) => {
          setVerifyError(err instanceof Error ? err.message : "Invalid or expired link");
        })
        .finally(() => setVerifying(false));
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    void runSync();
    const stop = startSyncLoop();
    return stop;
  }, [user]);

  async function signOut() {
    clearSessionToken();
    clearUser();
    await clearLocalData();
    setUser(null);
  }

  if (verifying) {
    return <CenteredMessage>Signing you in...</CenteredMessage>;
  }
  if (verifyError) {
    return (
      <CenteredMessage>
        <div className="text-overdue">{verifyError}</div>
        <a href="/" className="mt-3 inline-block text-sm text-ink-500 underline">Back to sign-in</a>
      </CenteredMessage>
    );
  }

  if (!user) return <Login />;
  return <Home email={user.email} onSignOut={signOut} />;
}

function CenteredMessage({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center p-6 text-center text-sm text-ink-700">
      <div>{children}</div>
    </div>
  );
}
