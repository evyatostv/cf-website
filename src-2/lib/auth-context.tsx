import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, captchaToken?: string) => Promise<any>;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<any>;
  signInWithGoogle: (redirectUrl?: string) => Promise<any>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let revision = 0;
    const showSession = (current: Session | null) => {
      setSession(current);
      setUser(current?.user ?? null);
      setLoading(false);
    };
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, current) => {
      const observed = ++revision;
      if (event !== 'INITIAL_SESSION' || !current) {
        showSession(current);
        return;
      }

      // Leave the auth callback before starting another SDK operation.
      setTimeout(async () => {
        if (observed !== revision) return;
        try {
          const { error } = await supabase.auth.getUser(current.access_token);
          if (observed !== revision) return;
          if (error?.code === 'user_not_found' ||
              error?.code === 'session_not_found' ||
              (error?.status === 403 && /user from sub claim in JWT does not exist/i.test(error.message))) {
            showSession(null);
            await supabase.auth.signOut({ scope: 'local' }).catch(() => {});
            return;
          }
        } catch {
          // A temporary connection failure cannot establish that an account was deleted.
        }
        if (observed === revision) showSession(current);
      }, 0);
    });
    return () => {
      revision++;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, captchaToken?: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    if (error) throw error;
    return data;
  };

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: captchaToken ? { captchaToken } : undefined,
    });
    if (error) throw error;
    return data;
  };

  const signInWithGoogle = async (redirectUrl?: string) => {
    // Land on /complete-profile: it collects the phone Google can't give us,
    // then forwards to /dashboard (or straight to /dashboard if a phone already
    // exists). Supabase's onAuthStateChange (above) picks up the session.
    
    // Pass the target redirect to complete-profile so it can redirect there afterwards
    const redirectTo = redirectUrl
      ? `${window.location.origin}/complete-profile?redirect=${encodeURIComponent(redirectUrl)}`
      : `${window.location.origin}/complete-profile`;
      
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
