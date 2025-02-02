import { create } from 'zustand'
import { AdminUser, User } from '@/types/types';

interface UserStore {
    User: User | null;
    setUser: (user: User) => void;
}
interface AdminStore {
  adminUser: AdminUser | null;
  setAdminUser: (user: AdminUser) => void;
}

export const userStore = create<UserStore>((set) => ({
  User: null,
  setUser: (user) => set({ User: user }),
}))

export const adminStore = create<AdminStore>((set) => ({
  adminUser: null,
  setAdminUser: (user) => set({ adminUser: user }),
}))
