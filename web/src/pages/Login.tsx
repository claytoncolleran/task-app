import { useState } from "react";
import { api } from "../api/client.js";

export function Login() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.requestMagicLink(email.trim());
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-ink-900 text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold">Task App</h1>
        <p className="mt-1 text-sm text-ink-500">Sign in with a magic link.</p>
      </div>

      {sent ? (
        <div className="mt-6 rounded-lg border border-ink-100 bg-ink-50 p-4 text-sm text-ink-700">
          Check <span className="font-medium">{email}</span> for a sign-in link.
        </div>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-ink-100 px-3 py-2 text-sm outline-none focus:border-ink-300"
          />
          <button
            type="submit"
            disabled={busy || !email.trim()}
            className="w-full rounded-lg bg-ink-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {busy ? "Sending..." : "Send magic link"}
          </button>
          {error && <div className="text-xs text-overdue">{error}</div>}
        </form>
      )}
    </div>
  );
}
