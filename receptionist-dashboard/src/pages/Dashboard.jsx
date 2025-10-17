import React from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function Dashboard() {
  const name = localStorage.getItem("name");

  // Inline styles
  const containerStyle = {
    display: "flex",
    height: "100vh",
  };

  const mainContentStyle = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
  };

  const pageContentStyle = {
    padding: "2rem",
    backgroundColor: "#f3f3f3",
    flex: 1,
    overflow: "auto",
  };

  const headerStyle = {
    fontSize: "1.875rem", // 3xl
    fontWeight: "bold",
    marginBottom: "1rem",
  };

  const gridStyle = {
    marginTop: "1.5rem",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "1.5rem",
  };

  const cardStyle = {
    backgroundColor: "#ffffff",
    padding: "1rem",
    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
    borderRadius: "8px",
  };

  const cardTitleStyle = {
    fontWeight: "bold",
    fontSize: "1.125rem", // lg
    marginBottom: "0.5rem",
  };

  return (
    <div style={containerStyle}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div style={mainContentStyle}>
        {/* Navbar */}
        <Navbar name={name} />

        {/* Page content */}
        <div style={pageContentStyle}>
          <h1 style={headerStyle}>Dashboard</h1>
          <p>Welcome to the Receptionist Dashboard. Use the sidebar to navigate.</p>

          {/* Dashboard cards */}
          <div style={gridStyle}>
            <div style={cardStyle}>
              <h2 style={cardTitleStyle}>Patients</h2>
              <p>Manage all registered patients</p>
            </div>
            <div style={cardStyle}>
              <h2 style={cardTitleStyle}>Doctors</h2>
              <p>Manage doctors</p>
            </div>
            <div style={cardStyle}>
              <h2 style={cardTitleStyle}>Bookings</h2>
              <p>View and manage appointments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
