import { access } from "fs";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface User {
  username: string;
  accountAddress: string;
  admin: boolean;
  id: string;
}

interface UserStore {
  user: User;
  loggedIn: boolean;
  updateUser: (newUser: Partial<User>) => void;
  updateLogin: (login: boolean) => void;
}

export const useUserStore = create(
  persist(
    (set, get) => ({
      loggedIn: false,
      user: {
        username: "",
        accountAddress: "",
        admin: false,
        id: "",
        accessToken: "",
      },
      updateUser: (newUser: Partial<User>) =>
        set((state: any) => ({ user: { ...state.user, ...newUser } })),
      updateLogin: (login: boolean) => set({ loggedIn: login }),
    }),
    {
      name: "user", // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => sessionStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
