import { Roles } from "@/types/core";
import  {create}  from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";



interface State {
  _id: string | null;
  email: string | null;
  accessToken: string | null;
  role: Roles | null;
  isSuccess:boolean
  hasHydrated: boolean, // NEW
}

interface Action {
  setAccessToken: (_id: string, token: string, role: Roles, email?: string) => void;
  logOut: () => void;
  setHasHydrated: () => void; // <- add this
}

const useAuthStore = create<State & Action>()(
  devtools(
    persist(
      (set) => ({
        _id: null,
        email: null,
        accessToken: null,
        role: null,
        isSuccess: true,
        hasHydrated: false,

        setAccessToken(_id: string, accessToken: string, role: Roles, email?: string) {
          set(() => ({ _id, accessToken, role, email: email ?? null }));
        },

        logOut() {
          set(() => ({ _id: null, email: null, accessToken: null, role: null }));
        },

        setHasHydrated: () => set({ hasHydrated: true }),
      }),
      {
        name: "admin-auth-store",
        storage: createJSONStorage(() => localStorage),
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated?.();
        },
      }
    )
  )
);


export default useAuthStore;