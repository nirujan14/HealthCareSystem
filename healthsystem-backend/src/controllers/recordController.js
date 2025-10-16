// Fixed Medical Record Controller
// Path: src/controllers/recordController.js

import { Record, Appointment, Patient, Notification, AuditLog } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * Get records - works for both patients (own records) and staff
 * GET /records
 * @access Private (Both Patient and Staff)
 */
export const listRecords = asyncHandler(async (req, res) => {
  let query = {};

  // If patient, only show their own records
  if (req.user.userType === "PATIENT") {
    query.patient = req.user.id;
  } 
  // If staff, show records from their hospital
  else if (req.user.hospitalId) {
    query.hospital = req.user.hospitalId;
  }

  const records = await Record.find(query)
    .populate("patient", "fullName healthCardId")
    .populate("attendingDoctor", "fullName specialization")
    .populate("hospital", "name hospitalId")
    .populate("department", "name")
    .sort({ visitDate: -1 })
    .limit(100);

  res.json(records);
});

/**
 * Get records for a patient
 * GET /records/patient/:patientId
 * @access Private (Staff & Patient - own records)
 */
export const getPatientRecords = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  // Patients can only view their own records - FIXED COMPARISON
  if (req.user.userType === "PATIENT" && req.user.id !== patientId) {
    return res.status(403).json({ error: "Access denied" });
  }

  const records = await Record.find({ patient: patientId })
    .populate("attendingDoctor", "fullName specialization")
    .populate("hospital", "name hospitalId")
    .populate("department", "name")
    .sort({ visitDate: -1 });

  res.json(records);
});

/**
 * Get single record by ID
 * GET /records/:id
 * @access Private (Staff & Patient - own records)
 */
export const getRecordById = asyncHandler(async (req, res) => {
  const record = await Record.findById(req.params.id)
    .populate("patient", "fullName healthCardId age gender bloodGroup")
    .populate("attendingDoctor", "fullName specialization licenseNumber")
    .populate("hospital", "name hospitalId contact")
    .populate("department", "name")
    .populate("appointment", "date status");

  if (!record) {
    return res.status(404).json({ error: "Record not found" });
  }

  // Patients can only view their own records
  if (req.user.userType === "PATIENT" && record.patient._id.toString() !== req.user.id) {
    return res.status(403).json({ error: "Access denied" });
  }

  // Log access
  record.accessLog.push({
    accessedBy: req.user.id,
    accessedAt: new Date(),
    action: "VIEW",
    ipAddress: req.ip
  });
  await record.save();

  res.json(record);
});