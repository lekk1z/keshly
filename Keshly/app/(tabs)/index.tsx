import Graph from "@/components/GraphPie";
import RecentlyBoughtItems from "@/components/RecentlyBoughtItems";
import { supabase } from "@/lib/supabase";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useFocusEffect } from "@react-navigation/native";
import type { Session } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";

type CategoryTotalRow = {
  kategorija: string | null;
  kategorija_naziv: string | null;
  total_sales: number | string | null;
};

type CategoryItem = {
  id: string;
  name: string;
  amount: number;
  percent: number;
  color: string;
};

const categoryColors = [
  "#F87171",
  "#60A5FA",
  "#34D399",
  "#FBBF24",
  "#4B5563",
  "#A78BFA",
  "#F472B6",
  "#22D3EE",
];

export default function Index() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(true);
  const [name, setName] = useState<string | null>(null);
  const [categoryItems, setCategoryItems] = useState<CategoryItem[]>([]);
  const [grandTotal, setGrandTotal] = useState(0);

  useEffect(() => {
    let listener: any;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchCategoryTotals();
      } else {
        setCategoryItems([]);
        setGrandTotal(0);
        setDataLoading(false);
      }
    });
    listener = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchCategoryTotals();
      } else {
        setName(null);
        setCategoryItems([]);
        setGrandTotal(0);
        setDataLoading(false);
      }
    });
    return () => {
      listener?.data?.subscription?.unsubscribe();
    };
    // eslint-disable-next-line
  }, []);

  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const refresh = async () => {
        setDataLoading(true);
        const { data } = await supabase.auth.getSession();
        if (!isActive) {
          return;
        }
        const currentSession = data.session;
        setSession(currentSession);
        setLoading(false);
        if (currentSession?.user) {
          await fetchProfile(currentSession.user.id);
          await fetchCategoryTotals();
        } else {
          setName(null);
          setCategoryItems([]);
          setGrandTotal(0);
          setDataLoading(false);
        }
      };

      refresh();

      return () => {
        isActive = false;
      };
    }, []),
  );

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

  async function fetchCategoryTotals() {
    setDataLoading(true);
    const { data, error } = await supabase.rpc(
      "category_totals_with_grand_total",
    );
    if (error || !data) {
      setCategoryItems([]);
      setGrandTotal(0);
      setDataLoading(false);
      return;
    }

    const rows = data as CategoryTotalRow[];
    const totalRow = rows.find((row) => row.kategorija_naziv === "GRAND TOTAL");
    const totalValue = totalRow
      ? Number(totalRow.total_sales ?? 0)
      : rows.reduce((sum, row) => sum + Number(row.total_sales ?? 0), 0);

    const categoryRows = rows.filter(
      (row) => row.kategorija_naziv && row.kategorija_naziv !== "GRAND TOTAL",
    );

    const items = categoryRows.map((row, index) => {
      const amount = Number(row.total_sales ?? 0);
      const percent =
        totalValue > 0 ? Math.round((amount / totalValue) * 100) : 0;
      return {
        id: row.kategorija ?? `category-${index}`,
        name: row.kategorija_naziv ?? "Nepoznato",
        amount,
        percent,
        color: categoryColors[index % categoryColors.length],
      };
    });

    setCategoryItems(items);
    setGrandTotal(totalValue);
    setDataLoading(false);
  }

  const currencyFormatter = new Intl.NumberFormat("sr-RS", {
    style: "currency",
    currency: "RSD",
    maximumFractionDigits: 2,
  });

  const pieChartData = categoryItems.map((item) => ({
    name: item.name,
    population: item.amount,
    color: item.color,
  }));

  if (loading || dataLoading) {
    return (
      <View>
        <Text>Učitavanje...</Text>
      </View>
    );
  }
  return (
    <FlatList
      data={[{ id: "home-content" }]}
      keyExtractor={(item) => item.id}
      renderItem={() => (
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
            <Text style={styles.label}>Ukupna potrošnja:</Text>
            <Text style={styles.totalAmount}>
              {currencyFormatter.format(grandTotal)}
            </Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Potrošnja</Text>
            <View style={{ height: 200 }}>
              <Graph pieData={pieChartData} />
            </View>
          </View>
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              Nedavna potrošnja po kategorijama
            </Text>
            <View style={styles.categoryList}>
              {categoryItems.length === 0 ? (
                <Text style={styles.emptyStateText}>No data yet</Text>
              ) : (
                categoryItems.map((item) => (
                  <View key={item.id} style={styles.categoryRow}>
                    <View style={styles.categoryLeft}>
                      <View
                        style={[styles.colorDot, { backgroundColor: item.color }]}
                      />
                      <Text style={styles.categoryName}>{item.name}</Text>
                    </View>
                    <View style={styles.categoryRight}>
                      <Text style={styles.categoryAmount}>
                        {currencyFormatter.format(item.amount)}
                      </Text>
                      <Text style={styles.categoryPercent}>{item.percent}%</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
          <RecentlyBoughtItems />
        </View>
      )}
    />
  );
}
const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    flex: 1,
    padding: 16,
    backgroundColor: "#EEF2FF",
  },

  header: {
    marginBottom: 18,
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
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },

  label: {
    fontSize: 18,
    color: "#6B7280",
    marginBottom: 4,
  },

  totalAmount: {
    fontSize: 30,
    fontWeight: "600",
    color: "#1F2937",
  },

  sectionTitle: {
    fontSize: 22,
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
    fontSize: 18,
    color: "#374151",
  },

  categoryRight: {
    flexDirection: "row",
    alignItems: "center",
  },

  categoryAmount: {
    fontSize: 18,
    color: "#1F2937",
    marginRight: 8,
  },

  categoryPercent: {
    fontSize: 13,
    color: "#6B7280",
  },

  categoryList: {
    gap: 12,
  },

  emptyStateText: {
    fontSize: 16,
    color: "#6B7280",
  },
});
