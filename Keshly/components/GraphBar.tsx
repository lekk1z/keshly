import { Dimensions, View } from "react-native";
import { BarChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export type BarDataset = { data: number[] };

export type BarDatum = {
  labels: string[];
  datasets: BarDataset[];
};

type Props = {
  barData?: BarDatum;
  labels?: string[];
  values?: number[];
};

const fallbackBarData: BarDatum = {
  labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
  datasets: [
    {
      data: [20, 45, 28, 80, 99, 43],
    },
  ],
};

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

function isValidBarData(input?: BarDatum): input is BarDatum {
  if (!input) {
    return false;
  }

  const labelsValid = Array.isArray(input.labels) && input.labels.length > 0;
  const valuesValid =
    Array.isArray(input.datasets) &&
    input.datasets.length > 0 &&
    Array.isArray(input.datasets[0]?.data) &&
    input.datasets[0].data.length > 0;

  return labelsValid && valuesValid;
}

function buildDataFromLabelsAndValues(
  labels?: string[],
  values?: number[],
): BarDatum | null {
  if (!labels || !values || labels.length === 0 || values.length === 0) {
    return null;
  }

  const safeLength = Math.min(labels.length, values.length);
  return {
    labels: labels.slice(0, safeLength),
    datasets: [
      {
        data: values.slice(0, safeLength).map((value) =>
          Number.isFinite(value) ? value : 0,
        ),
      },
    ],
  };
}

export default function GraphBar({ barData, labels, values }: Props) {
  const normalizedPropData = isValidBarData(barData)
    ? barData
    : buildDataFromLabelsAndValues(labels, values);
  const resolvedData = normalizedPropData ?? fallbackBarData;

  return (
    <View>
      <BarChart
        data={resolvedData}
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
