// Enhanced Medical Record Controller
// Path: src/controllers/recordController.js

import { Record, Appointment, Patient, Notification, AuditLog } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * Generate unique record number
 */
function generateRecordNumber() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 99999).toString().padStart(5, '0');
  return `MR-${year}${month}${day}-${random}`;
}

/**
 * Create new medical record
 * POST /records
 * @access Private (Doctor, Nurse)
 */
export const createRecord = asyncHandler(async (req, res) => {
  const {
    patientId,
    appointmentId,
    chiefComplaint,
    symptoms,
    vitalSigns,
    diagnosis,
    clinicalNotes,
    treatmentPlan,
    prescriptions,
    followUp
  } = req.body;

  // Validation
  if (!patientId || !chiefComplaint || !diagnosis?.primary?.condition) {
    return res.status(400).json({ 
      error: "Patient ID, chief complaint, and primary diagnosis are required" 
    });
  }

  // Verify patient exists
  const patient = await Patient.findById(patientId);
  if (!patient) {
    return res.status(404).json({ error: "Patient not found" });
  }

  // Verify appointment if provided
  let appointment = null;
  if (appointmentId) {
    appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    
    // Verify appointment belongs to the patient
    if (appointment.patient.toString() !== patientId) {
      return res.status(400).json({ error: "Appointment does not belong to patient" });
    }
  }

  // Create record
  const record = await Record.create({
    recordNumber: generateRecordNumber(),
    patient: patientId,
    appointment: appointmentId,
    hospital: req.user.hospitalId,
    department: req.user.departmentId,
    attendingDoctor: req.user.id,
    visitDate: new Date(),
    visitType: appointmentId ? "OUTPATIENT" : "WALK_IN",
    chiefComplaint,
    symptoms: symptoms || [],
    vitalSigns: vitalSigns || {},
    diagnosis: {
      primary: {
        condition: diagnosis.primary.condition,
        icdCode: diagnosis.primary.icdCode,
        severity: diagnosis.primary.severity
      },
      secondary: diagnosis.secondary || []
    },
    clinicalNotes,
    treatmentPlan,
    prescriptions: prescriptions || [],
    followUp: followUp || { required: false },
    status: "FINALIZED",
    createdBy: req.user.id
  });

  await record.populate([
    { path: "patient", select: "fullName healthCardId phone" },
    { path: "attendingDoctor", select: "fullName specialization" },
    { path: "hospital", select: "name hospitalId" },
    { path: "department", select: "name" }
  ]);

  // Update appointment status if linked
  if (appointmentId) {
    await Appointment.findByIdAndUpdate(appointmentId, {
      status: "COMPLETED",
      consultationEndTime: new Date()
    });
  }

  // Update patient last visit
  await Patient.findByIdAndUpdate(patientId, {
    lastVisit: {
      date: new Date(),
      hospital: req.user.hospitalId,
      department: req.user.departmentId
    }
  });

  // Create notification for patient
  await Notification.create({
    recipient: {
      userId: patientId,
      userType: "PATIENT"
    },
    type: "RECORD_UPDATED",
    priority: "MEDIUM",
    title: "Medical Record Created",
    message: `Your medical record from ${new Date().toLocaleDateString()} has been created by Dr. ${req.user.fullName}.`,
    relatedResource: {
      resourceType: "RECORD",
      resourceId: record._id
    },
    channels: {
      inApp: { sent: true, sentAt: new Date() }
    },
    sentBy: {
      userId: req.user.id,
      userType: "STAFF",
      system: false
    }
  });

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "CREATE",
    resource: "RECORD",
    resourceId: record._id,
    details: {
      recordNumber: record.recordNumber,
      patientName: patient.fullName,
      diagnosis: diagnosis.primary.condition
    },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: req.user.hospitalId,
    status: "SUCCESS"
  });

  // Send real-time notification
  req.io.to(patientId.toString()).emit("record:created", {
    recordId: record._id,
    recordNumber: record.recordNumber,
    visitDate: record.visitDate
  });

  res.status(201).json({
    message: "Medical record created successfully",
    record
  });
});

/**
 * Update medical record
 * PATCH /records/:id
 * @access Private (Doctor who created it)
 */
