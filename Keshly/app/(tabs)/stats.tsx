import Graph from "@/components/Graph";
import { Text, View } from "react-native";

export default function Stats() {
  return (
    <View style={{marginTop: 50}}>
      <Text>stats screen</Text>
      <Graph chartType="bar"/>
    </View>
  );
}
