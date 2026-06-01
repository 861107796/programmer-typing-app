import { useCallback, useState, type ReactNode } from "react";

import * as authApi from "../auth/authApi";
import { useAuth } from "../auth/useAuth";
import { AuthForm } from "./AuthForm";

interface AuthGateRenderProps {
  onAuthExpired: () => void;
}

export function AuthGate({
  children,
}: {
  children: ReactNode | ((props: AuthGateRenderProps) => ReactNode);
}) {
  const { user, setUser, loading, error, setError } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleExpiredSession = useCallback(() => {
    setError("Session expired. Please sign in again.");
    setUser(null);
  }, [setError, setUser]);

  if (loading) {
    return (
      <main className="auth-shell">
        <p>Restoring session...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="auth-shell">
        <div className="auth-stack">
          <AuthForm
            mode={mode}
            error={error}
            onSubmit={async (email, password) => {
              setError(null);
              const response =
                mode === "login"
                  ? await authApi.login(email, password)
                  : await authApi.register(email, password);
              const body = (await response.json()) as {
                error?: string;
                user?: typeof user;
              };

              if (!response.ok || !body.user) {
                setError(body.error ?? "Authentication failed");
                return;
              }

              setUser(body.user);
            }}
          />
          <button
            type="button"
            className="auth-toggle"
            onClick={() =>
              setMode((current) =>
                current === "login" ? "register" : "login",
              )
            }
          >
            {mode === "login" ? "Need an account?" : "Already have an account?"}
          </button>
        </div>
      </main>
    );
  }

  return (
    <>
      <header className="signed-in-bar">
        <span>{user.email}</span>
        <button
          type="button"
          onClick={async () => {
            await authApi.logout();
            setUser(null);
          }}
        >
          Log Out
        </button>
      </header>
      {typeof children === "function"
        ? children({ onAuthExpired: handleExpiredSession })
        : children}
    </>
  );
}
