import React, { useState, useEffect } from "react";
import axios from "axios";
import "../styles/Dashboard.css";

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [diaryCount, setDiaryCount] = useState(0);
  const [todoCount, setTodoCount] = useState(0);
  const [calorieToday, setCalorieToday] = useState(0);
  const [subscriptionsCount, setSubscriptionsCount] = useState(0);
  const [averageDailySpending, setAverageDailySpending] = useState(0);
  const [upcomingEventsCount, setUpcomingEventsCount] = useState(0);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await axios.get(
          "http://localhost:3000/api/check-session",
          {
            withCredentials: true,
          }
        );
        if (response.data.message === "User is logged in") {
          setUser(response.data.user);
          fetchSummaries();
        } else {
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Session check error:", error);
        window.location.href = "/";
      }
    };
    checkSession();
  }, []);

  const fetchSummaries = async () => {
    try {
      const [subscriptionsRes, diaryRes, todoRes, calorieRes, eventsRes] =
        await Promise.all([
          axios.get("http://localhost:3000/api/subscriptions", {
            withCredentials: true,
          }),
          axios.get("http://localhost:3000/api/diary", {
            withCredentials: true,
          }),
          axios.get("http://localhost:3000/api/todos?completed=false", {
            withCredentials: true,
          }),
          axios.get(
            `http://localhost:3000/api/calories?date=${
              new Date().toISOString().split("T")[0]
            }`,
            {
              withCredentials: true,
            }
          ),
          axios.get("http://localhost:3000/api/events/upcoming", {
            withCredentials: true,
          }),
        ]);
      setSubscriptionsCount(subscriptionsRes.data.data.subscriptions.length);
      setAverageDailySpending(subscriptionsRes.data.data.averageDailySpending);
      setDiaryCount(diaryRes.data.data.length);
      setTodoCount(todoRes.data.data.length);
      setCalorieToday(
        calorieRes.data.data.reduce((sum, entry) => sum + entry.calories, 0)
      );
      setUpcomingEventsCount(eventsRes.data.data.length);
    } catch (error) {
      console.error("Error fetching summaries:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await axios.get("http://localhost:3000/logout", {
        withCredentials: true,
      });
      window.location.href = "/";
    } catch (error) {
      setMessage("Error logging out");
    }
  };

  const openMiniApp = (appName) => {
    const miniAppRoutes = {
      Finance: "/mini-apps/finance",
      Calorie: "/mini-apps/calorie",
      "To-Do": "/mini-apps/todo",
      Diary: "/mini-apps/diary",
      Subscriptions: "/mini-apps/subscriptions",
      Calendar: "/mini-apps/calendar",
    };
    const url = miniAppRoutes[appName];
    window.open(url, "_blank");
  };

  const miniApps = [
    {
      name: "Finance",
      summary: "Total Spent: $150",
      icon: "fa-wallet",
      color: "finance-color",
    },
    {
      name: "Calorie",
      summary: `Today: ${calorieToday} kcal`,
      icon: "fa-apple-alt",
      color: "calorie-color",
    },
    {
      name: "To-Do",
      summary: `Pending: ${todoCount}`,
      icon: "fa-check-square",
      color: "todo-color",
    },
    {
      name: "Diary",
      summary: `Entries: ${diaryCount}`,
      icon: "fa-book",
      color: "diary-color",
    },
    {
      name: "Subscriptions",
      summary: `Daily: ₹${parseFloat(averageDailySpending).toFixed(2)}`,
      icon: "fa-credit-card",
      color: "subscriptions-color",
    },
    {
      name: "Calendar",
      summary: `Upcoming: ${upcomingEventsCount}`,
      icon: "fa-calendar-alt",
      color: "calendar-color",
    },
  ];

  if (!user) return <div className="dashboard-loading">Loading...</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-reflection"></div>
      <header className="dashboard-topbar">
        <div className="dashboard-topbar-content">
          <h1 className="dashboard-greeting">
            Welcome, {user.name || user.username.split("@")[0]}
          </h1>
          <button className="dashboard-exit-btn" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </header>
      <main className="dashboard-body">
        <div className="dashboard-panel">
          <div className="dashboard-tiles">
            {miniApps.map((app) => (
              <div key={app.name} className={`dashboard-tile ${app.color}`}>
                <div className="dashboard-tile-icon">
                  <i className={`fas ${app.icon}`}></i>
                </div>
                <div className="dashboard-tile-info">
                  <h2>{app.name}</h2>
                  <p>{app.summary}</p>
                  <button
                    className="dashboard-open-btn"
                    onClick={() => openMiniApp(app.name)}
                  >
                    Launch
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      {message && <p className="dashboard-alert">{message}</p>}
    </div>
  );
};

export default Dashboard;
