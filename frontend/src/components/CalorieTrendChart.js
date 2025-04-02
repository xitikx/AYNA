// CalorieTrendChart.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const CalorieTrendChart = ({ refresh }) => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCalorieTrend = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 6);

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const response = await axios.get(
        `http://localhost:3000/api/calories/daily-totals?startDate=${startDateStr}&endDate=${endDateStr}`,
        { withCredentials: true }
      );

      const dailyTotals = response.data.data || [];

      const labels = [];
      const data = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const dateStr = currentDate.toISOString().split('T')[0];
        labels.push(new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        const dailyTotal = dailyTotals.find((entry) => entry.date === dateStr);
        data.push(dailyTotal ? dailyTotal.totalCalories : 0);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setChartData({
        labels,
        datasets: [
          {
            label: 'Calories',
            data,
            borderColor: '#22c55e', // Green line
            backgroundColor: 'rgba(34, 197, 94, 0.2)', // Light green fill
            borderWidth: 3,
            tension: 0.4,
            fill: true,
            pointBackgroundColor: '#FFFFFF',
            pointBorderColor: '#22c55e', // Green points
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointHoverBorderWidth: 3,
            pointHoverBorderColor: '#16a34a', // Darker green on hover
          },
        ],
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching calorie trend:', error.response ? error.response.data : error.message);
      setError('Failed to load calorie trend data.');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalorieTrend();
  }, [refresh]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#22c55e', // Green title in tooltip
        bodyColor: '#1e293b', // Matches --dark from theme
        borderColor: 'rgba(34, 197, 94, 0.3)',
        borderWidth: 1,
        padding: 12,
        usePointStyle: true,
        callbacks: {
          label: (context) => `${context.parsed.y} kcal`,
          title: (context) => context[0].label,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8', // Matches --muted from theme
          font: {
            weight: 500,
          },
        },
      },
      y: {
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          color: '#94a3b8', // Matches --muted from theme
          font: {
            weight: 500,
          },
          callback: (value) => `${value} kcal`,
        },
      },
    },
    elements: {
      line: {
        borderJoinStyle: 'round',
      },
      point: {
        hoverBorderColor: '#16a34a', // Darker green on hover
      },
    },
  };

  if (loading) {
    return <div className="calorie-chart-loading">Loading chart data...</div>;
  }

  if (error) {
    return <div className="calorie-chart-error">{error}</div>;
  }

  return (
    <div className="calorie-chart-container">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default CalorieTrendChart;