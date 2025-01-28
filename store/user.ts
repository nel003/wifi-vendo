import { create } from 'zustand'
import { User } from '@/types/types';

interface UserStore {
    User: User | null;
    setUser: (user: User) => void;
}

export const userStore = create<UserStore>((set) => ({
  User: null,
  setUser: (user) => set({ User: user }),
}))
