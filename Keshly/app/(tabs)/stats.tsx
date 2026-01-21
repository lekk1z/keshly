import Graph from "@/components/Graph";
import { Text, View } from "react-native";

export default function Stats() {
  return (
    <View>
      <Text>stats screen</Text>
      <Graph chartType="bar"/>
    </View>
  );
}
