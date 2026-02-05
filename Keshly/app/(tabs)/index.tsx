import Graph from "@/components/Graph";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

export default function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let listener: any;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
    });
    listener = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setName(null);
      }
    });
    return () => {
      listener?.data?.subscription?.unsubscribe();
    };
    // eslint-disable-next-line
  }, []);

  async function fetchProfile(userId: string) {
    const { data, error, status } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();
    if (!error && data) {
      setName(data.full_name);
    } else {
      setName(null);
    }
  }

  if (loading) {
    return (
      <View>
        <Text>Učitavanje...</Text>
      </View>
    );
  }
  return (
    <View>
      <Text>Zdravo {name ? name : "korisniče"}!</Text>
      {/* Postaviti grafikon */}
      <Graph chartType="pie" />
    </View>
  );
}
