// Department Management Routes
// Path: src/routes/departmentRoutes.js

import { Router } from "express";
import { 
  authenticate, 
  requireStaff,
  requireRole
} from "../middleware/auth.js";
import { 
  createDepartment,
  listDepartments,
  getDepartmentById,
  updateDepartment,
  deleteDepartment,
  getDepartmentsByHospital,
  assignHeadOfDepartment,
  updateEquipment,
  getDepartmentStats
} from "../controllers/departmentController.js";

const router = Router();

// ============ PUBLIC ROUTES ============

/**
 * @route   GET /departments
 * @desc    List all departments with filters
 * @access  Public
 * @query   hospital, category, isActive, page, limit
 */
router.get("/", listDepartments);

/**
 * @route   GET /departments/:id
 * @desc    Get department by ID
 * @access  Public
 */
router.get("/:id", getDepartmentById);

/**
 * @route   GET /departments/hospital/:hospitalId
 * @desc    Get all departments by hospital
 * @access  Public
 * @query   category, isActive
 */
router.get("/hospital/:hospitalId", getDepartmentsByHospital);

// ============ STAFF ROUTES ============

/**
 * @route   GET /departments/:id/stats
 * @desc    Get department statistics
 * @access  Private (Staff)
 */
router.get(
  "/:id/stats", 
  authenticate, 
  requireStaff,
  getDepartmentStats
);

// ============ MANAGER/ADMIN ROUTES ============

/**
 * @route   POST /departments
 * @desc    Create new department
 * @access  Private (Manager, Admin)
 */
router.post(
  "/", 
  authenticate, 
  requireStaff,
  requireRole(["MANAGER", "ADMIN"]),
  createDepartment
);

/**
 * @route   PATCH /departments/:id
 * @desc    Update department details
 * @access  Private (Manager, Admin)
 */
router.patch(
  "/:id", 
  authenticate, 
  requireStaff,
  requireRole(["MANAGER", "ADMIN"]),
  updateDepartment
);

/**
 * @route   DELETE /departments/:id
 * @desc    Deactivate department
 * @access  Private (Admin only)
 */
router.delete(
  "/:id", 
  authenticate, 
  requireStaff,
  requireRole(["ADMIN"]),
  deleteDepartment
);

/**
 * @route   PATCH /departments/:id/assign-head
 * @desc    Assign head of department
 * @access  Private (Manager, Admin)
 */
router.patch(
  "/:id/assign-head", 
  authenticate, 
  requireStaff,
  requireRole(["MANAGER", "ADMIN"]),
  assignHeadOfDepartment
);

/**
 * @route   PATCH /departments/:id/equipment
 * @desc    Update department equipment
 * @access  Private (Manager, Admin)
 */
router.patch(
  "/:id/equipment", 
  authenticate, 
  requireStaff,
  requireRole(["MANAGER", "ADMIN"]),
  updateEquipment
);

export default router;