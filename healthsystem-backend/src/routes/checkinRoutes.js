// Check-in Routes
// Path: src/routes/checkinRoutes.js

import { Router } from "express";
import { 
  authenticate, 
  requireStaff 
} from "../middleware/auth.js";
import { 
  verifyHealthCard,
  checkInAppointment,
  getCheckInStats
} from "../controllers/checkinController.js";

const router = Router();

/**
 * @route   POST /checkin/verify
 * @desc    Verify QR code and get patient details
 * @access  Private (Staff only)
 * @body    { healthCardId, patientId }
 */
router.post("/verify", authenticate, requireStaff, verifyHealthCard);

/**
 * @route   POST /checkin/appointment/:appointmentId
 * @desc    Check-in patient for appointment
 * @access  Private (Staff only)
 * @body    { notes }
 */
router.post("/appointment/:appointmentId", authenticate, requireStaff, checkInAppointment);

/**
 * @route   GET /checkin/stats
 * @desc    Get today's check-in statistics
 * @access  Private (Staff only)
 */
router.get("/stats", authenticate, requireStaff, getCheckInStats);

export default router;