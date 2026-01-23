import { Stack } from "expo-router";
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Auth from '@/components/Auth'
import Account from '@/components/Account'
import { View } from 'react-native'
import { Session } from '@supabase/supabase-js'
  
export default function RootLayout() {
  const [session, setSession] = useState<Session | null>(null)

   useEffect(() => {
     supabase.auth.getSession().then(({ data: { session } }) => {
       setSession(session)
     })

     supabase.auth.onAuthStateChange((_event, session) => {
       setSession(session)
     })
   }, [])
  return (
    <View style={{ flex: 1 }}>
      {session && session.user ? (
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
      ) : (
        <Auth />
      )}
    </View>
  );
}
