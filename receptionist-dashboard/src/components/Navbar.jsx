import React from "react";

export default function Navbar({ name }) {
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("name");
    window.location.href = "/";
  };

  // Inline styles
  const navStyle = {
    backgroundColor: "#2563eb", // blue-600
    color: "#ffffff",
    padding: "1rem 1.5rem",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  };

  const brandStyle = {
    fontSize: "1.25rem", // text-xl
    fontWeight: "bold",
  };

  const userContainerStyle = {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  };

  const logoutButtonStyle = {
    backgroundColor: "#ef4444", // red-500
    color: "#ffffff",
    padding: "0.25rem 0.75rem",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
  };

  const logoutButtonHoverStyle = {
    backgroundColor: "#dc2626", // red-600
  };

  return (
    <nav style={navStyle}>
      <div style={brandStyle}>Healthcare System</div>
      <div style={userContainerStyle}>
        <span>Welcome, {name}</span>
        <button
          onClick={handleLogout}
          style={logoutButtonStyle}
          onMouseOver={(e) => (e.target.style.backgroundColor = "#dc2626")}
          onMouseOut={(e) => (e.target.style.backgroundColor = "#ef4444")}
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
