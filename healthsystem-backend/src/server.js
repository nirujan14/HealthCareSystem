// Updated server.js with multi-role authentication
// Path: src/server.js

import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server as SocketIOServer } from "socket.io";

import { connectDB } from "./config/db.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import staffRoutes from "./routes/staffRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import recordRoutes from "./routes/recordRoutes.js";

import { attachSocket } from "./socket.js";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PATCH", "PUT", "DELETE"] }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Inject io into req for controllers to emit real-time events
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Request logging middleware (development only)
if (process.env.NODE_ENV !== "production") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, req.user ? `[${req.user.userType}]` : "[PUBLIC]");
    next();
  });
}

// Health check
app.get("/", (req, res) => {
  res.json({
    message: "Healthcare System API",
    version: "2.0.0",
    status: "running",
    endpoints: {
      auth: "/auth",
      patients: "/patients",
      staff: "/staff",
      appointments: "/appointments",
      records: "/records"
    }
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// API Routes
app.use("/auth", authRoutes);
app.use("/patients", patientRoutes);
app.use("/staff", staffRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/records", recordRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  
  // Mongoose validation error
  if (err.name === "ValidationError") {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ error: "Validation failed", details: errors });
  }
  
  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({ error: `${field} already exists` });
  }
  
  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token" });
  }
  
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ error: "Token expired" });
  }

  // Multer errors
  if (err.name === "MulterError") {
    return res.status(400).json({ error: `File upload error: ${err.message}` });
  }

  // Default server error
  res.status(err.status || 500).json({ 
    error: err.message || "Internal server error",
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack })
  });
});

// Attach Socket.IO handlers
attachSocket(io);

// Start server
const PORT = process.env.PORT || 5000;

connectDB(process.env.MONGO_URI)
  .then(() => {
    server.listen(PORT, () => {
      console.log("========================================");
      console.log("🏥 Healthcare System API");
      console.log("========================================");
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📡 Socket.IO enabled`);
      console.log(`🔐 Multi-role authentication active`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("========================================");
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  server.close(() => {
    console.log("HTTP server closed");
    process.exit(0);
  });
});