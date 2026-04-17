import React, { useState } from "react";
import "../css/AdminDashboard.css";

const metricCards = [
  {
    title: "Total Nilai Project",
    value: "Rp48,295 jt",
    change: "+12.5%",
    changeType: "up",
    note: "vs bulan lalu",
    icon: "money",
    iconClass: "green",
    lineClass: "green-line",
    data: [10, 12, 9, 14, 11, 15, 18, 14, 20, 17, 22, 24],
  },
  {
    title: "Proyek Aktif",
    value: "2,847",
    change: "+8.2%",
    changeType: "up",
    note: "vs bulan lalu",
    icon: "users",
    iconClass: "cyan",
    lineClass: "cyan-line",
    data: [8, 12, 10, 16, 14, 19, 15, 22, 19, 24, 21, 27],
  },
  {
    title: "Permintaan Material",
    value: "1,432",
    change: "-3.1%",
    changeType: "down",
    note: "vs bulan lalu",
    icon: "cart",
    iconClass: "blue",
    lineClass: "blue-line",
    data: [20, 22, 25, 21, 17, 19, 15, 18, 16, 14, 17, 15],
  },
  {
    title: "Dokumentasi Lapangan",
    value: "284K",
    change: "+24.7%",
    changeType: "up",
    note: "vs bulan lalu",
    icon: "eye",
    iconClass: "yellow",
    lineClass: "yellow-line",
    data: [9, 11, 10, 13, 15, 15, 17, 18, 19, 21, 23, 25],
  },
];

const overviewData = {
  progress: [18, 22, 19, 29, 32, 30, 36, 38, 42, 40, 45, 49],
  material: [14, 18, 16, 24, 27, 25, 31, 34, 36, 35, 39, 43],
  budget: [10, 13, 15, 20, 23, 22, 28, 30, 33, 36, 40, 44],
};

const statusProject = [
  { label: "On Track", value: 35, color: "#0f9c4a" },
  { label: "Need Review", value: 28, color: "#0ea5a8" },
  { label: "Delayed", value: 22, color: "#2f80ed" },
  { label: "Completed", value: 15, color: "#a55ac5" },
];

const monthlyGoals = [
  {
    title: "Progress Proyek Bulanan",
    percent: 88,
    value: "48.295",
    target: "Target: 55.000",
    color: "#0f9c4a",
  },
  {
    title: "Pemasangan Selesai",
    percent: 85,
    value: "847",
    target: "Target: 1.000",
    color: "#0ea5a8",
  },
  {
    title: "Ketersediaan Material",
    percent: 76,
    value: "3.8",
    target: "Target: 5",
    color: "#2f80ed",
  },
];

const recentClients = [
  {
    initials: "EW",
    name: "Emma Wilson",
    email: "emma@example.com",
    projectId: "PRJ-7891",
    projectName: "Kitchen Set Minimalis",
    status: "Completed",
    amount: "Rp299.000.000",
    avatarClass: "green",
    statusClass: "completed",
  },
  {
    initials: "JC",
    name: "James Chen",
    email: "james@company.io",
    projectId: "PRJ-7890",
    projectName: "Office Interior Modern",
    status: "Processing",
    amount: "Rp599.000.000",
    avatarClass: "cyan",
    statusClass: "processing",
  },
  {
    initials: "SG",
    name: "Sofia Garcia",
    email: "sofia@startup.co",
    projectId: "PRJ-7889",
    projectName: "Bedroom Set Custom",
    status: "Completed",
    amount: "Rp1.499.000.000",
    avatarClass: "blue",
    statusClass: "completed",
  },
  {
    initials: "AT",
    name: "Alex Thompson",
    email: "alex@dev.com",
    projectId: "PRJ-7888",
    projectName: "Living Room Interior",
    status: "Pending",
    amount: "Rp79.000.000",
    avatarClass: "yellow",
    statusClass: "pending",
  },
  {
    initials: "MS",
    name: "Maria Santos",
    email: "maria@agency.co",
    projectId: "PRJ-7887",
    projectName: "Cafe Interior Concept",
    status: "Completed",
    amount: "Rp299.000.000",
    avatarClass: "purple",
    statusClass: "completed",
  },
  {
    initials: "DK",
    name: "David Kim",
    email: "david@tech.io",
    projectId: "PRJ-7886",
    projectName: "Retail Display Interior",
    status: "Cancelled",
    amount: "Rp599.000.000",
    avatarClass: "green2",
    statusClass: "cancelled",
  },
];

