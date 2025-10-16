// Hospital Management Routes
// Path: src/routes/hospitalRoutes.js

import { Router } from "express";
import { 
  authenticate, 
  requireStaff,
  requireRole
} from "../middleware/auth.js";
import { 
  createHospital,
  listHospitals,
  getHospitalById,
  updateHospital,
  deleteHospital,
  searchHospitals,
  getHospitalStats,
  updateBedAvailability
} from "../controllers/hospitalController.js";

const router = Router();

// ============ PUBLIC ROUTES ============

/**
 * @route   GET /hospitals
 * @desc    List all hospitals with filters
 * @access  Public
 * @query   type, city, district, province, facilities, isActive, page, limit
 */
router.get("/", listHospitals);

/**
 * @route   GET /hospitals/search
 * @desc    Search hospitals by name, location, or coordinates
 * @access  Public
 * @query   q, near, radius, type, facilities
 */
router.get("/search", searchHospitals);

/**
 * @route   GET /hospitals/:id
 * @desc    Get hospital by ID
 * @access  Public
 */
router.get("/:id", getHospitalById);

// ============ STAFF ROUTES ============

/**
 * @route   GET /hospitals/:id/stats
 * @desc    Get hospital statistics
 * @access  Private (Manager, Admin)
 */
router.get(
  "/:id/stats", 
  authenticate, 
  requireStaff,
  requireRole(["MANAGER", "ADMIN"]),
  getHospitalStats
);

/**
 * @route   PATCH /hospitals/:id/beds
 * @desc    Update bed availability
 * @access  Private (Staff - Receptionist, Nurse, Manager, Admin)
 */
router.patch(
  "/:id/beds", 
  authenticate, 
  requireStaff,
  requireRole(["RECEPTIONIST", "NURSE", "MANAGER", "ADMIN"]),
  updateBedAvailability
);

// ============ MANAGER/ADMIN ROUTES ============

/**
 * @route   POST /hospitals
 * @desc    Create new hospital
 * @access  Private (Admin only)
 */
router.post(
  "/", 
  authenticate, 
  requireStaff,
  requireRole(["ADMIN"]),
  createHospital
);

/**
 * @route   PATCH /hospitals/:id
 * @desc    Update hospital details
 * @access  Private (Manager, Admin)
 */
router.patch(
  "/:id", 
  authenticate, 
  requireStaff,
  requireRole(["MANAGER", "ADMIN"]),
  updateHospital
);

/**
 * @route   DELETE /hospitals/:id
 * @desc    Deactivate hospital
 * @access  Private (Admin only)
 */
router.delete(
  "/:id", 
  authenticate, 
  requireStaff,
  requireRole(["ADMIN"]),
  deleteHospital
);

export default router;