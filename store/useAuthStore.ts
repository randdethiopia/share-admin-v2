import { Roles } from "@/types/core";
import  {create}  from "zustand";
import { createJSONStorage, devtools, persist } from "zustand/middleware";
import Cookies from "js-cookie";


interface  User {
  _id: string,
  firstName: string,
  lastName: string,
  phoneNumber: string,
  isActive: boolean;
  email: string,
  role: Roles,
  firstTimeLogin?: boolean,
  permissions?: string[],
};
interface State {
  _id: string | null;
  email: string | null;
  role: Roles | null;
  isSuccess:boolean
  hasHydrated: boolean,
  permissions: string[] | null
  user: User | null;
}

interface Action {
  setAccessToken: (
    _id: string,
    token: string,
    role: Roles,
    email?: string,
    permissions?: string[] | null,
    user?: User | null
  ) => void;
  logOut: () => void;
  setHasHydrated: () => void;
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
        permissions: null,
        user: null,

        setAccessToken(
          _id: string,
          accessToken: string,
          role: Roles,
          email?: string,
          permissions?: string[] | null,
          user?: User | null
        ) {
          set(() => ({
            _id,
            accessToken,
            role,
            email: email ?? null,
            permissions: permissions ?? null,
            user: user ?? null,
          }));
        },

       
        logOut() {
          Cookies.remove("session_token");
          if (typeof window !== "undefined") {
            localStorage.removeItem("admin-auth-store");
            window.location.replace("/login");
          }
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