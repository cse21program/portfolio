import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiRequestError, apiGet, apiPost } from "@/lib/api";
import type { AuthPayload, AuthUser } from "@/types/auth";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (input: { name: string; email: string; password: string }) => Promise<AuthPayload>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  resendVerification: () => Promise<AuthPayload>;
  changePassword: (currentPassword: string | undefined, newPassword: string) => Promise<AuthUser>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const payload = await apiGet<{ user: AuthUser }>("/auth/me");
      setUser(payload.user);
      return payload.user;
    } catch (error) {
      if (error instanceof ApiRequestError && (error.status === 401 || error.status === 403)) {
        setUser(null);
        return null;
      }
      throw error;
    }
  }, []);

  useEffect(() => {
    void refreshUser()
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const payload = await apiPost<{ user: AuthUser }>("/auth/login", { email, password });
    setUser(payload.user);
    return payload.user;
  }, []);

  const register = useCallback(async (input: { name: string; email: string; password: string }) => {
    const payload = await apiPost<AuthPayload>("/auth/register", input);
    setUser(payload.user);
    return payload;
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiPost("/auth/logout");
    } finally {
      setUser(null);
    }
  }, []);

  const resendVerification = useCallback(async () => {
    return apiPost<AuthPayload>("/auth/resend-verification");
  }, []);

  const changePassword = useCallback(async (currentPassword: string | undefined, newPassword: string) => {
    const payload = await apiPost<{ user: AuthUser }>("/auth/change-password", {
      currentPassword,
      newPassword,
    });
    setUser(payload.user);
    return payload.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshUser,
      resendVerification,
      changePassword,
    }),
    [user, loading, login, register, logout, refreshUser, resendVerification, changePassword],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

export function homeForRole(role: AuthUser["role"]) {
  return role === "ADMIN" ? "/admin" : "/dashboard";
}
