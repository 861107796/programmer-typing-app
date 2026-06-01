import { useEffect, useState } from "react";

import * as authApi from "./authApi";
import type { AuthUser } from "./authTypes";

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    authApi
      .fetchCurrentUser()
      .then((result) => {
        setUser(result.user);
      })
      .catch(() => {
        setError("Unable to restore session");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return {
    user,
    setUser,
    loading,
    error,
    setError,
  };
}
