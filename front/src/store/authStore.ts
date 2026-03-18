import { create } from 'zustand';
import apiService, { type AuthUser } from '../services/api';

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  initialized: boolean;
  setAuth: (token: string, user: AuthUser) => void;
  logout: () => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  loading: false,
  initialized: false,

  setAuth: (token, user) => {
    localStorage.setItem('auth_token', token);
    set({ token, user });
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    set({ token: null, user: null, initialized: true, loading: false });
  },

  initialize: async () => {
    const current = get();
    if (current.loading || current.initialized) {
      return;
    }

    const token = get().token || localStorage.getItem('auth_token');
    if (!token) {
      set({ initialized: true, loading: false, user: null, token: null });
      return;
    }

    localStorage.setItem('auth_token', token);
    set({ loading: true });

    try {
      const result = await apiService.getCurrentUser();
      if (result.success && result.data) {
        set({ user: result.data, token, loading: false, initialized: true });
        return;
      }
    } catch {
      // ignore and clear local auth
    }

    localStorage.removeItem('auth_token');
    set({ user: null, token: null, loading: false, initialized: true });
  }
}));
