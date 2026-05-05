import type { AuthResponse } from "./authTypes";

export async function fetchCurrentUser() {
  const response = await fetch("/api/auth/me", {
    credentials: "include",
  });

  return (await response.json()) as AuthResponse;
}

export async function login(email: string, password: string) {
  return fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string) {
  return fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  return fetch("/api/auth/logout", {
    method: "POST",
    credentials: "include",
  });
}
