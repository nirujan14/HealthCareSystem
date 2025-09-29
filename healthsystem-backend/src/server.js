import "dotenv/config";
import express from "express";
import http from "http";
import cors from "cors";
import cookieParser from "cookie-parser";
import { Server as SocketIOServer } from "socket.io";

import { connectDB } from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import patientRoutes from "./routes/patientRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import recordRoutes from "./routes/recordRoutes.js";
import { attachSocket } from "./socket.js";

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PATCH"] }
});

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());

// inject io into req for controllers to emit
app.use((req, res, next) => { req.io = io; next(); });

app.get("/", (req, res) => res.send("Healthsystem API running"));
app.use("/auth", authRoutes);
app.use("/patients", patientRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/records", recordRoutes);

app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Server error" });
});

attachSocket(io);

const PORT = process.env.PORT || 5000;
connectDB(process.env.MONGO_URI)
  .then(() => server.listen(PORT, () => console.log(`🚀 API on http://localhost:${PORT}`)))
  .catch(err => console.error("Mongo error:", err));
