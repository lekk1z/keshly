import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ajowaoqzvsxqfixdqkqd.supabase.co";
const supabasePublishableKey = "sb_publishable_aIJpC6OSOfhJSavQu6JakA_fzncUjrH";

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: localStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})