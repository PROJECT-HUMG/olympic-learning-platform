import { create } from "zustand";

interface AuthState {
  accessToken: string | null;
  revision: number;
  setAccessToken: (token: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  accessToken: null,
  revision: 0,
  setAccessToken: (token) => set((state) => ({ accessToken: token, revision: state.revision + 1 })),
  clearAuth: () => set((state) => ({ accessToken: null, revision: state.revision + 1 })),
}));
