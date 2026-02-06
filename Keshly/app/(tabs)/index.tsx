import Graph from "@/components/Graph";
import { supabase } from "@/lib/supabase";
import Ionicons from "@expo/vector-icons/Ionicons";
import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

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
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Keshly</Text>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={18} color="#4B5563" />
          <Text style={styles.dateText}>
            {Intl.DateTimeFormat("rs-RS", {
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </Text>
        </View>
      </View>
      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.label}>Ukupna potrošnja:{}</Text>
          <Text style={styles.totalAmount}>{2000} RSD</Text>
        </View>
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Potrosnja</Text>
        <Graph chartType="pie" />
      </View>
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>
          Nedavna potrošnja po kategorijama
        </Text>
        <View style={styles.categoryList}>
          <FlatList
            data={[
              {
                id: "1",
                name: "Namirnice",
                amount: 500,
                percent: 25,
                color: "#F87171",
              },
              {
                id: "2",
                name: "Restorani i kafici",
                amount: 300,
                percent: 15,
                color: "#60A5FA",
              },
              {
                id: "3",
                name: "Transport",
                amount: 200,
                percent: 10,
                color: "#34D399",
              },
              {
                id: "4",
                name: "Zabava",
                amount: 400,
                percent: 20,
                color: "#FBBF24",
              },
              {
                id: "5",
                name: "Ostalo",
                amount: 600,
                percent: 30,
                color: "#4B5563",
              },
            ]}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.categoryRow}>
                <View style={styles.categoryLeft}>
                  <View
                    style={[styles.colorDot, { backgroundColor: item.color }]}
                  />
                  <Text style={styles.categoryName}>{item.name}</Text>
                </View>
                <View style={styles.categoryRight}>
                  <Text style={styles.categoryAmount}>{item.amount} RSD</Text>
                  <Text style={styles.categoryPercent}>{item.percent}%</Text>
                </View>
              </View>
            )}
          />
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#EEF2FF",
  },

  contentWrapper: {
    maxWidth: 420,
    alignSelf: "center",
    width: "100%",
  },

  header: {
    marginBottom: 24,
  },

  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#1F2937",
    marginBottom: 3,
  },

  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  dateText: {
    color: "#4B5563",
    fontSize: 19,
    marginLeft: 8,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  label: {
    fontSize: 20,
    color: "#6B7280",
    marginBottom: 4,
  },

  totalAmount: {
    fontSize: 36,
    fontWeight: "600",
    color: "#1F2937",
  },

  iconCircleRed: {
    backgroundColor: "#FEE2E2",
    padding: 12,
    borderRadius: 999,
  },

  sectionTitle: {
    fontSize: 23,
    fontWeight: "500",
    color: "#1F2937",
    marginBottom: 16,
  },

  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },

  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
  },

  categoryName: {
    fontSize: 19,
    color: "#374151",
  },

  categoryRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  categoryAmount: {
    fontSize: 19,
    color: "#1F2937",
    marginRight: 8,
  },

  categoryPercent: {
    fontSize: 14,
    color: "#6B7280",
  },

  categoryList: {
    gap: 12,
  },
});
