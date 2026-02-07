import { supabase } from "@/lib/supabase";
import {
  clampKategorija,
  getKategorijaExplanationForAI,
} from "@/lib/constants";
import { GoogleGenAI } from "@google/genai";
import { useIsFocused } from "@react-navigation/native";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import React, { useState } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";

type ArtikalInput = {
  naziv: string;
  kategorija: number;
  cena: number;
  kolicina: number;
};

export default function Scan() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState("null");
  const [scrapedData, setScrapedData] = useState<string | null>(null);
  const isFocused = useIsFocused();

  React.useEffect(() => {
    const processScanned = async () => {
      if (scanned === "null") return;
      setScrapedData("Obrada...");
      try {
        const response = await fetch(scanned);
        const html = await response.text();
        const match = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
        const preText = match ? match[1].trim() : "Nema <pre> tagova";
        if (!preText || preText === "Nema <pre> tagova") {
          setScrapedData("Nema <pre> tagova");
          return;
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user) {
          setScrapedData("Morate se prijaviti.");
          return;
        }
        const genAI = new GoogleGenAI({ apiKey:process.env.EXPO_PUBLIC_GEMINI_API_KEY });
        const kategorijaExplanation = getKategorijaExplanationForAI();
        const result = await genAI.models.generateContent({
          model: "gemini-2.5-flash-lite",
          contents:
            `Return ONLY a JSON array of receipt line items. Each object must have: naziv (string), kategorija (integer), cena (number), kolicina (integer). ${kategorijaExplanation} No markdown, no explanation. Receipt text:\n\n` +
            preText,
          config: {
            responseMimeType: "application/json",
          },
        });
        const rawText = result.text?.trim() ?? "";
        if (!rawText) {
          setScrapedData("Nema AI odgovora");
          return;
        }
        let items: ArtikalInput[];
        try {
          const parsed = JSON.parse(rawText);
          const arr = Array.isArray(parsed) ? parsed : [parsed];
          items = arr.map((row: Record<string, unknown>) => ({
            naziv: String(row?.naziv ?? "").trim() || "Stavka",
            kategorija: clampKategorija(Number(row?.kategorija ?? 5)),
            cena: Number(row?.cena) || 0,
            kolicina: Number(row?.kolicina) || 1,
          }));
        } catch {
          setScrapedData("Greška: neispravan JSON od AI");
          return;
        }

        const now = new Date();
        const datum = now.toISOString().slice(0, 10);
        const vreme = now.toTimeString().slice(0, 8);
        const { data: racunRow, error: racunError } = await supabase
          .from("racun")
          .insert({
            kupac: session.user.id,
            link: scanned,
            datum,
            vreme,
          })
          .select("id")
          .single();
        if (racunError || !racunRow?.id) {
          setScrapedData(
            "Greška pri snimanju: " + (racunError?.message ?? "racun")
          );
          return;
        }

        const artikalRows = items.map((item) => ({
          racun_id: racunRow.id,
          naziv: item.naziv,
          kategorija: item.kategorija,
          cena: item.cena,
          kolicina: Math.round(Number(item.kolicina)) || 1,
        }));
        const insertArtikal = await supabase
          .from("artikal")
          .insert(artikalRows);
        if (insertArtikal.error) {
          setScrapedData("Greška pri snimanju: " + insertArtikal.error.message);
          return;
        }
        setScrapedData("Sačuvano. Dodato " + items.length + " stavki.");
      } catch (e) {
        setScrapedData(
          "Greška pri obradi: " + (e instanceof Error ? e.message : String(e))
        );
      }
    };
    processScanned();
  }, [scanned]);

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>
          Molimo Vas da omogućite pristup kameri kako biste mogli skenirati
          račune.
        </Text>
        <Button onPress={requestPermission} title="Dozvoli pristup" />
      </View>
    );
  }

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          <View style={styles.header}>
            <Text style={styles.title}>Skeniraj račun</Text>
            <Text style={styles.subtitle}>
              Usmeri kameru ka QR kodu na računu
            </Text>
          </View>
          <View style={styles.card}>
            <View style={styles.scannerBox}>
              {isFocused && scanned === "null" && (
                <CameraView
                  style={styles.scannerFrame}
                  facing={facing}
                  barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                  onBarcodeScanned={({ data }) => {
                    setScanned(data);
                  }}
                />
              )}
            </View>
            {/*  <Button title="Ručni unos" onPress={}></Button> */}
          </View>
          {scanned !== "null" && scrapedData && (
            <View style={styles.card}>
              <Text style={{ fontWeight: "bold", marginBottom: 8 }}>
                Rezultat:
              </Text>
              <View style={{ maxHeight: 300 }}>
                <Button
                  title="Skeniraj sledeci"
                  onPress={() => {
                    setScanned("null");
                    setScrapedData(null);
                  }}
                  color="#007AFF"
                />
                <View style={{ height: 12 }} />
                <Text style={{ fontSize: 15 }}>{scrapedData}</Text>
              </View>
            </View>
          )}
        </View>
      </View>
      {/*  <View style={styles.container}>
      {isFocused && scanned === "null" && (
        <CameraView
          style={styles.camera}
          facing={facing}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={({ data }) => {
            setScanned(data);
          }}
        />
      )}
      {scanned !== "null" && (
        <View
          style={{
            backgroundColor: "#FFF",
            overflow: "scroll",
            position: "absolute",
            bottom: 40,
            left: 0,
            right: 0,
            alignItems: "center",
          }}
        >
          <ScrollView style={{ marginTop: 10, maxHeight: 650, width: "90%" }}>
            <Text style={{ fontSize: 15 }}>
              {scrapedData ? scrapedData : "Obrada..."}
            </Text>
          </ScrollView>
        </View>
      )}
      {scanned !== "null" && (
        <View
          style={{
            marginTop: 16,
            borderColor: "#007AFF",
            borderWidth: 1,
            borderRadius: 7,
          }}
        >
          <Button
            title="Skeniraj sledeci"
            onPress={() => {
              setScanned("null");
              setScrapedData(null);
            }}
            color="#007AFF"
          />
        </View>
      )}
    </View> */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  /* container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  }, */
  /* ---------- Layout ---------- */
  container: {
    marginTop: 50,
    flex: 1,
    padding: 16,
    backgroundColor: "#FDF2F8", // purple-50 → pink-50 blend
  },

  contentWrapper: {
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
  },

  /* ---------- Header ---------- */
  header: {
    marginBottom: 24,
  },

  title: {
    fontSize: 30,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: "#4B5563",
  },

  /* ---------- Cards ---------- */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },

  /* ---------- Scanner Area ---------- */
  scannerBox: {
    aspectRatio: 1,
    backgroundColor: "#111827",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
  },

  scannerOverlay: {
    position: "absolute",
    inset: 0,
    justifyContent: "center",
    alignItems: "center",
  },

  scannerFrame: {
    width: "100%",
    height: "100%",
    position: "relative",
  },

  scannerBorder: {
    position: "absolute",
    inset: 0,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: 12,
  },

  scannerPulseBorder: {
    position: "absolute",
    inset: 0,
    borderTopWidth: 4,
    borderColor: "#3B82F6",
    borderRadius: 12,
  },

  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: "#3B82F6",
  },

  cameraIconLarge: {
    width: 64,
    height: 64,
    color: "#FFFFFF",
    opacity: 0.5,
    alignSelf: "center",
    marginTop: "auto",
    marginBottom: "auto",
  },

  cameraIconIdle: {
    width: 96,
    height: 96,
    color: "#4B5563",
  },

  /* ---------- Buttons ---------- */
  button: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },

  buttonBlue: {
    backgroundColor: "#2563EB",
  },

  buttonPurple: {
    backgroundColor: "#7C3AED",
  },

  buttonGreen: {
    backgroundColor: "#16A34A",
  },

  buttonDisabled: {
    backgroundColor: "#9CA3AF",
  },

  buttonTextWhite: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },

  buttonGroup: {
    gap: 12,
  },

  /* ---------- Scan Result ---------- */
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },

  resultTitle: {
    fontSize: 20,
    color: "#1F2937",
    fontWeight: "500",
  },

  resultList: {
    gap: 12,
  },

  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },

  resultKey: {
    color: "#6B7280",
    fontSize: 14,
  },

  resultValue: {
    color: "#1F2937",
    fontSize: 14,
    fontWeight: "500",
  },

  scanAgainButton: {
    marginTop: 16,
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    borderRadius: 12,
  },

  scanAgainText: {
    textAlign: "center",
    color: "#374151",
    fontSize: 15,
  },

  /* ---------- Info Box ---------- */
  infoBox: {
    marginTop: 24,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 16,
    padding: 16,
  },

  infoText: {
    fontSize: 13,
    color: "#1E40AF",
  },

  /* ---------- Modal ---------- */
  modalBackdrop: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    zIndex: 50,
  },

  modalCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    maxWidth: 420,
    width: "100%",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },

  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },

  modalTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#1F2937",
  },

  /* ---------- Form ---------- */
  formGroup: {
    marginBottom: 16,
  },

  label: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
  },

  input: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },

  select: {
    width: "100%",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    fontSize: 16,
    backgroundColor: "#FFFFFF",
  },

  formButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },

  buttonGray: {
    backgroundColor: "#F3F4F6",
  },

  buttonGrayText: {
    color: "#374151",
    fontSize: 16,
    textAlign: "center",
  },
});
