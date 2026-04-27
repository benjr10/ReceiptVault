"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  currency: string;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  setUser: () => {},
  currency: "NGN",
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUserState] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const currency = user?.user_metadata?.currency || "NGN";

  const setUser = (user: User | null) => {
    console.log("AUTH CONTEXT - SET USER CALLED:", user);
    setUserState(user);
    setLoading(false);
  };

  const refresh = useCallback(async () => {
    console.log("AUTH CONTEXT - REFRESH CALLED");
    const { data } = await supabase.auth.getSession();
    console.log("AUTH CONTEXT - REFRESH SESSION:", data.session);
    console.log("AUTH CONTEXT - REFRESH USER:", data.session?.user);
    
    if (data.session?.user) {
      const user = data.session.user;
      if (user.email_confirmed_at) {
        setSession(data.session);
        setUserState(user);
      } else {
        setSession(null);
        setUserState(null);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      console.log("AUTH PROVIDER - INIT");
      const { data } = await supabase.auth.getSession();
      console.log("AUTH PROVIDER - INITIAL SESSION:", data.session);
      console.log("AUTH PROVIDER - INITIAL USER:", data.session?.user);
      const user = data.session?.user ?? null;
      if (user && user.email_confirmed_at) {
        setSession(data.session);
        setUserState(user);
      } else {
        setSession(null);
        setUserState(null);
      }
      setLoading(false);
    };

    initAuth();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("AUTH PROVIDER - ON AUTH STATE CHANGE:", event, session?.user);
        
        if (event === 'TOKEN_REFRESHED') {
          console.log("AUTH PROVIDER - TOKEN REFRESHED, updating session only");
          setSession(session);
          return;
        }
        
        if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
          const user = session?.user ?? null;
          
          if (user && !user.email_confirmed_at) {
            console.log("AUTH PROVIDER - User exists but NOT verified, blocking authentication");
            setUserState(null);
            setSession(null);
            // DO NOT redirect here, just stop
          } else if (user && user.email_confirmed_at) {
            console.log("AUTH PROVIDER - User verified, allowing access");
            setSession(session);
            setUserState(user);
          } else {
            console.log("AUTH PROVIDER - Clearing auth state");
            setSession(null);
            setUserState(null);
          }
        }
        
        setLoading(false);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, loading, setUser, currency }}>
      {children}
    </AuthContext.Provider>
  );
}