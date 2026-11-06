import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface User {
  id: number;
  email: string;
  name: string;
  roleId: number;
  roleName: string;
  roleSlug: string;
  profileImage?: string;
}

interface UserStoreState {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
  updateUser: (partial: Partial<User>) => void;
  isSuperAdmin: () => boolean;
  isUser: () => boolean;
}

const useUserStore = create<UserStoreState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),
      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : state.user,
        })),
      isSuperAdmin: () => get().user?.roleSlug === "super_admin",
      isUser: () => get().user?.roleSlug === "user",
    }),
    {
      name: "userStore",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useUserStore;
