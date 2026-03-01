import { create } from "zustand";
import type { User } from "firebase/auth";

interface AppState {
    user: User | null;
    loading: boolean;
    setUser: (user: User | null) => void;
    setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
    user: null,
    loading: true,   // true until onAuthStateChanged fires
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
}));
