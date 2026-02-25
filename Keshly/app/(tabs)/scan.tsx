import {
  CATEGORIES,
  clampKategorija,
  getKategorijaExplanationForAI,
} from "@/lib/constants";
import { Picker } from "@react-native-picker/picker";
import { supabase, supabasePublishableKey, supabaseUrl } from "@/lib/supabase";
import { useIsFocused } from "@react-navigation/native";
import DateTimePicker, {
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { createClient } from "@supabase/supabase-js";
import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import React, { useState } from "react";
import {
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type ArtikalInput = {
  naziv: string;
  kategorija: number;
  cena: number;
  kolicina: number;
  datum?: string;
  vreme?: string;
};

const createEmptyItem = (): ArtikalInput => ({
  naziv: "",
  kategorija: 5,
  cena: 0,
  kolicina: 1,
});

export default function Scan() {
  const [entryMode, setEntryMode] = useState<"qr" | "link" | "manual">("qr");
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState("null");
  const [scrapedData, setScrapedData] = useState<string | null>(null);
  const [editableItems, setEditableItems] = useState<ArtikalInput[]>([]);
  const [manualReceiptUrl, setManualReceiptUrl] = useState("");
  const [place, setPlace] = useState("");
  const [datum, setDatum] = useState("");
  const [vreme, setVreme] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isFocused = useIsFocused();

  const toSqlDate = (value: Date) => {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const toSqlTime = (value: Date) => {
    const hours = String(value.getHours()).padStart(2, "0");
    const minutes = String(value.getMinutes()).padStart(2, "0");
    const seconds = String(value.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const parseSqlDate = (value: string) => {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return new Date();
    const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const parseSqlTime = (value: string) => {
    const match = value.match(/^(\d{2}):(\d{2})(?::(\d{2}))?$/);
    const base = new Date();
    if (!match) return base;
    base.setHours(Number(match[1]), Number(match[2]), Number(match[3] ?? 0), 0);
    return base;
  };

  const onDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (event.type === "set" && selectedDate) {
      setDatum(toSqlDate(selectedDate));
    }
  };

  const onTimeChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowTimePicker(false);
    if (event.type === "set" && selectedDate) {
      setVreme(toSqlTime(selectedDate));
    }
  };

  const resetScan = () => {
    setScanned("null");
    setScrapedData(null);
    setEditableItems(entryMode === "manual" ? [createEmptyItem()] : []);
    setDatum("");
    setVreme("");
    setPlace("");
    setShowDatePicker(false);
    setShowTimePicker(false);
    setIsSaving(false);
  };

  const processManualUrl = () => {
    const url = manualReceiptUrl.trim();
    if (!url) {
      setScrapedData("Unesite link računa.");
      return;
    }
    setScanned(url);
  };

  const saveParsedData = async () => {
    if (editableItems.length === 0) {
      setScrapedData("Nema stavki za čuvanje.");
      return;
    }

    setIsSaving(true);
    setScrapedData("Čuvanje...");
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        setScrapedData("Morate se prijaviti.");
        return;
      }

      const now = new Date();
      const fallbackDatum = now.toISOString().slice(0, 10);
      const fallbackVreme = now.toTimeString().slice(0, 8);
      const finalDatum = datum?.trim().length >= 8 ? datum.trim() : fallbackDatum;
      const finalVreme = vreme?.trim().length >= 4 ? vreme.trim() : fallbackVreme;
      const finalLink = scanned !== "null" ? scanned : manualReceiptUrl.trim() || "manual";
      const receiptPayload: Record<string, string> = {
        kupac: session.user.id,
        link: finalLink,
        datum: finalDatum,
        vreme: finalVreme,
      };
      if (place.trim()) {
        receiptPayload.mesto = place.trim();
      }

      let { data: racunRow, error: racunError } = await supabase
        .from("racun")
        .insert(receiptPayload)
        .select("id")
        .single();

      if (racunError && place.trim()) {
        const fallbackInsert = await supabase
          .from("racun")
          .insert({
            kupac: session.user.id,
            link: finalLink,
            datum: finalDatum,
            vreme: finalVreme,
          })
          .select("id")
          .single();
        racunRow = fallbackInsert.data;
        racunError = fallbackInsert.error;
      }

      if (racunError || !racunRow?.id) {
        setScrapedData(
          "Greška pri snimanju: " + (racunError?.message ?? "racun"),
        );
        return;
      }

      const artikalRows = editableItems.map((item) => ({
        racun_id: racunRow.id,
        naziv: item.naziv,
        kategorija: clampKategorija(Number(item.kategorija) || 5),
        cena: Number(item.cena) || 0,
        kolicina: Math.round(Number(item.kolicina)) || 1,
      }));

      const insertArtikal = await supabase.from("artikal").insert(artikalRows);
      if (insertArtikal.error) {
        setScrapedData("Greška pri snimanju: " + insertArtikal.error.message);
        return;
      }

      setScrapedData("Sačuvano. Dodato " + editableItems.length + " stavki.");
    } catch (e) {
      setScrapedData(
        "Greška pri obradi: " + (e instanceof Error ? e.message : String(e)),
      );
    } finally {
      setIsSaving(false);
    }
  };

  React.useEffect(() => {
    const processScanned = async () => {
      if (scanned === "null") return;
      setScrapedData("Obrada...");
      setEditableItems([]);
      try {
        const response = await fetch(scanned);
        const html = await response.text();
        const match = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
        const preText = match
          ? match[1].split(/<br\s*\/?\s*>/i)[0].trim()
          : "Nema <pre> tagova";
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

        const supabaseEgdeFunc = createClient(supabaseUrl, supabasePublishableKey);
        const kategorijaExplanation = getKategorijaExplanationForAI();
        const { data } = await supabaseEgdeFunc.functions.invoke("google-ai", {
          body: {
            prompt:
              `Return ONLY a JSON array of receipt line items. Each object must have: naziv (string), kategorija (integer), cena (number), kolicina (integer), datum(SQL date),vreme(SQL time). ${kategorijaExplanation} No markdown, no explanation. Receipt text:\n\n` +
              preText,
          },
        });

        const rawText = data.text?.trim() ?? "";
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
            datum: row?.datum ? String(row.datum) : undefined,
            vreme: row?.vreme ? String(row.vreme) : undefined,
          }));
        } catch {
          setScrapedData("Greška: neispravan JSON od AI " + rawText);
          return;
        }

        const now = new Date();
        const fallbackDatum = now.toISOString().slice(0, 10);
        const fallbackVreme = now.toTimeString().slice(0, 8);
        const aiDatum = items.find((item) => item.datum)?.datum;
        const aiVreme = items.find((item) => item.vreme)?.vreme;
        setDatum(aiDatum && aiDatum.length >= 8 ? aiDatum : fallbackDatum);
        setVreme(aiVreme && aiVreme.length >= 4 ? aiVreme : fallbackVreme);
        setEditableItems(items);
        setPlace("");
        setScrapedData("Proverite podatke, zatim sačuvajte.");
      } catch (e) {
        setScrapedData(
          "Greška pri obradi: " + (e instanceof Error ? e.message : String(e)),
        );
      }
    };
    processScanned();
  }, [scanned]);

  const canUseCamera = permission?.granted ?? false;

  return (
    <ScrollView>
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          <View style={styles.card}>
            <Text style={styles.label}>Način unosa</Text>
            <View style={styles.formButtonsRow}>
              <Button
                title="QR skeniranje"
                onPress={() => {
                  setEntryMode("qr");
                  setScanned("null");
                  setEditableItems([]);
                  setScrapedData(null);
                }}
                color={entryMode === "qr" ? "#2563EB" : "#9CA3AF"}
              />
              <Button
                title="Link"
                onPress={() => {
                  setEntryMode("link");
                  setScanned("null");
                  setEditableItems([]);
                  setScrapedData(null);
                }}
                color={entryMode === "link" ? "#2563EB" : "#9CA3AF"}
              />
              <Button
                title="Ručni unos"
                onPress={() => {
                  const now = new Date();
                  setEntryMode("manual");
                  setScanned("null");
                  setScrapedData("Ručno unesite podatke i sačuvajte.");
                  setEditableItems((prev) =>
                    prev.length > 0 ? prev : [createEmptyItem()],
                  );
                  setDatum((prev) => prev || now.toISOString().slice(0, 10));
                  setVreme((prev) => prev || now.toTimeString().slice(0, 8));
                }}
                color={entryMode === "manual" ? "#2563EB" : "#9CA3AF"}
              />
            </View>
          </View>

          <View style={styles.header}>
            <Text style={styles.title}>Skeniraj račun</Text>
            <Text style={styles.subtitle}>
              {entryMode === "qr"
                ? "Usmeri kameru ka QR kodu na računu"
                : entryMode === "link"
                  ? "Nalepite link računa za obradu"
                  : "Ručno unesite račun i stavke"}
            </Text>
          </View>

          {entryMode === "qr" && (
            <View style={styles.card}>
              <View style={styles.scannerBox}>
                {canUseCamera && isFocused && scanned === "null" && (
                  <CameraView
                    style={styles.scannerFrame}
                    facing={facing}
                    barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
                    onBarcodeScanned={({ data }) => {
                      setScanned(data);
                    }}
                  />
                )}
                {!canUseCamera && (
                  <View style={{ paddingHorizontal: 16 }}>
                    <Text style={{ color: "#FFFFFF", textAlign: "center", marginBottom: 12 }}>
                      Omogućite pristup kameri da biste koristili QR skeniranje.
                    </Text>
                    <Button onPress={requestPermission} title="Dozvoli pristup" />
                  </View>
                )}
              </View>
            </View>
          )}

          {entryMode === "manual" && (
            <>
              <View style={styles.card}>
                <Text style={styles.label}>Račun</Text>
                <Text style={styles.subtitleSmall}>Ručno unesite podatke računa</Text>

                <Text style={styles.label}>Mesto / Prodavnica</Text>
                <TextInput
                  style={styles.input}
                  value={place}
                  onChangeText={setPlace}
                  placeholder="npr. Maxi"
                />

                <Text style={styles.label}>Datum (YYYY-MM-DD)</Text>
                <Pressable
                  style={styles.input}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Text style={styles.pickerText}>{datum || "Izaberite datum"}</Text>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    mode="date"
                    value={parseSqlDate(datum)}
                    onChange={onDateChange}
                  />
                )}

                <Text style={styles.label}>Vreme (HH:mm:ss)</Text>
                <Pressable
                  style={styles.input}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Text style={styles.pickerText}>{vreme || "Izaberite vreme"}</Text>
                </Pressable>
                {showTimePicker && (
                  <DateTimePicker
                    mode="time"
                    is24Hour
                    value={parseSqlTime(vreme)}
                    onChange={onTimeChange}
                  />
                )}

                {scrapedData && (
                  <Text style={styles.resultHint}>{scrapedData}</Text>
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.label}>Stavke</Text>
                <Text style={styles.subtitleSmall}>Jedan red = jedna stavka</Text>
                <View style={{ height: 12 }} />
                <Button
                  title="Dodaj stavku"
                  onPress={() => setEditableItems((prev) => [...prev, createEmptyItem()])}
                  color="#16A34A"
                />

                <View style={{ height: 12 }} />
                <ScrollView>
                  {editableItems.map((item, index) => (
                    <View key={`manual-item-${index}`} style={styles.itemRowCard}>
                      <Text style={styles.inputLabel}>Naziv</Text>
                      <TextInput
                        style={[styles.input, styles.itemNameInput]}
                        value={item.naziv}
                        placeholder="Naziv"
                        onChangeText={(text) =>
                          setEditableItems((prev) =>
                            prev.map((row, rowIndex) =>
                              rowIndex === index ? { ...row, naziv: text } : row,
                            ),
                          )
                        }
                      />

                      <Text style={styles.inputLabel}>Kategorija</Text>
                      <View style={styles.dropdownWrap}>
                        <Picker
                          selectedValue={item.kategorija}
                          onValueChange={(value) =>
                            setEditableItems((prev) =>
                              prev.map((row, rowIndex) =>
                                rowIndex === index
                                  ? { ...row, kategorija: clampKategorija(Number(value) || 5) }
                                  : row,
                              ),
                            )
                          }
                          style={styles.pickerControl}
                        >
                          {CATEGORIES.map((cat) => (
                            <Picker.Item key={cat.id} label={cat.name} value={cat.id} />
                          ))}
                        </Picker>
                      </View>

                      <Text style={styles.inputLabel}>Cena</Text>
                      <View style={styles.inlineInputs}>
                        <View style={[styles.input, styles.currencyInputWrap, styles.smallInput]}>
                          <Text style={styles.currencyPrefix}>RSD</Text>
                          <TextInput
                            style={styles.currencyInputField}
                            keyboardType="decimal-pad"
                            placeholder="0"
                            value={String(item.cena)}
                            onChangeText={(text) => {
                              const parsed = Number(text.replace(",", "."));
                              setEditableItems((prev) =>
                                prev.map((row, rowIndex) =>
                                  rowIndex === index
                                    ? { ...row, cena: Number.isFinite(parsed) ? parsed : 0 }
                                    : row,
                                ),
                              );
                            }}
                          />
                        </View>

                        <View style={styles.smallInput}>
                          <Text style={styles.inputLabel}>Količina</Text>
                          <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            placeholder="Kol."
                            value={String(item.kolicina)}
                            onChangeText={(text) => {
                              const parsed = Number(text);
                              setEditableItems((prev) =>
                                prev.map((row, rowIndex) =>
                                  rowIndex === index
                                    ? {
                                        ...row,
                                        kolicina: Number.isFinite(parsed)
                                          ? Math.round(parsed) || 1
                                          : 1,
                                      }
                                    : row,
                                ),
                              );
                            }}
                          />
                        </View>
                      </View>

                      {editableItems.length > 1 && (
                        <Button
                          title="Ukloni"
                          color="#D14343"
                          onPress={() =>
                            setEditableItems((prev) =>
                              prev.filter((_, rowIndex) => rowIndex !== index),
                            )
                          }
                        />
                      )}
                    </View>
                  ))}
                </ScrollView>

                <View style={{ height: 8 }} />
                <Button
                  title={isSaving ? "Čuvanje..." : "Sačuvaj"}
                  onPress={saveParsedData}
                  color="#007AFF"
                  disabled={isSaving || editableItems.length === 0}
                />
                <View style={{ height: 12 }} />
                <Button
                  title="Obriši"
                  onPress={resetScan}
                  color="#D14343"
                />
              </View>
            </>
          )}

          {entryMode === "link" && (
            <View style={styles.card}>
              <Text style={styles.label}>Link računa</Text>
              <Text style={styles.subtitleSmall}>Nalepite link koji obično dobijate skeniranjem QR koda</Text>
              <TextInput
                style={styles.input}
                value={manualReceiptUrl}
                onChangeText={setManualReceiptUrl}
                placeholder="https://..."
                autoCapitalize="none"
              />
              <View style={{ height: 12 }} />
              <Button title="Obradi link" onPress={processManualUrl} color="#007AFF" />
              {scrapedData && <Text style={styles.resultHint}>{scrapedData}</Text>}
            </View>
          )}

          {((entryMode === "qr" || entryMode === "link") && scrapedData && scanned !== "null") && (
            <View style={styles.card}>
              <Text style={{ fontWeight: "bold", marginBottom: 8 }}>Rezultat:</Text>
              <View style={{ maxHeight: 420 }}>
                <Text style={{ fontSize: 15, marginBottom: 12 }}>{scrapedData}</Text>

                {editableItems.length > 0 && (
                  <>
                    <Text style={styles.label}>Datum (YYYY-MM-DD)</Text>
                    <Pressable
                      style={styles.input}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={styles.pickerText}>{datum || "Izaberite datum"}</Text>
                    </Pressable>
                    {showDatePicker && (
                      <DateTimePicker
                        mode="date"
                        value={parseSqlDate(datum)}
                        onChange={onDateChange}
                      />
                    )}

                    <Text style={styles.label}>Vreme (HH:mm:ss)</Text>
                    <Pressable
                      style={styles.input}
                      onPress={() => setShowTimePicker(true)}
                    >
                      <Text style={styles.pickerText}>{vreme || "Izaberite vreme"}</Text>
                    </Pressable>
                    {showTimePicker && (
                      <DateTimePicker
                        mode="time"
                        is24Hour
                        value={parseSqlTime(vreme)}
                        onChange={onTimeChange}
                      />
                    )}

                  </>
                )}

                <ScrollView>
                  {editableItems.map((item, index) => (
                    <View key={`qr-item-${index}`} style={styles.formGroup}>
                      <Text style={styles.label}>Naziv</Text>
                      <TextInput
                        style={styles.input}
                        value={item.naziv}
                        onChangeText={(text) =>
                          setEditableItems((prev) =>
                            prev.map((row, rowIndex) =>
                              rowIndex === index ? { ...row, naziv: text } : row,
                            ),
                          )
                        }
                      />

                      <Text style={styles.label}>Kategorija (1-10)</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={String(item.kategorija)}
                        onChangeText={(text) => {
                          const parsed = Number(text);
                          setEditableItems((prev) =>
                            prev.map((row, rowIndex) =>
                              rowIndex === index
                                ? {
                                    ...row,
                                    kategorija: Number.isFinite(parsed)
                                      ? clampKategorija(parsed)
                                      : 5,
                                  }
                                : row,
                            ),
                          );
                        }}
                      />

                      <Text style={styles.label}>Cena</Text>
                      <View style={[styles.input, styles.currencyInputWrap]}>
                        <Text style={styles.currencyPrefix}>RSD</Text>
                        <TextInput
                          style={styles.currencyInputField}
                          keyboardType="decimal-pad"
                          value={String(item.cena)}
                          onChangeText={(text) => {
                            const parsed = Number(text.replace(",", "."));
                            setEditableItems((prev) =>
                              prev.map((row, rowIndex) =>
                                rowIndex === index
                                  ? { ...row, cena: Number.isFinite(parsed) ? parsed : 0 }
                                  : row,
                              ),
                            );
                          }}
                        />
                      </View>

                      <Text style={styles.label}>Količina</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={String(item.kolicina)}
                        onChangeText={(text) => {
                          const parsed = Number(text);
                          setEditableItems((prev) =>
                            prev.map((row, rowIndex) =>
                              rowIndex === index
                                ? {
                                    ...row,
                                    kolicina: Number.isFinite(parsed)
                                      ? Math.round(parsed) || 1
                                      : 1,
                                  }
                                : row,
                            ),
                          );
                        }}
                      />

                    </View>
                  ))}
                </ScrollView>

                <View style={{ height: 8 }} />
                <Button
                  title={isSaving ? "Čuvanje..." : "Sačuvaj"}
                  onPress={saveParsedData}
                  color="#007AFF"
                  disabled={isSaving || editableItems.length === 0}
                />
                <View style={{ height: 12 }} />
                <Button
                  title="Obriši (skeniraj ponovo)"
                  onPress={resetScan}
                  color="#D14343"
                />
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 50,
    flex: 1,
    padding: 16,
    backgroundColor: "#FDF2F8",
  },
  contentWrapper: {
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
  },
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
  subtitleSmall: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 10,
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
    elevation: 6,
  },
  scannerBox: {
    aspectRatio: 1,
    backgroundColor: "#111827",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  scannerFrame: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 13,
    color: "#4B5563",
    marginBottom: 6,
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
  pickerText: {
    fontSize: 16,
    color: "#111827",
  },
  resultHint: {
    marginTop: 12,
    fontSize: 13,
    color: "#4B5563",
  },
  itemRowCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    backgroundColor: "#F9FAFB",
  },
  itemNameInput: {
    marginBottom: 8,
  },
  dropdownWrap: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    marginBottom: 8,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  pickerControl: {
    width: "100%",
  },
  inlineInputs: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  smallInput: {
    flex: 1,
  },
  currencyInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  currencyPrefix: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  currencyInputField: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
    paddingVertical: 0,
  },
  formButtonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
});
