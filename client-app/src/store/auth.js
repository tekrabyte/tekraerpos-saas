import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useAuth = create(
    persist(
        (set) => ({
            user: null,
            token: null,
            tenant: null,

            login: (data) => set({ 
                user: data.user, 
                token: data.token, 
                tenant: data.user.tenant 
            }),

            logout: () => set({ user: null, token: null, tenant: null })
        }),
        { name: "erpos-auth" } // Simpan di localStorage
    )
);