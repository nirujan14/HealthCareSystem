// Updated patient controller with multi-role support
// Path: src/controllers/patientController.js

import { Patient, AuditLog } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";

const upload = multer({ storage: multer.memoryStorage() });
export const avatarUploadMiddleware = upload.single("file");

/**
 * Get own profile (for patients)
 * GET /patients/me
 */
export const getMe = asyncHandler(async (req, res) => {
  const me = await Patient.findById(req.user.id)
    .select("-passwordHash")
    .populate("preferredHospital lastVisit.hospital lastVisit.department");
  
  if (!me) {
    return res.status(404).json({ error: "Patient not found" });
  }

  res.json(me);
});

/**
 * Update own profile (for patients)
 * PATCH /patients/me
 */
export const updateMe = asyncHandler(async (req, res) => {
  const updatable = [
    "fullName",
    "phone",
    "alternatePhone",
    "address",
    "bloodGroup",
    "allergies",
    "chronicConditions",
    "currentMedications",
    "emergencyContact",
    "insuranceInfo",
    "preferredLanguage",
    "occupation",
    "maritalStatus",
    "preferredHospital"
  ];

  const patch = {};
  updatable.forEach((key) => {
    if (req.body[key] !== undefined) {
      patch[key] = req.body[key];
    }
  });

  const updated = await Patient.findByIdAndUpdate(req.user.id, patch, { 
    new: true,
    runValidators: true 
  }).select("-passwordHash");

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "PATIENT",
      userName: updated.fullName,
      userEmail: updated.email
    },
    action: "UPDATE",
    resource: "PATIENT",
    resourceId: req.user.id,
    details: { fields: Object.keys(patch) },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    status: "SUCCESS"
  });

  res.json(updated);
});

/**
 * Upload avatar (for patients)
 * POST /patients/me/avatar
 */
export const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  // Convert buffer to base64
  const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  
  // Upload to Cloudinary
  const uploadResult = await cloudinary.uploader.upload(fileStr, {
    folder: "healthsystem/avatars/patients",
    public_id: `patient_${req.user.id}`,
    overwrite: true,
    transformation: [
      { width: 400, height: 400, crop: "fill" },
      { quality: "auto" }
    ]
  });

  // Update patient
  const updated = await Patient.findByIdAndUpdate(
    req.user.id,
    { avatarUrl: uploadResult.secure_url },
    { new: true }
  ).select("-passwordHash");

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "PATIENT",
      userName: updated.fullName,
      userEmail: updated.email
    },
    action: "UPDATE",
    resource: "PATIENT",
    resourceId: req.user.id,
    details: { action: "avatar_upload" },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    status: "SUCCESS"
  });

  res.json(updated);
});

/**
 * Get patient by ID (staff only)
 * GET /patients/:id
 */
export const getPatientById = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id)
    .select("-passwordHash")
    .populate("preferredHospital lastVisit.hospital lastVisit.department");

  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  // Log access
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "READ",
    resource: "PATIENT",
    resourceId: req.params.id,
    details: { staffRole: req.user.role },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: req.user.hospitalId,
    status: "SUCCESS"
  });

  res.json(patient);
});

/**
 * Search patients (staff only)
 * GET /patients/search?q=search_term
 */
export const searchPatients = asyncHandler(async (req, res) => {
  const { q, page = 1, limit = 20 } = req.query;

  if (!q || q.trim().length < 2) {
    return res.status(400).json({ error: "Search query must be at least 2 characters" });
  }

  const skip = (page - 1) * limit;

  // Search by name, email, phone, NIC, or health card ID
  const searchQuery = {
    $or: [
      { fullName: { $regex: q, $options: "i" } },
      { email: { $regex: q, $options: "i" } },
      { phone: { $regex: q, $options: "i" } },
      { nic: { $regex: q, $options: "i" } },
      { healthCardId: { $regex: q, $options: "i" } }
    ],
    isActive: true
  };

  const [patients, total] = await Promise.all([
    Patient.find(searchQuery)
      .select("fullName email phone healthCardId nic avatarUrl dateOfBirth gender")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ fullName: 1 }),
    Patient.countDocuments(searchQuery)
  ]);

  res.json({
    patients,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  });
});

/**
 * Update patient (staff only)
 * PATCH /patients/:id
 */
export const updatePatient = asyncHandler(async (req, res) => {
  const updatable = [
    "fullName",
    "phone",
    "alternatePhone",
    "address",
    "bloodGroup",
    "allergies",
    "chronicConditions",
    "currentMedications",
    "emergencyContact",
    "insuranceInfo",
    "notes",
    "isActive",
    "accountStatus"
  ];

  const patch = {};
  updatable.forEach((key) => {
    if (req.body[key] !== undefined) {
      patch[key] = req.body[key];
    }
  });

  const updated = await Patient.findByIdAndUpdate(req.params.id, patch, {
    new: true,
    runValidators: true
  }).select("-passwordHash");

  if (!updated) {
    return res.status(404).json({ error: "Patient not found" });
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
    resource: "PATIENT",
    resourceId: req.params.id,
    details: { fields: Object.keys(patch), staffRole: req.user.role },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: req.user.hospitalId,
    status: "SUCCESS"
  });

  res.json(updated);
});

/**
 * List all patients (staff only, paginated)
 * GET /patients?page=1&limit=20&status=ACTIVE
 */
export const listPatients = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, hospital } = req.query;
  const skip = (page - 1) * limit;

  const query = {};
  if (status) query.accountStatus = status;
  if (hospital) query.preferredHospital = hospital;

  const [patients, total] = await Promise.all([
    Patient.find(query)
      .select("fullName email phone healthCardId avatarUrl accountStatus registrationDate")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ registrationDate: -1 }),
    Patient.countDocuments(query)
  ]);

  res.json({
    patients,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  });
});