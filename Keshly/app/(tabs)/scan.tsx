import { CameraType, CameraView, useCameraPermissions } from "expo-camera";
import React, { useState } from "react";
import { Button, ScrollView, StyleSheet, Text, View } from "react-native";

export default function Scan() {
  const [facing, setFacing] = useState<CameraType>("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState("null");
  const [scrapedData, setScrapedData] = useState<string | null>(null);

  // When scanned changes, fetch the URL content
  React.useEffect(() => {
    const processScanned = async () => {
      if (scanned !== "null") {
        try {
          const response = await fetch(scanned);
          const html = await response.text();
          // Extract text inside <pre> tags using regex
          const match = html.match(/<pre[^>]*>([\s\S]*?)<\/pre>/i);
          const preText = match ? match[1].trim() : "Nema <pre> tagova";
          setScrapedData(preText);
        } catch (e) {
          setScrapedData("Greška pri obradi: " + e);
        }
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
        <Text style={styles.text}>
          Ne mogu da vidim ako mi ne dozvolis pristup kameri
        </Text>
        <Button onPress={requestPermission} title="daj pristup kameri" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {scanned === "null" && (
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
        <View style={{ marginTop: 16 }}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  text: {
    fontSize: 24,
    fontWeight: "bold",
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
});
