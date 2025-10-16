// Staff management controller
// Path: src/controllers/staffController.js

import { Staff, AuditLog } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const upload = multer({ storage: multer.memoryStorage() });
export const avatarUploadMiddleware = upload.single("file");

/**
 * Get own profile (for staff)
 * GET /staff/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const me = await Staff.findById(req.user.id)
    .select("-passwordHash")
    .populate("hospital department");
  
  if (!me) {
    return res.status(404).json({ error: "Staff not found" });
  }

  res.json(me);
});

/**
 * Update own profile (for staff)
 * PATCH /staff/me
 */
export const updateMe = asyncHandler(async (req, res) => {
  const updatable = [
    "fullName",
    "phone",
    "address",
    "qualifications",
    "experience",
    "languages",
    "emergencyContact",
    "workingHours",
    "consultationFee",
    "maxPatientsPerDay"
  ];

  const patch = {};
  updatable.forEach((key) => {
    if (req.body[key] !== undefined) {
      patch[key] = req.body[key];
    }
  });

  const updated = await Staff.findByIdAndUpdate(req.user.id, patch, { 
    new: true,
    runValidators: true 
  })
  .select("-passwordHash")
  .populate("hospital department");

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: updated.fullName,
      userEmail: updated.email
    },
    action: "UPDATE",
    resource: "STAFF",
    resourceId: req.user.id,
    details: { fields: Object.keys(patch) },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: req.user.hospitalId,
    status: "SUCCESS"
  });

  res.json(updated);
});

/**
 * Upload avatar (for staff)
 * POST /staff/me/avatar
 */
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  // Convert buffer to base64
  const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  
  // Upload to Cloudinary
  const uploadResult = await cloudinary.uploader.upload(fileStr, {
    folder: "healthsystem/avatars/staff",
    public_id: `staff_${req.user.id}`,
    overwrite: true,
    transformation: [
      { width: 400, height: 400, crop: "fill" },
      { quality: "auto" }
    ]
  });

  // Update staff
  const updated = await Staff.findByIdAndUpdate(
    req.user.id,
    { avatarUrl: uploadResult.secure_url },
    { new: true }
  )
  .select("-passwordHash")
  .populate("hospital department");

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: updated.fullName,
      userEmail: updated.email
    },
    action: "UPDATE",
    resource: "STAFF",
    resourceId: req.user.id,
    details: { action: "avatar_upload" },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: req.user.hospitalId,
    status: "SUCCESS"
  });

  res.json(updated);
});

/**
 * Get staff by ID (manager/admin only)
 * GET /staff/:id
 */
export const getStaffById = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id)
    .select("-passwordHash")
    .populate("hospital department");

  if (!staff) {
    return res.status(404).json({ error: "Staff not found" });
  }

  res.json(staff);
});

/**
 * List staff members (manager/admin only)
 * GET /staff?hospital=xxx&department=xxx&role=DOCTOR&page=1&limit=20
 */
export const listStaff = asyncHandler(async (req, res) => {
  const { hospital, department, role, specialization, isActive, page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  
  // If user is staff, filter by their hospital
  if (req.user.userType === "STAFF" && req.user.hospitalId) {
    query.hospital = req.user.hospitalId;
  } else if (hospital) {
    query.hospital = hospital;
  }
  
  if (department) query.department = department;
  if (role) query.role = role;
  if (specialization) query.specialization = specialization;
  if (isActive !== undefined) query.isActive = isActive === "true";

  const [staffList, total] = await Promise.all([
    Staff.find(query)
      .select("-passwordHash")
      .populate("hospital department")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ fullName: 1 }),
    Staff.countDocuments(query)
  ]);

  res.json({
    staff: staffList,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  });
});

/**
 * Search staff (manager/admin only)
 * GET /staff/search?q=search_term
 */
export const searchStaff = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: "Search query must be at least 2 characters" });
  }

  const skip = (page - 1) * limit;

  const searchQuery = {
    $or: [
      { fullName: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { staffId: { $regex: q, $options: "i" } },
      { licenseNumber: { $regex: q, $options: "i" } }
    ],
    isActive: true
  };

  // If user is staff, filter by their hospital
  if (req.user.userType === "STAFF" && req.user.hospitalId) {
    searchQuery.hospital = req.user.hospitalId;
  }

  const [staffList, total] = await Promise.all([
    Staff.find(searchQuery)
      .select("fullName staffId role specialization phone avatarUrl hospital department")
      .populate("hospital department")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ fullName: 1 }),
    Staff.countDocuments(searchQuery)
  ]);

  res.json({
    staff: staffList,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  });
});

/**
 * Update staff member (manager/admin only)
 * PATCH /staff/:id
 */
export const updateStaff = asyncHandler(async (req, res) => {
  const updatable = [
    "fullName",
    "phone",
    "address",
    "specialization",
    "department",
    "shift",
    "workingHours",
    "consultationFee",
    "maxPatientsPerDay",
    "qualifications",
    "experience",
    "languages",
    "isActive",
    "notes"
  ];

  const patch = {};
  updatable.forEach((key) => {
    if (req.body[key] !== undefined) {
      patch[key] = req.body[key];
    }
  });

  const updated = await Staff.findByIdAndUpdate(req.params.id, patch, {
    new: true,
    runValidators: true
  })
  .select("-passwordHash")
  .populate("hospital department");

  if (!updated) {
    return res.status(404).json({ error: "Staff not found" });
  }

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "UPDATE",
    resource: "STAFF",
    resourceId: req.params.id,
    details: { fields: Object.keys(patch), targetStaff: updated.fullName },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: req.user.hospitalId,
    status: "SUCCESS"
  });

  res.json(updated);
});

/**
 * Deactivate staff member (admin only)
 * DELETE /staff/:id
 */
export const deactivateStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  ).select("-passwordHash");

  if (!staff) {
    return res.status(404).json({ error: "Staff not found" });
  }

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "DELETE",
    resource: "STAFF",
    resourceId: req.params.id,
    details: { action: "deactivate", targetStaff: staff.fullName },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: req.user.hospitalId,
    status: "SUCCESS"
  });

  res.json({ message: "Staff deactivated successfully", staff });
});

/**
 * Get available doctors for appointment booking
 * GET /staff/doctors/available?hospital=xxx&department=xxx&date=2025-10-20
 */
export const getAvailableDoctors = asyncHandler(async (req, res) => {
  const { hospital, department, date, specialization } = req.query;

  if (!hospital || !department) {
    return res.status(400).json({ error: "Hospital and department are required" });
  }

  const query = {
    hospital,
    department,
    role: "DOCTOR",
    isActive: true
  };

  if (specialization) {
    query.specialization = specialization;
  }

  // TODO: Check doctor's schedule and existing appointments for the date
  // For now, just return all doctors in the department

  const doctors = await Staff.find(query)
    .select("fullName specialization consultationFee maxPatientsPerDay workingHours avatarUrl")
    .populate("department", "name category");

  res.json(doctors);
});