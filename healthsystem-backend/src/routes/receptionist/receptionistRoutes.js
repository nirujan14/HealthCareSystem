// src/routes/receptionist/receptionistRoutes.js
import express from "express";
import { addPatient } from "../../controllers/receptionistController.js";
import { authenticate, requireStaff } from "../../middleware/auth.js";
import multer from "multer";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Login route (already exists)
import receptionistLoginRouter from "./receptionistAuthRoutes.js";
router.use("/", receptionistLoginRouter);

// Add patient (Receptionist only)
router.post(
  "/patients",
  authenticate,       // use your existing auth
  requireStaff,       // receptionist is a type of staff
  upload.single("file"),
  addPatient
);

export default router;
