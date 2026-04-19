import { useEffect, useRef, useState } from "react";
import { api, setSessionToken } from "../api/client.js";

interface Props {
  onSignedIn: (user: { id: string; email: string }) => void;
}

export function Login({ onSignedIn }: Props) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "code") setTimeout(() => codeRef.current?.focus(), 30);
  }, [step]);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.requestMagicLink(email.trim().toLowerCase());
      setStep("code");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await api.verifyMagicCode(email.trim().toLowerCase(), code);
      setSessionToken(res.token);
      onSignedIn({ id: res.user.id, email: res.user.email });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid or expired code";
      setError(msg.includes("invalid_or_expired") ? "Invalid or expired code" : msg);
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
        <p className="mt-1 text-sm text-ink-500">
          {step === "email" ? "Sign in with a 6-digit code." : "Enter the code we emailed you."}
        </p>
      </div>

      {step === "email" ? (
        <form onSubmit={requestCode} className="mt-6 space-y-3">
          <input
            type="email"
            required
            autoComplete="email"
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
            {busy ? "Sending..." : "Send code"}
          </button>
          {error && <div className="text-xs text-overdue">{error}</div>}
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-6 space-y-3">
          <div className="text-center text-xs text-ink-500">
            Code sent to <span className="font-medium text-ink-700">{email}</span>
          </div>
          <input
            ref={codeRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            className="w-full rounded-lg border border-ink-100 px-3 py-2 text-center text-2xl font-semibold tracking-[0.5em] outline-none focus:border-ink-300"
          />
          <button
            type="submit"
            disabled={busy || code.length !== 6}
            className="w-full rounded-lg bg-ink-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            {busy ? "Verifying..." : "Verify"}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep("email");
              setCode("");
              setError(null);
            }}
            className="block w-full text-center text-xs text-ink-500 underline"
          >
            Use a different email
          </button>
          {error && <div className="text-center text-xs text-overdue">{error}</div>}
        </form>
      )}
    </div>
  );
}
