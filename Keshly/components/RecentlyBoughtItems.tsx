import { supabase } from "@/lib/supabase";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

type ReceiptItemRow = {
  id: string;
  naziv: string | null;
  cena: number | string | null;
  kolicina: number | string | null;
};

type ReceiptRow = {
  id: string;
  datum: string | null;
  vreme: string | null;
  artikal: ReceiptItemRow[] | null;
};

type RecentItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

type ReceiptGroup = {
  id: string;
  date: string;
  time: string;
  items: RecentItem[];
};

type RecentlyBoughtItemsProps = {
  limit?: number;
};

export default function RecentlyBoughtItems({
  limit = 5,
}: RecentlyBoughtItemsProps) {
  const [receipts, setReceipts] = useState<ReceiptGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const currencyFormatter = new Intl.NumberFormat("sr-RS", {
    style: "currency",
    currency: "RSD",
    maximumFractionDigits: 2,
  });

  const loadRecentItems = useCallback(async () => {
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    const userId = session?.user?.id;
    if (!userId) {
      setReceipts([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("racun")
      .select("id, datum, vreme, artikal(id, naziv, cena, kolicina)")
      .eq("kupac", userId)
      .order("datum", { ascending: false })
      .order("vreme", { ascending: false })
      .limit(limit);

    if (error || !data) {
      setReceipts([]);
      setLoading(false);
      return;
    }

    const mapped = (data as ReceiptRow[])
      .map((receipt) => {
        const items = (receipt.artikal ?? []).map((item) => ({
          id: item.id,
          name: item.naziv?.trim() || "Stavka",
          price: Number(item.cena ?? 0),
          quantity: Math.max(1, Math.round(Number(item.kolicina ?? 1))),
        }));

        if (items.length === 0) {
          return null;
        }

        const parsedDate = receipt.datum ? new Date(receipt.datum) : null;
        const date = parsedDate && !Number.isNaN(parsedDate.getTime())
          ? new Intl.DateTimeFormat("sr-RS", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            }).format(parsedDate)
          : "Nepoznat datum";

        const time = receipt.vreme?.slice(0, 5) || "--:--";

        return {
          id: receipt.id,
          date,
          time,
          items,
        };
      })
      .filter((receipt): receipt is ReceiptGroup => Boolean(receipt));

    setReceipts(mapped);
    setLoading(false);
  }, [limit]);

  useFocusEffect(
    useCallback(() => {
      loadRecentItems();
    }, [loadRecentItems]),
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Nedavno kupljene stavke</Text>
      {loading ? (
        <ActivityIndicator size="small" color="#4B5563" />
      ) : receipts.length === 0 ? (
        <Text style={styles.emptyText}>Nema nedavnih stavki.</Text>
      ) : (
        <View style={styles.list}>
          {receipts.map((receipt) => (
            <View key={receipt.id} style={styles.receiptBlock}>
              <Text style={styles.receiptDateTime}>
                {receipt.date} u {receipt.time}
              </Text>
              {receipt.items.map((item) => (
                <View key={item.id} style={styles.row}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity} x {currencyFormatter.format(item.price)}
                  </Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 12,
  },
  list: {
    gap: 10,
  },
  receiptBlock: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  receiptDateTime: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemName: {
    fontSize: 16,
    color: "#111827",
    flexShrink: 1,
    marginRight: 12,
  },
  itemMeta: {
    fontSize: 14,
    color: "#4B5563",
  },
  emptyText: {
    fontSize: 14,
    color: "#6B7280",
  },
});