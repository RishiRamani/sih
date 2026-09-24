"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { AuthUser, LoginPayload, RegisterPayload } from "@/lib/types";
import {
  clearToken,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from "./storage";
import {
  fetchMe,
  loginUser,
  registerUser,
  verifyOtp,
} from "@/lib/api/auth";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  /** True while we're checking whether a stored token is still valid. */
  initializing: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  verify: (email: string, otp: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);

  // On mount: read stored token and validate it with /auth/me
  useEffect(() => {
    const storedToken = getToken();
    if (!storedToken) {
      setInitializing(false);
      return;
    }

    const cachedUser = getStoredUser();
    if (cachedUser) {
      setUser(cachedUser);
      setTokenState(storedToken);
    }

    let cancelled = false;
    fetchMe(storedToken)
      .then((fresh) => {
        if (cancelled) return;
        setUser(fresh);
        setTokenState(storedToken);
        setStoredUser(fresh);
      })
      .catch(() => {
        if (cancelled) return;
        clearToken();
        setUser(null);
        setTokenState(null);
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
  const res = await loginUser(payload);

  
  try {
    window.sessionStorage.clear();
  } catch {
    
  }

  setToken(res.token);
  setTokenState(res.token);
  const me = await fetchMe(res.token);
  setUser(me);
  setStoredUser(me);
}, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await registerUser(payload);
  }, []);

  const verify = useCallback(async (email: string, otp: string) => {
    const res = await verifyOtp({ email, otp });
    setToken(res.token);
    setTokenState(res.token);
    const me = await fetchMe(res.token);
    setUser(me);
    setStoredUser(me);
  }, []);

  const logout = useCallback(() => {
  router.replace("/login");
  clearToken();
  setUser(null);
  setTokenState(null);

  
  try {
    
    window.localStorage.removeItem("ecdat-comparisons"); 
    window.sessionStorage.clear();
  } catch {
    
  }
}, [router]);

  const refreshUser = useCallback(async () => {
    const t = getToken();
    if (!t) return;
    const me = await fetchMe(t);
    setUser(me);
    setStoredUser(me);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      login,
      register,
      verify,
      logout,
      refreshUser,
    }),
    [user, token, initializing, login, register, verify, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>.");
  }
  return ctx;
}