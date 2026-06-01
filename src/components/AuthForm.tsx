import { useState } from "react";

interface AuthFormProps {
  mode: "login" | "register";
  onSubmit: (email: string, password: string) => Promise<void>;
  error: string | null;
}

export function AuthForm({ mode, onSubmit, error }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <section className="auth-card">
      <h1>{mode === "login" ? "Sign In" : "Create Account"}</h1>
      <form
        className="auth-form"
        onSubmit={(event) => {
          event.preventDefault();
          void onSubmit(email, password);
        }}
      >
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>
        {error ? <p className="auth-form__error">{error}</p> : null}
        <button type="submit">
          {mode === "login" ? "Sign In" : "Register"}
        </button>
      </form>
    </section>
  );
}
