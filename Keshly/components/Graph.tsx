import { Dimensions, View } from "react-native";
import { BarChart, PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;
type Props = {
  chartType: string;
};

const barData = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      data: [20, 45, 28, 80, 99, 43],
    },
  ],
};

const pieData = [
  {
    name: "Jan",
    population: 25,
    color: "#F87171",
  },
  {
    name: "Feb",
    population: 15,
    color: "#60A5FA",
  },
  {
    name: "Mar",
    population: 10,
    color: "#34D399",
  },
  {
    name: "Apr",
    population: 20,
    color: "#FBBF24",
  },
  {
    name: "May",
    population: 30,
    color: "#4B5563",
  },
];

const chartConfig = {
  backgroundColor: "#ffffff",
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  decimalPlaces: 0,
  color: (opacity = 1) => `rgba(0, 122, 255, ${opacity})`,
  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
  style: {
    borderRadius: 16,
  },
  propsForDots: {
    r: "6",
    strokeWidth: "2",
    stroke: "#ffa726",
  },
};

export default function Graph({ chartType }: Props) {
  if (chartType === "pie") {
    return (
      <View>
        <PieChart
          data={pieData}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="0"
          center={[80,0]}
          hasLegend={false}
        />
      </View>
    );
  }

  return (
    <View>
      <BarChart
        data={barData}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        verticalLabelRotation={30}
        showValuesOnTopOfBars={true}
        yAxisLabel=""
        yAxisSuffix=""
      />
    </View>
  );
}
