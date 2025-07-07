"use client"

import { useEffect, useRef } from "react"
import { useTheme } from "next-themes"
import { Line, Bar, Pie } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  type ChartOptions,
} from "chart.js"

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend)

interface ChartProps {
  data: any[]
  xAxisKey: string
  yAxisKey: string[]
}

interface PieChartProps {
  data: {
    name: string
    value: number
  }[]
}

export function LineChart({ data, xAxisKey, yAxisKey }: ChartProps) {
  const { theme } = useTheme()
  const chartRef = useRef<ChartJS>(null)

  useEffect(() => {
    // Update chart colors when theme changes
    if (chartRef.current) {
      chartRef.current.update()
    }
  }, [theme])

  const isDark = theme === "dark"
  const textColor = isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)"
  const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"

  const chartData = {
    labels: data.map((item) => item[xAxisKey]),
    datasets: yAxisKey.map((key, index) => ({
      label: key,
      data: data.map((item) => item[key]),
      borderColor: getColor(index),
      backgroundColor: getColorWithOpacity(index, 0.5),
      tension: 0.3,
      pointRadius: 3,
      pointHoverRadius: 5,
    })),
  }

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
      },
      y: {
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: textColor,
        },
      },
      tooltip: {
        backgroundColor: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)",
        titleColor: isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
        bodyColor: isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
        borderColor: gridColor,
        borderWidth: 1,
      },
    },
  }

  return <Line ref={chartRef} data={chartData} options={options} />
}

export function BarChart({ data, xAxisKey, yAxisKey }: ChartProps) {
  const { theme } = useTheme()
  const chartRef = useRef<ChartJS>(null)

  useEffect(() => {
    // Update chart colors when theme changes
    if (chartRef.current) {
      chartRef.current.update()
    }
  }, [theme])

  const isDark = theme === "dark"
  const textColor = isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)"
  const gridColor = isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)"

  const chartData = {
    labels: data.map((item) => item[xAxisKey]),
    datasets: yAxisKey.map((key, index) => ({
      label: key,
      data: data.map((item) => item[key]),
      backgroundColor: getColorWithOpacity(index, 0.7),
      borderColor: getColor(index),
      borderWidth: 1,
    })),
  }

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
      },
      y: {
        grid: {
          color: gridColor,
        },
        ticks: {
          color: textColor,
        },
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: textColor,
        },
      },
      tooltip: {
        backgroundColor: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)",
        titleColor: isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
        bodyColor: isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
        borderColor: gridColor,
        borderWidth: 1,
      },
    },
  }

  return <Bar ref={chartRef} data={chartData} options={options} />
}

export function PieChart({ data }: PieChartProps) {
  const { theme } = useTheme()
  const chartRef = useRef<ChartJS>(null)

  useEffect(() => {
    // Update chart colors when theme changes
    if (chartRef.current) {
      chartRef.current.update()
    }
  }, [theme])

  const isDark = theme === "dark"
  const textColor = isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)"

  const chartData = {
    labels: data.map((item) => item.name),
    datasets: [
      {
        data: data.map((item) => item.value),
        backgroundColor: data.map((_, index) => getColorWithOpacity(index, 0.7)),
        borderColor: data.map((_, index) => getColor(index)),
        borderWidth: 1,
      },
    ],
  }

  const options: ChartOptions<"pie"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "right" as const,
        labels: {
          color: textColor,
        },
      },
      tooltip: {
        backgroundColor: isDark ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)",
        titleColor: isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
        bodyColor: isDark ? "rgba(255, 255, 255, 0.8)" : "rgba(0, 0, 0, 0.8)",
      },
    },
  }

  return <Pie ref={chartRef} data={chartData} options={options} />
}

// Helper functions for colors
function getColor(index: number): string {
  const colors = [
    "rgb(59, 130, 246)", // blue-500
    "rgb(16, 185, 129)", // emerald-500
    "rgb(239, 68, 68)", // red-500
    "rgb(245, 158, 11)", // amber-500
    "rgb(139, 92, 246)", // violet-500
    "rgb(236, 72, 153)", // pink-500
    "rgb(20, 184, 166)", // teal-500
    "rgb(249, 115, 22)", // orange-500
  ]
  return colors[index % colors.length]
}

function getColorWithOpacity(index: number, opacity: number): string {
  const colors = [
    `rgba(59, 130, 246, ${opacity})`, // blue-500
    `rgba(16, 185, 129, ${opacity})`, // emerald-500
    `rgba(239, 68, 68, ${opacity})`, // red-500
    `rgba(245, 158, 11, ${opacity})`, // amber-500
    `rgba(139, 92, 246, ${opacity})`, // violet-500
    `rgba(236, 72, 153, ${opacity})`, // pink-500
    `rgba(20, 184, 166, ${opacity})`, // teal-500
    `rgba(249, 115, 22, ${opacity})`, // orange-500
  ]
  return colors[index % colors.length]
}
