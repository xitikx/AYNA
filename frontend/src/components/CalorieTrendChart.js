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
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
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
        labels.push(dateStr);
        const dailyTotal = dailyTotals.find((entry) => entry.date === dateStr);
        data.push(dailyTotal ? dailyTotal.totalCalories : 0);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      setChartData({
        labels,
        datasets: [
          {
            label: 'Daily Calorie Intake (kcal)',
            data,
            borderColor: '#3498db',
            backgroundColor: 'rgba(52, 152, 219, 0.2)',
            fill: true,
            tension: 0.3,
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
  }, [refresh]); // Re-fetch when refresh prop changes

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Calorie Intake Trend (Last 7 Days)',
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${context.parsed.y} kcal`,
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Date',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Calories (kcal)',
        },
        beginAtZero: true,
      },
    },
  };

  if (loading) {
    return <div>Loading chart...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="calorie-trend-chart">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default CalorieTrendChart;