const recentActivities = [
  {
    title: "Update progress lapangan",
    desc: "Kitchen Set Minimalis mencapai 82%",
    time: "2 min ago",
    color: "green",
    icon: "doc",
  },
  {
    title: "Client baru ditambahkan",
    desc: "Data client untuk Office Interior Modern berhasil dibuat",
    time: "15 min ago",
    color: "cyan",
    icon: "user",
  },
  {
    title: "Review revisi diterima",
    desc: "Client meminta revisi finishing pada Bedroom Set",
    time: "1 hour ago",
    color: "purple",
    icon: "star",
  },
  {
    title: "Pembayaran diterima",
    desc: "DP untuk Living Room Interior telah masuk",
    time: "2 hours ago",
    color: "blue",
    icon: "card",
  },
  {
    title: "Tiket support selesai",
    desc: "Permintaan update material telah diproses",
    time: "3 hours ago",
    color: "yellow",
    icon: "ticket",
  },
  {
    title: "Dokumentasi diunggah",
    desc: "Foto pemasangan terbaru berhasil ditambahkan",
    time: "5 hours ago",
    color: "green",
    icon: "doc",
  },
];

function buildPath(data, width = 100, height = 42, padding = 4) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / (data.length - 1);
    const y =
      height - padding - ((value - min) / range) * (height - padding * 2);
    return [x, y];
  });

  return points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point[0]} ${point[1]}`)
    .join(" ");
}

function buildAreaPath(data, width = 100, height = 42, padding = 4) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((value, index) => {
    const x = padding + (index * (width - padding * 2)) / (data.length - 1);
    const y =
      height - padding - ((value - min) / range) * (height - padding * 2);
    return [x, y];
  });

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point[0]} ${point[1]}`)
    .join(" ");

  return `${line} L ${width - padding} ${height - 1} L ${padding} ${height - 1} Z`;
}

function Sparkline({ data, className }) {
  const linePath = buildPath(data);
  const areaPath = buildAreaPath(data);

  return (
    <svg
      className={`sparkline ${className}`}
      viewBox="0 0 100 42"
      preserveAspectRatio="none"
    >
      <path className="sparkline-area" d={areaPath} />
      <path className="sparkline-line" d={linePath} />
    </svg>
  );
}

