// app/context/AuthContext.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  // Whether the current user has finished onboarding. null = unknown / no user.
  onboarded: boolean | null;
  signOut: () => Promise<void>;
  // Lets a screen (e.g. Onboarding) refresh the flag without a full reload.
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  onboarded: null,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboarded, setOnboarded] = useState<boolean | null>(null);

  // Read the onboarding flag for a given user. Defaults to false if we can't
  // find it, so a brand-new user is sent through onboarding rather than skipped.
  const fetchOnboarded = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('onboarded')
      .eq('id', userId)
      .single();
    setOnboarded(data?.onboarded ?? false);
  };

  useEffect(() => {
    let mounted = true;

    // 1. Resolve the existing session (and onboarding status) on app start.
    const bootstrap = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) await fetchOnboarded(session.user.id);
      if (mounted) setIsLoading(false);
    };
    bootstrap();

    // 2. Keep everything in sync on login / logout / token refresh.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) await fetchOnboarded(session.user.id);
        else setOnboarded(null);
      },
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchOnboarded(user.id);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{ user, session, isLoading, onboarded, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use auth in any component
export const useAuth = () => useContext(AuthContext);
