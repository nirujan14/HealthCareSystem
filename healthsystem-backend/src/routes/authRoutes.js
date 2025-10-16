// Unified authentication routes
// Path: src/routes/authRoutes.js

import { Router } from "express";
import { 
  login, 
  registerPatient,
  registerStaff,
  refreshToken,
  changePassword,
  forgotPassword,
  logout,
  getCurrentUser
} from "../controllers/authController.js";
import { authenticate, requireRole } from "../middleware/auth.js";

const router = Router();

// ============ PUBLIC ROUTES ============

/**
 * @route   POST /auth/login
 * @desc    Login for both patients and staff
 * @access  Public
 * @body    { email, password, userType: "PATIENT" | "STAFF" }
 */
router.post("/login", login);

/**
 * @route   POST /auth/register/patient
 * @desc    Register new patient (self-registration or by staff)
 * @access  Public (can be restricted in production)
 * @body    { email, password, fullName, phone, nic, dateOfBirth, gender, address, emergencyContact }
 */
router.post("/register/patient", registerPatient);

/**
 * @route   POST /auth/refresh
 * @desc    Refresh JWT token
 * @access  Public
 * @body    { token }
 */
router.post("/refresh", refreshToken);

/**
 * @route   POST /auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 * @body    { email, userType }
 */
router.post("/forgot-password", forgotPassword);

// ============ PROTECTED ROUTES ============

/**
 * @route   GET /auth/me
 * @desc    Get current user profile
 * @access  Private (Both Patient and Staff)
 */
router.get("/me", authenticate, getCurrentUser);

/**
 * @route   POST /auth/change-password
 * @desc    Change password
 * @access  Private (Both Patient and Staff)
 * @body    { currentPassword, newPassword }
 */
router.post("/change-password", authenticate, changePassword);

/**
 * @route   POST /auth/logout
 * @desc    Logout (audit logging)
 * @access  Private (Both Patient and Staff)
 */
router.post("/logout", authenticate, logout);

// ============ ADMIN ONLY ROUTES ============

/**
 * @route   POST /auth/register/staff
 * @desc    Register new staff member (admin/manager only)
 * @access  Private (Admin/Manager only)
 * @body    { email, password, fullName, staffId, role, specialization, hospital, department, phone, nic, licenseNumber }
 */
router.post(
  "/register/staff", 
  authenticate, 
  requireRole(["ADMIN", "MANAGER"]),
  registerStaff
);

export default router;