function OverviewChart({ data }) {
  const width = 1000;
  const height = 340;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 38;

  const max = 60;
  const min = 0;

  const points = data.map((value, index) => {
    const x =
      paddingLeft +
      (index * (width - paddingLeft - paddingRight)) / (data.length - 1);
    const y =
      paddingTop +
      ((max - value) / (max - min)) * (height - paddingTop - paddingBottom);
    return [x, y];
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point[0]} ${point[1]}`)
    .join(" ");

  const areaPath = `${linePath} L ${width - paddingRight} ${
    height - paddingBottom
  } L ${paddingLeft} ${height - paddingBottom} Z`;

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const yLabels = [
    "Rp.1.031.814,27",
    "Rp.773.860,71",
    "Rp.515.907,14",
    "Rp.257.953,57",
    "Rp.0",
  ];
  const yValues = [60, 45, 30, 15, 0];

  return (
    <div className="overview-chart-wrap">
      <svg
        className="overview-chart"
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
      >
        {yValues.map((value) => {
          const y =
            paddingTop +
            ((max - value) / (max - min)) *
              (height - paddingTop - paddingBottom);

          return (
            <line
              key={value}
              x1={paddingLeft}
              y1={y}
              x2={width - paddingRight}
              y2={y}
              className="overview-grid"
            />
          );
        })}

        <path className="overview-area" d={areaPath} />
        <path className="overview-line" d={linePath} />
      </svg>

      <div className="overview-y-labels">
        {yLabels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

      <div className="overview-x-labels">
        {months.map((month) => (
          <span key={month}>{month}</span>
        ))}
      </div>
    </div>
  );
}

function DonutChart({ data }) {
  let start = 0;
  const gradientParts = data.map((item) => {
    const end = start + item.value;
    const part = `${item.color} ${start}% ${end}%`;
    start = end;
    return part;
  });

  return (
    <div className="status-chart-box">
      <div
        className="donut-chart"
        style={{ background: `conic-gradient(${gradientParts.join(", ")})` }}
      >
        <div className="donut-inner">
          <h3>284K</h3>
          <p>Visits</p>
        </div>
      </div>

      <div className="status-legend">
        {data.map((item) => (
          <div className="legend-row" key={item.label}>
            <div className="legend-left">
              <span
                className="legend-dot"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.label}</span>
            </div>
            <strong>{item.value}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function Icon({ name }) {
  switch (name) {
    case "money":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M12 3v18" />
          <path d="M16.5 7.5c0-1.657-2.015-3-4.5-3s-4.5 1.343-4.5 3 2.015 3 4.5 3 4.5 1.343 4.5 3-2.015 3-4.5 3-4.5-1.343-4.5-3" />
        </svg>
      );
    case "users":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
          <circle cx="9.5" cy="7" r="3" />
          <path d="M20 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 4.13a3 3 0 0 1 0 5.74" />
        </svg>
      );
    case "cart":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="9" cy="20" r="1.4" />
          <circle cx="18" cy="20" r="1.4" />
          <path d="M3 4h2l2.4 10.2a1 1 0 0 0 1 .8h9.9a1 1 0 0 0 1-.76L21 8H7" />
        </svg>
      );
    case "eye":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" />
          <circle cx="12" cy="12" r="2.8" />
        </svg>
      );
    default:
      return null;
  }
}

function ActivityIcon({ type }) {
  switch (type) {
    case "doc":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M8 3h6l5 5v13H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
          <path d="M14 3v5h5" />
        </svg>
      );
    case "user":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="8" r="3.2" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="m12 3 2.7 5.47 6.03.88-4.36 4.25 1.03 6-5.4-2.84-5.4 2.84 1.03-6L3.27 9.35l6.03-.88L12 3Z" />
        </svg>
      );
    case "card":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="M3 10h18" />
        </svg>
      );
    case "ticket":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M4 7a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-3a2 2 0 0 0 0-4V7Z" />
          <path d="M12 7v10" />
        </svg>
      );
    default:
      return null;
  }
}

function MetricCard({ item }) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <div>
          <p className="metric-title">{item.title}</p>
          <h3 className="metric-value">{item.value}</h3>

          <div className={`metric-change ${item.changeType}`}>
            <span className="metric-arrow">
              {item.changeType === "up" ? "↗" : "↘"}
            </span>
            <strong>{item.change}</strong>
            <span>{item.note}</span>
          </div>
        </div>

        <div className={`metric-icon ${item.iconClass}`}>
          <Icon name={item.icon} />
        </div>
      </div>

      <div className="metric-chart">
        <Sparkline data={item.data} className={item.lineClass} />
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("progress");
  const currentData = overviewData[activeTab];

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>
          Welcome back. Here's what's happening with your interior business
          today.
        </p>
      </div>

      <div className="metrics-grid">
        {metricCards.map((item) => (
          <MetricCard key={item.title} item={item} />
        ))}
      </div>

      <div className="dashboard-main-grid">
        <div className="panel overview-panel">
          <div className="panel-head panel-head-space">
            <div>
              <h2>Overview</h2>
              <p>Monthly performance for the current year</p>
            </div>

            <div className="segment-tabs">
              <button
                className={activeTab === "progress" ? "active" : ""}
                onClick={() => setActiveTab("progress")}
              >
                Progress
              </button>

              <button
                className={activeTab === "material" ? "active" : ""}
                onClick={() => setActiveTab("material")}
              >
                Material
              </button>

              <button
                className={activeTab === "budget" ? "active" : ""}
                onClick={() => setActiveTab("budget")}
              >
                Budget
              </button>
            </div>
          </div>

          <OverviewChart data={currentData} />
        </div>

        <div className="right-column">
          <div className="panel">
            <div className="panel-head">
              <div>
                <h2>Project Status</h2>
                <p>Distribution of current interior project conditions</p>
              </div>
            </div>

            <DonutChart data={statusProject} />
          </div>

          <div className="panel">
            <div className="panel-head">
              <div>
                <h2>Monthly Goals</h2>
                <p>Track progress toward targets</p>
              </div>
            </div>

            <div className="goals-list">
              {monthlyGoals.map((goal) => (
                <div className="goal-item" key={goal.title}>
                  <div className="goal-title-row">
                    <span>{goal.title}</span>
                    <strong>{goal.percent}%</strong>
                  </div>

                  <div className="goal-bar">
                    <div
                      className="goal-fill"
                      style={{
                        width: `${goal.percent}%`,
                        backgroundColor: goal.color,
                      }}
                    />
                  </div>

                  <div className="goal-footer">
                    <span>{goal.value}</span>
                    <span>{goal.target}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-bottom-grid">
        <div className="panel clients-panel">
          <div className="clients-head">
            <div>
              <h2>Recent Clients</h2>
              <p>Latest client projects from your interior business</p>
            </div>

            <button className="view-all-btn">
              View all <span>↗</span>
            </button>
          </div>

          <div className="clients-table-wrap desktop-only">
            <table className="clients-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Project ID</th>
                  <th>Project</th>
                  <th>Status</th>
                  <th>Budget</th>
                </tr>
              </thead>

              <tbody>
                {recentClients.map((client) => (
                  <tr key={client.projectId}>
                    <td>
                      <div className="client-cell">
                        <div className={`client-avatar ${client.avatarClass}`}>
                          {client.initials}
                        </div>

                        <div className="client-info">
                          <h4>{client.name}</h4>
                          <p>{client.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="project-id">{client.projectId}</td>
                    <td className="project-name">{client.projectName}</td>

                    <td>
                      <span className={`status-badge ${client.statusClass}`}>
                        {client.status}
                      </span>
                    </td>

                    <td className="project-amount">{client.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="clients-mobile-list mobile-only">
            {recentClients.map((client) => (
              <div
                className="client-mobile-card"
                key={`mobile-${client.projectId}`}
              >
                <div className="client-mobile-top">
                  <div className="client-cell">
                    <div className={`client-avatar ${client.avatarClass}`}>
                      {client.initials}
                    </div>

                    <div className="client-info">
                      <h4>{client.name}</h4>
                      <p>{client.email}</p>
                    </div>
                  </div>

                  <span className={`status-badge ${client.statusClass}`}>
                    {client.status}
                  </span>
                </div>

                <div className="client-mobile-meta">
                  <div>
                    <span>Project ID</span>
                    <strong>{client.projectId}</strong>
                  </div>
                  <div>
                    <span>Project</span>
                    <strong>{client.projectName}</strong>
                  </div>
                  <div>
                    <span>Budget</span>
                    <strong>{client.amount}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel activity-panel">
          <div className="clients-head">
            <div>
              <h2>Recent Activity</h2>
              <p>Latest updates from your interior projects</p>
            </div>

            <button className="view-all-btn">
              View all <span>↗</span>
            </button>
          </div>

          <div className="activity-list">
            {recentActivities.map((item, index) => (
              <div className="activity-item" key={`${item.title}-${index}`}>
                <div className={`activity-icon ${item.color}`}>
                  <ActivityIcon type={item.icon} />
                </div>

                <div className="activity-content">
                  <h4>{item.title}</h4>
                  <p>{item.desc}</p>
                  <span>{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
