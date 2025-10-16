// Unified authentication controller for Patient and Staff
// Path: src/controllers/authController.js

import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Patient, Staff, AuditLog } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * Unified login for both patients and staff
 * POST /auth/login
 * Body: { email, password, userType: "PATIENT" | "STAFF" }
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password, userType = "PATIENT" } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  if (!["PATIENT", "STAFF"].includes(userType)) {
    return res.status(400).json({ error: "Invalid user type" });
  }

  let user, role;

  // Find user based on type without triggering full validation
  if (userType === "PATIENT") {
    user = await Patient.findOne({ email: email.toLowerCase() }).select("+passwordHash");
    if (!user || !user.isActive) {
      await logAuditAction(null, "LOGIN", "PATIENT", email, "FAILED", req);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    role = "PATIENT";
  } else {
    user = await Staff.findOne({ email: email.toLowerCase() })
      .select("+passwordHash")
      .populate("hospital department");
    if (!user || !user.isActive) {
      await logAuditAction(null, "LOGIN", "STAFF", email, "FAILED", req);
      return res.status(401).json({ error: "Invalid credentials" });
    }
    role = user.role;
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
  if (!isPasswordValid) {
    await logAuditAction(user._id, "LOGIN", userType, email, "FAILED", req);
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Generate JWT token without modifying the user document
  const token = jwt.sign(
    { 
      id: user._id,
      userType,
      role,
      email: user.email
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  // Log successful login without saving
  await logAuditAction(user._id, "LOGIN", userType, null, "SUCCESS", req);

  // Prepare response
  const response = {
    token,
    userType,
    user: {
      id: user._id,
      email: user.email,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl
    }
  };

  if (userType === "PATIENT") {
    response.user.healthCardId = user.healthCardId;
    response.user.phone = user.phone;
  } else {
    response.user.staffId = user.staffId;
    response.user.role = user.role;
    response.user.specialization = user.specialization;
    response.user.hospital = user.hospital ? {
      id: user.hospital._id,
      name: user.hospital.name,
      type: user.hospital.type
    } : null;
    response.user.department = user.department ? {
      id: user.department._id,
      name: user.department.name,
      category: user.department.category
    } : null;
  }

  res.json(response);
});

/**
 * Patient registration (can be called by staff or self-registration if enabled)
 * POST /auth/register/patient
 */
export const registerPatient = asyncHandler(async (req, res) => {
  const { 
    email, 
    password, 
    fullName, 
    phone, 
    nic,
    dateOfBirth,
    gender,
    address,
    emergencyContact
  } = req.body;

  // Validation
  if (!email || !password || !fullName || !phone) {
    return res.status(400).json({ 
      error: "Email, password, full name, and phone are required" 
    });
  }

  // Check if email already exists
  const existingPatient = await Patient.findOne({ email: email.toLowerCase() });
  if (existingPatient) {
    return res.status(400).json({ error: "Email already registered" });
  }

  // Check if NIC already exists
  if (nic) {
    const existingNIC = await Patient.findOne({ nic });
    if (existingNIC) {
      return res.status(400).json({ error: "NIC already registered" });
    }
  }

  // Generate unique health card ID
  const healthCardId = await generateHealthCardId();

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create patient
  const patient = await Patient.create({
    email: email.toLowerCase(),
    passwordHash,
    fullName,
    phone,
    nic,
    dateOfBirth,
    gender,
    address,
    emergencyContact: emergencyContact || { name: "", phone: "" },
    healthCardId,
    accountStatus: "PENDING_VERIFICATION"
  });

  // Log audit
  await logAuditAction(patient._id, "CREATE", "PATIENT", patient._id, "SUCCESS", req);

  res.status(201).json({
    message: "Patient registered successfully",
    patient: {
      id: patient._id,
      email: patient.email,
      fullName: patient.fullName,
      healthCardId: patient.healthCardId
    }
  });
});

/**
 * Staff registration (admin only)
 * POST /auth/register/staff
 */
export const registerStaff = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    fullName,
    staffId,
    role,
    specialization,
    hospital,
    department,
    phone,
    nic,
    licenseNumber
  } = req.body;

  // Validation
  if (!email || !password || !fullName || !staffId || !role || !hospital || !department) {
    return res.status(400).json({ 
      error: "All required fields must be provided" 
    });
  }

  // Check if email already exists
  const existingStaff = await Staff.findOne({ email: email.toLowerCase() });
  if (existingStaff) {
    return res.status(400).json({ error: "Email already registered" });
  }

  // Check if staffId already exists
  const existingStaffId = await Staff.findOne({ staffId: staffId.toUpperCase() });
  if (existingStaffId) {
    return res.status(400).json({ error: "Staff ID already exists" });
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10);

  // Create staff
  const staff = await Staff.create({
    email: email.toLowerCase(),
    passwordHash,
    fullName,
    staffId: staffId.toUpperCase(),
    role,
    specialization,
    hospital,
    department,
    phone,
    nic,
    licenseNumber
  });

  // Log audit
  await logAuditAction(req.user?.id, "CREATE", "STAFF", staff._id, "SUCCESS", req);

  res.status(201).json({
    message: "Staff registered successfully",
    staff: {
      id: staff._id,
      email: staff.email,
      fullName: staff.fullName,
      staffId: staff.staffId,
      role: staff.role
    }
  });
});

