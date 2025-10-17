import React from "react";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  const menu = [
    { name: "Dashboard", path: "/dashboard" },
    { name: "Add Patients", path: "/add-patient" },
    { name: "Doctors", path: "/doctors" },
    { name: "Bookings", path: "/bookings" },
  ];

  // Inline styles
  const sidebarStyle = {
    width: "240px", // approx w-60
    backgroundColor: "#f3f4f6", // gray-100
    height: "100vh",
    boxShadow: "2px 0 5px rgba(0,0,0,0.1)",
    padding: "1rem",
    boxSizing: "border-box",
  };

  const listStyle = {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
    padding: 0,
    margin: 0,
    listStyle: "none",
  };

  const linkStyle = {
    display: "block",
    padding: "0.5rem 0.75rem",
    borderRadius: "6px",
    textDecoration: "none",
    color: "#111827", // dark text
    cursor: "pointer",
  };

  const activeLinkStyle = {
    backgroundColor: "#93c5fd", // blue-300
    fontWeight: "bold",
  };

  const hoverStyle = {
    backgroundColor: "#bfdbfe", // blue-200
  };

  return (
    <aside style={sidebarStyle}>
      <ul style={listStyle}>
        {menu.map((item) => (
          <li key={item.path}>
            <Link
              to={item.path}
              style={{
                ...linkStyle,
                ...(location.pathname === item.path ? activeLinkStyle : {}),
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#bfdbfe")}
              onMouseOut={(e) =>
                (e.target.style.backgroundColor =
                  location.pathname === item.path ? "#93c5fd" : "transparent")
              }
            >
              {item.name}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}
