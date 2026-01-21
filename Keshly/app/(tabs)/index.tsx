import { Text, View, StyleSheet } from "react-native";
import Graph from "@/components/Graph"
export default function Index() {
  const user = "Marko";//fetch from login
  return (
    <View>
      <Text>Zdravo {user}!</Text>
      {/* Postaviti grafikon */}
      <Graph chartType="pie"></Graph>
    </View>
  );
}
