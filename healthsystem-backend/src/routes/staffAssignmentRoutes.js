// Staff Assignment Routes (Extension to staff routes)
// Path: src/routes/staffAssignmentRoutes.js

import { Router } from "express";
import { 
  authenticate, 
  requireStaff,
  requireRole
} from "../middleware/auth.js";
import { 
  assignStaff,
  transferStaff,
  batchAssignStaff,
  updateStaffSchedule,
  getStaffByHospital,
  getStaffByDepartment,
  checkStaffAvailability
} from "../controllers/staffAssignmentController.js";

const router = Router();

// ============ PUBLIC/PATIENT ACCESSIBLE ROUTES ============

/**
 * @route   GET /staff-assignment/:id/availability
 * @desc    Check staff availability for appointment
 * @access  Private (Both Patient and Staff)
 * @query   date
 */
router.get(
  "/:id/availability", 
  authenticate,
  checkStaffAvailability
);

// ============ STAFF ROUTES ============

/**
 * @route   GET /staff-assignment/by-hospital/:hospitalId
 * @desc    Get staff by hospital
 * @access  Private (Staff)
 * @query   role, department, isActive, page, limit
 */
router.get(
  "/by-hospital/:hospitalId", 
  authenticate, 
  requireStaff,
  getStaffByHospital
);

/**
 * @route   GET /staff-assignment/by-department/:departmentId
 * @desc    Get staff by department
 * @access  Private (Staff)
 * @query   role, isActive
 */
router.get(
  "/by-department/:departmentId", 
  authenticate, 
  requireStaff,
  getStaffByDepartment
);

// ============ MANAGER/ADMIN ROUTES ============

/**
 * @route   POST /staff-assignment/assign
 * @desc    Assign staff to hospital and department
 * @access  Private (Manager, Admin)
 * @body    { staffId, hospitalId, departmentId }
 */
router.post(
  "/assign", 
  authenticate, 
  requireStaff,
  requireRole(["MANAGER", "ADMIN"]),
  assignStaff
);

/**
 * @route   POST /staff-assignment/transfer
 * @desc    Transfer staff between departments (same hospital)
 * @access  Private (Manager, Admin)
 * @body    { staffId, newDepartmentId, reason, effectiveDate }
 */
router.post(
  "/transfer", 
  authenticate, 
  requireStaff,
  requireRole(["MANAGER", "ADMIN"]),
  transferStaff
);

/**
 * @route   POST /staff-assignment/batch-assign
 * @desc    Batch assign multiple staff members
 * @access  Private (Admin only)
 * @body    { assignments: [{ staffId, hospitalId, departmentId }] }
 */
router.post(
  "/batch-assign", 
  authenticate, 
  requireStaff,
  requireRole(["ADMIN"]),
  batchAssignStaff
);

/**
 * @route   PATCH /staff-assignment/:id/schedule
 * @desc    Update staff schedule
 * @access  Private (Manager, Admin)
 * @body    { workingHours, shift, maxPatientsPerDay }
 */
router.patch(
  "/:id/schedule", 
  authenticate, 
  requireStaff,
  requireRole(["MANAGER", "ADMIN"]),
  updateStaffSchedule
);

export default router;