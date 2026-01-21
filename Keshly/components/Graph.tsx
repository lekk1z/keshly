import React from "react";
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
    population: 20,
    color: "#FF6384",
    legendFontColor: "#7F7F7F",
    legendFontSize: 15,
  },
  {
    name: "Feb",
    population: 45,
    color: "#36A2EB",
    legendFontColor: "#7F7F7F",
    legendFontSize: 15,
  },
  {
    name: "Mar",
    population: 28,
    color: "#FFCE56",
    legendFontColor: "#7F7F7F",
    legendFontSize: 15,
  },
  {
    name: "Apr",
    population: 80,
    color: "#4BC0C0",
    legendFontColor: "#7F7F7F",
    legendFontSize: 15,
  },
  {
    name: "May",
    population: 99,
    color: "#9966FF",
    legendFontColor: "#7F7F7F",
    legendFontSize: 15,
  },
  {
    name: "Jun",
    population: 43,
    color: "#FF9F40",
    legendFontColor: "#7F7F7F",
    legendFontSize: 15,
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
          paddingLeft="15"
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
