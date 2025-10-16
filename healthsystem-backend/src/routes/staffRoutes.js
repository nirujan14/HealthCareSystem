// Staff management routes
// Path: src/routes/staffRoutes.js

import { Router } from "express";
import { 
  authenticate, 
  requireStaff,
  requireRole
} from "../middleware/auth.js";
import { 
  getMe, 
  updateMe, 
  uploadAvatar, 
  avatarUploadMiddleware,
  getStaffById,
  listStaff,
  searchStaff,
  updateStaff,
  deactivateStaff,
  getAvailableDoctors
} from "../controllers/staffController.js";

const router = Router();

// ============ STAFF SELF-MANAGEMENT ============

/**
 * @route   GET /staff/me
 * @desc    Get own profile
 * @access  Private (Staff only)
 */
router.get("/me", authenticate, requireStaff, getMe);

/**
 * @route   PATCH /staff/me
 * @desc    Update own profile
 * @access  Private (Staff only)
 */
router.patch("/me", authenticate, requireStaff, updateMe);

/**
 * @route   POST /staff/me/avatar
 * @desc    Upload avatar
 * @access  Private (Staff only)
 */
router.post("/me/avatar", authenticate, requireStaff, avatarUploadMiddleware, uploadAvatar);

// ============ PUBLIC/PATIENT ACCESSIBLE ROUTES ============

/**
 * @route   GET /staff/doctors/available
 * @desc    Get available doctors for appointment booking
 * @access  Private (Both Patient and Staff)
 * @query   hospital, department, date, specialization
 */
router.get("/doctors/available", authenticate, getAvailableDoctors);

// ============ MANAGER/ADMIN ROUTES ============

/**
 * @route   GET /staff
 * @desc    List staff members
 * @access  Private (Manager, Admin)
 * @query   hospital, department, role, specialization, page, limit
 */
router.get(
  "/", 
  authenticate, 
  requireStaff,
  requireRole(["MANAGER", "ADMIN"]),
  listStaff
);

/**
 * @route   GET /staff/search
 * @desc    Search staff members
 * @access  Private (Manager, Admin)
 */
router.get(
  "/search", 
  authenticate, 
  requireStaff,
  requireRole(["MANAGER", "ADMIN"]),
  searchStaff
);

/**
 * @route   GET /staff/:id
 * @desc    Get staff member by ID
 * @access  Private (Manager, Admin)
 */
router.get(
  "/:id", 
  authenticate, 
  requireStaff,
  requireRole(["MANAGER", "ADMIN"]),
  getStaffById
);

/**
 * @route   PATCH /staff/:id
 * @desc    Update staff member
 * @access  Private (Manager, Admin)
 */
router.patch(
  "/:id", 
  authenticate, 
  requireStaff,
  requireRole(["MANAGER", "ADMIN"]),
  updateStaff
);

/**
 * @route   DELETE /staff/:id
 * @desc    Deactivate staff member
 * @access  Private (Admin only)
 */
router.delete(
  "/:id", 
  authenticate, 
  requireStaff,
  requireRole(["ADMIN"]),
  deactivateStaff
);

export default router;