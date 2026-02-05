import { createClient, processLock } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

let storage;
if (typeof window !== "undefined" && window.localStorage) {
  // Web
  storage = window.localStorage;
} else if (
  typeof navigator !== "undefined" &&
  navigator.product === "ReactNative"
) {
  // React Native
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  storage = require("@react-native-async-storage/async-storage").default;
} else {
  // SSR/Node.js: No-op storage
  storage = {
    getItem: async () => null,
    setItem: async () => {},
    removeItem: async () => {},
  };
}

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://ajowaoqzvsxqfixdqkqd.supabase.co";
const supabasePublishableKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  "sb_publishable_aIJpC6OSOfhJSavQu6JakA_fzncUjrH";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
  },
});
