import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const useCookieConsentStore = create(
  persist(
    (set) => ({
      cookieConsent: null,
      setCookieConsent: (cookieConsent: any) => set({ cookieConsent }),
      clearCookieConsent: () => set({ cookieConsent: null }),
    }),
    {
      name: "cookieConsentStore",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

export default useCookieConsentStore;