export const updateRecord = asyncHandler(async (req, res) => {
  const record = await Record.findById(req.params.id);

  if (!record) {
    return res.status(404).json({ error: "Record not found" });
  }

  // Only creator or same hospital staff can update
  if (record.hospital.toString() !== req.user.hospitalId.toString()) {
    return res.status(403).json({ error: "Cannot update record from another hospital" });
  }

  // Only doctor can finalize records
  if (req.body.status === "FINALIZED" && req.user.role !== "DOCTOR") {
    return res.status(403).json({ error: "Only doctors can finalize records" });
  }

  const updatable = [
    "chiefComplaint",
    "symptoms",
    "vitalSigns",
    "diagnosis",
    "clinicalNotes",
    "treatmentPlan",
    "prescriptions",
    "followUp",
    "status"
  ];

  const updates = {};
  updatable.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });

  updates.lastModifiedBy = req.user.id;

  const updatedRecord = await Record.findByIdAndUpdate(
    req.params.id,
    updates,
    { new: true, runValidators: true }
  ).populate([
    { path: "patient", select: "fullName healthCardId" },
    { path: "attendingDoctor", select: "fullName specialization" },
    { path: "hospital", select: "name" },
    { path: "department", select: "name" }
  ]);

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "UPDATE",
    resource: "RECORD",
    resourceId: record._id,
    details: {
      recordNumber: record.recordNumber,
      updatedFields: Object.keys(updates)
    },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: req.user.hospitalId,
    status: "SUCCESS"
  });

  res.json({
    message: "Record updated successfully",
    record: updatedRecord
  });
});

/**
 * Get records for a patient
 * GET /records/patient/:patientId
 * @access Private (Staff & Patient - own records)
 */
export const getPatientRecords = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  // Patients can only view their own records
  if (req.user.userType === "PATIENT" && req.user.id !== patientId) {
    return res.status(403).json({ error: "Access denied" });
  }

  const records = await Record.find({ patient: patientId })
    .populate("attendingDoctor", "fullName specialization")
    .populate("hospital", "name hospitalId")
    .populate("department", "name")
    .sort({ visitDate: -1 });

  // Log access for audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: req.user.userType,
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "READ",
    resource: "RECORD",
    resourceId: null,
    details: {
      action: "view_patient_records",
      patientId,
      recordCount: records.length
    },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: req.user.hospitalId,
    status: "SUCCESS"
  });

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

/**
 * Add prescription to record
 * POST /records/:id/prescription
 * @access Private (Doctor only)
 */
export const addPrescription = asyncHandler(async (req, res) => {
  const { medicationName, dosage, frequency, duration, instructions } = req.body;

  if (!medicationName || !dosage || !frequency) {
    return res.status(400).json({ 
      error: "Medication name, dosage, and frequency are required" 
    });
  }

  const record = await Record.findById(req.params.id);

  if (!record) {
    return res.status(404).json({ error: "Record not found" });
  }

  // Only doctor can add prescriptions
  if (req.user.role !== "DOCTOR") {
    return res.status(403).json({ error: "Only doctors can prescribe medications" });
  }

  // Add prescription
  record.prescriptions.push({
    medicationName,
    dosage,
    frequency,
    duration,
    instructions,
    startDate: new Date(),
    isActive: true
  });

  await record.save();

  // Notify patient
  await Notification.create({
    recipient: {
      userId: record.patient,
      userType: "PATIENT"
    },
    type: "PRESCRIPTION_READY",
    priority: "HIGH",
    title: "New Prescription",
    message: `Dr. ${req.user.fullName} has prescribed ${medicationName} for you.`,
    relatedResource: {
      resourceType: "RECORD",
      resourceId: record._id
    },
    channels: {
      inApp: { sent: true, sentAt: new Date() }
    },
    sentBy: {
      userId: req.user.id,
      userType: "STAFF"
    }
  });

  res.json({
    message: "Prescription added successfully",
    prescription: record.prescriptions[record.prescriptions.length - 1]
  });
});

/**
 * Get records by hospital/department
 * GET /records?hospital=xxx&department=xxx&date=2025-10-20
 * @access Private (Staff only)
 */
export const listRecords = asyncHandler(async (req, res) => {
  const { hospital, department, date, status, page = 1, limit = 20 } = req.query;

  const query = {};
  
  // Staff can only see records from their hospital
  if (req.user.userType === "STAFF") {
    query.hospital = req.user.hospitalId;
  } else if (hospital) {
    query.hospital = hospital;
  }

  if (department) query.department = department;
  if (status) query.status = status;
  
  if (date) {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);
    query.visitDate = { $gte: startDate, $lte: endDate };
  }

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    Record.find(query)
      .populate("patient", "fullName healthCardId")
      .populate("attendingDoctor", "fullName")
      .populate("department", "name")
      .select("recordNumber visitDate diagnosis status")
      .sort({ visitDate: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Record.countDocuments(query)
  ]);

  res.json({
    records,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  });
});

// For backward compatibility with patient app
export { getPatientRecords as listRecords };