import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { listMine, getById, create, cancel, reschedule } from "../controllers/appointmentController.js";

const router = Router();

// Get user's appointments
router.get("/", auth, listMine);

// Get specific appointment
router.get("/:id", auth, getById);

// Create new appointment
router.post("/", auth, create);

// Cancel appointment
router.patch("/:id/cancel", auth, cancel);

// Reschedule appointment
router.patch("/:id/reschedule", auth, reschedule);

export default router;