import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Session } from '@supabase/supabase-js';
import type { User, GuestUser } from '../types';
import { supabase } from '../lib/supabase';

// ─── State Shape ──────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  session: Session | null;
  guest: GuestUser | null;
  isLoading: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setGuest: (guest: GuestUser | null) => void;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      guest: null,
      isLoading: true,

      setUser(user) {
        set({ user });
      },

      setSession(session) {
        set({ session });
      },

      setGuest(guest) {
        set({ guest });
      },

      async logout() {
        await supabase.auth.signOut();
        set({ user: null, session: null, guest: null });
      },

      async initialize() {
        set({ isLoading: true });
        const { data } = await supabase.auth.getSession();
        set({ session: data.session, isLoading: false });

        supabase.auth.onAuthStateChange((_event, session) => {
          set({ session });
        });
      },
    }),
    {
      name: 'retail-auth',
      partialize: (state) => ({ guest: state.guest }),
    }
  )
);