/**
 * Refresh token
 * POST /auth/refresh
 */
export const refreshToken = asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: "Token required" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Generate new token
    const newToken = jwt.sign(
      { 
        id: payload.id,
        userType: payload.userType,
        role: payload.role,
        email: payload.email
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token: newToken });
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
});

/**
 * Change password
 * POST /auth/change-password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const { id, userType } = req.user;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: "Current and new passwords required" });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: "New password must be at least 6 characters" });
  }

  // Find user
  const Model = userType === "PATIENT" ? Patient : Staff;
  const user = await Model.findById(id);

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  
  if (!isPasswordValid) {
    await logAuditAction(id, "UPDATE", userType, "password_change", "FAILED", req);
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  // Hash and save new password
  user.passwordHash = await bcrypt.hash(newPassword, 10);
  await user.save();

  // Log audit
  await logAuditAction(id, "UPDATE", userType, "password_change", "SUCCESS", req);

  res.json({ message: "Password changed successfully" });
});

/**
 * Request password reset
 * POST /auth/forgot-password
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email, userType = "PATIENT" } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email required" });
  }

  const Model = userType === "PATIENT" ? Patient : Staff;
  const user = await Model.findOne({ email: email.toLowerCase() });

  if (!user) {
    // Don't reveal if email exists
    return res.json({ message: "If the email exists, a reset link will be sent" });
  }

  // TODO: Generate reset token and send email
  // For now, just log the request
  await logAuditAction(user._id, "READ", userType, "password_reset_request", "SUCCESS", req);

  res.json({ message: "If the email exists, a reset link will be sent" });
});

/**
 * Logout (mainly for audit logging)
 * POST /auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
  const { id, userType } = req.user;

  // Log audit
  await logAuditAction(id, "LOGOUT", userType, null, "SUCCESS", req);

  res.json({ message: "Logged out successfully" });
});

/**
 * Get current user profile
 * GET /auth/me
 */
export const getCurrentUser = asyncHandler(async (req, res) => {
  const { id, userType } = req.user;

  if (userType === "PATIENT") {
    const patient = await Patient.findById(id)
      .select("-passwordHash")
      .populate("preferredHospital");
    
    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    res.json({ userType: "PATIENT", user: patient });
  } else {
    const staff = await Staff.findById(id)
      .select("-passwordHash")
      .populate("hospital department");
    
    if (!staff) {
      return res.status(404).json({ error: "Staff not found" });
    }

    res.json({ userType: "STAFF", user: staff });
  }
});

// ============ HELPER FUNCTIONS ============

/**
 * Generate unique health card ID
 */
async function generateHealthCardId() {
  const year = new Date().getFullYear();
  const count = await Patient.countDocuments();
  const sequence = String(count + 1).padStart(5, "0");
  return `HC-${year}-${sequence}`;
}

/**
 * Log audit action
 */
async function logAuditAction(userId, action, resource, details, status, req) {
  try {
    await AuditLog.create({
      user: {
        userId: userId || null,
        userType: resource,
        userName: details || "Unknown",
        userEmail: req.body?.email || "Unknown"
      },
      action,
      resource,
      resourceId: userId,
      details: typeof details === "object" ? details : { info: details },
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.headers["user-agent"],
      status
    });
  } catch (error) {
    console.error("Audit log error:", error);
  }
}