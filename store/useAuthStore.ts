import { Roles } from "@/types/core";
import  {create}  from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";



interface State {
  _id: string | null;
  accessToken: string | null;
  role: Roles | null;
  isSuccess:boolean
  hasHydrated: boolean, // NEW
}

interface Action {
  setAccessToken: (_id: string, token: string, role: Roles) => void;
  logOut: () => void;
  setHasHydrated: () => void; // <- add this
}

const useAuthStore = create<State & Action>()(
  devtools(
    persist(
      (set) => ({
        _id: null,
        accessToken: null,
        role: null,
        isSuccess: true,
        hasHydrated: false,

        setAccessToken(_id: string, accessToken: string, role: Roles) {
          set(() => ({ _id, accessToken, role }));
        },

        logOut() {
          set(() => ({ _id: null, accessToken: null, role: null }));
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