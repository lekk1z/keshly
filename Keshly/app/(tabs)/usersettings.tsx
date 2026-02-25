import Account from "@/components/Account";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import type { Session } from "@supabase/supabase-js";

export default function UserSettings() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
      },
    );
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" style={{ flex: 1 }} />;
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {session && session.user ? <Account session={session} /> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 20,
  },
  recentWrap: {
    paddingHorizontal: 12,
  },
});
