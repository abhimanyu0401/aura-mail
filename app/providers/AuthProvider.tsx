"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  displayName: string | null;
  loading: boolean;
  refreshAuth: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  displayName: null,
  loading: true,
  refreshAuth: async () => {},
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();

  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDisplayName = useCallback(
    async (userId: string) => {
      try {
        const { data } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", userId)
          .single();
        setDisplayName(data?.display_name ?? null);
      } catch {
        setDisplayName(null);
      }
    },
    [supabase]
  );

  const signOut = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
    setUser(null);
    setDisplayName(null);
  }, [supabase]);

  const refreshAuth = useCallback(async () => {
    try {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();
      setUser(currentUser);
      if (currentUser) {
        await fetchDisplayName(currentUser.id);
      } else {
        setDisplayName(null);
      }
    } catch {
      setUser(null);
      setDisplayName(null);
    }
  }, [supabase, fetchDisplayName]);

  useEffect(() => {
    // Initial session load
    refreshAuth().finally(() => setLoading(false));

    // Subscribe to auth state changes (login, logout, token refresh)
    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (_event, session) => {
        const newUser = session?.user ?? null;
        if (newUser) {
          setUser(newUser);
          await fetchDisplayName(newUser.id);
        } else {
          setUser(null);
          setDisplayName(null);
        }
      });

      return () => subscription.unsubscribe();
    } catch {
      // Ignore in dummy mode
    }
  }, [refreshAuth, fetchDisplayName, supabase]);

  return (
    <AuthContext.Provider value={{ user, displayName, loading, refreshAuth, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
