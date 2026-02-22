import GraphBar, { BarDatum } from "@/components/GraphBar";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

type GrandTotalsLastMonthsRow = {
  month_start: string;
  total_sales: number | string;
};

function formatMonthLabel(monthStart: string) {
  const match = monthStart.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return "";
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (!Number.isInteger(year) || monthIndex < 0 || monthIndex > 11) {
    return "";
  }

  const parsedDate = new Date(year, monthIndex, 1);

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
  }).format(parsedDate);
}

function mapRpcDataToBarData(rows: GrandTotalsLastMonthsRow[]): BarDatum {
  const validRows = rows.filter((row) => formatMonthLabel(row.month_start).length > 0);
  const labels = validRows.map((row) => formatMonthLabel(row.month_start));
  const values = validRows.map((row) => {
    const parsed = Number(row.total_sales);
    return Number.isFinite(parsed) ? parsed : 0;
  });

  return {
    labels,
    datasets: [{ data: values }],
  };
}

export default function Stats() {
  const [barData, setBarData] = useState<BarDatum | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLastMonthsTotals() {
      setLoading(true);
      setErrorMessage(null);

      const { data, error } = await supabase.rpc("grand_totals_last_months");

      if (!isMounted) {
        return;
      }

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      const rows = Array.isArray(data) ? (data as GrandTotalsLastMonthsRow[]) : [];
      setBarData(mapRpcDataToBarData(rows));
      setLoading(false);
    }

    loadLastMonthsTotals();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mesečni pregled</Text>
        <Text style={styles.subtitle}>Ukupna prodaja za poslednjih 6 meseci</Text>
      </View>

      <View style={styles.card}>
        {loading ? <Text style={styles.statusText}>Loading chart...</Text> : null}
        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
        <GraphBar barData={barData} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    flex: 1,
    paddingHorizontal: 2,
    paddingTop: 20,
    backgroundColor: "#F9FAFB",
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
  },
  subtitle: {
    marginTop: 4,
    fontSize: 14,
    color: "#6B7280",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
  },
  statusText: {
    marginBottom: 10,
    color: "#4B5563",
    fontSize: 14,
  },
  errorText: {
    marginBottom: 10,
    color: "#DC2626",
    fontSize: 14,
  },
});
