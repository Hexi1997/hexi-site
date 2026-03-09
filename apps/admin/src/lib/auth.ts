import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createElement } from "react";
import type { GitHubUser } from "@/types";

const SESSION_TOKEN_KEY = "admin_token";
const SESSION_USER_KEY = "admin_user";

interface AuthContextValue {
  token: string | null;
  user: GitHubUser | null;
  authenticated: boolean;
  login: (password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadSession(): { token: string | null; user: GitHubUser | null } {
  const token = sessionStorage.getItem(SESSION_TOKEN_KEY);
  const userJson = sessionStorage.getItem(SESSION_USER_KEY);
  if (token && userJson) {
    try {
      return { token, user: JSON.parse(userJson) as GitHubUser };
    } catch {
      /* ignore */
    }
  }
  return { token: null, user: null };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState(loadSession);

  const login = useCallback(async (password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const data = (await res.json()) as
      | { token: string; user: GitHubUser }
      | { error: string };

    if (!res.ok) {
      return { ok: false, error: (data as { error: string }).error };
    }

    const { token, user } = data as { token: string; user: GitHubUser };
    sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
    setSession({ token, user });
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_TOKEN_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
    setSession({ token: null, user: null });
  }, []);

  return createElement(
    AuthContext.Provider,
    {
      value: {
        token: session.token,
        user: session.user,
        authenticated: !!session.token,
        login,
        logout,
      },
    },
    children
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
