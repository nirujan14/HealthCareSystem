// Updated patient routes with RBAC
// Path: src/routes/patientRoutes.js

import { Router } from "express";
import { 
  authenticate, 
  requirePatient,
  requireStaff,
  requirePermission,
  requireRole
} from "../middleware/auth.js";
import { 
  getMe, 
  updateMe, 
  uploadAvatar, 
  avatarUploadMiddleware,
  getPatientById,
  searchPatients,
  updatePatient,
  listPatients
} from "../controllers/patientController.js";

const router = Router();

// ============ PATIENT ROUTES (Self-management) ============

/**
 * @route   GET /patients/me
 * @desc    Get own profile
 * @access  Private (Patient only)
 */
router.get("/me", authenticate, requirePatient, getMe);

/**
 * @route   PATCH /patients/me
 * @desc    Update own profile
 * @access  Private (Patient only)
 */
router.patch("/me", authenticate, requirePatient, updateMe);

/**
 * @route   POST /patients/me/avatar
 * @desc    Upload avatar
 * @access  Private (Patient only)
 */
router.post("/me/avatar", authenticate, requirePatient, avatarUploadMiddleware, uploadAvatar);

// ============ STAFF ROUTES (Patient management) ============

/**
 * @route   GET /patients
 * @desc    List all patients (paginated)
 * @access  Private (Staff only - Receptionist, Doctor, Nurse, Manager, Admin)
 */
router.get(
  "/", 
  authenticate, 
  requireStaff,
  requirePermission("READ_PATIENT"),
  listPatients
);

/**
 * @route   GET /patients/search
 * @desc    Search patients
 * @access  Private (Staff only)
 */
router.get(
  "/search", 
  authenticate, 
  requireStaff,
  requirePermission("READ_PATIENT"),
  searchPatients
);

/**
 * @route   GET /patients/:id
 * @desc    Get patient by ID
 * @access  Private (Staff only)
 */
router.get(
  "/:id", 
  authenticate, 
  requireStaff,
  requirePermission("READ_PATIENT"),
  getPatientById
);

/**
 * @route   PATCH /patients/:id
 * @desc    Update patient information
 * @access  Private (Staff only - Receptionist, Manager, Admin)
 */
router.patch(
  "/:id", 
  authenticate, 
  requireStaff,
  requirePermission("UPDATE_PATIENT"),
  updatePatient
);

export default router;