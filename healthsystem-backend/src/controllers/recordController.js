// Enhanced Medical Record Controller - Complete Implementation
// Path: src/controllers/recordController.js

import { Record, Appointment, Patient, Notification, AuditLog } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import cloudinary from "../config/cloudinary.js";

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
    labTests,
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
        severity: diagnosis.primary.severity || "MODERATE"
      },
      secondary: diagnosis.secondary || []
    },
    clinicalNotes,
    treatmentPlan,
    prescriptions: prescriptions || [],
    labTests: labTests || [],
    followUp: followUp || { required: false },
    status: "DRAFT",
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
      status: "IN_PROGRESS"
    });
  }

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

  res.status(201).json({
    message: "Medical record created successfully",
    record
  });
});

/**
 * Update medical record
 * PATCH /records/:id
 * @access Private (Doctor who created it or same department)
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
    "labTests",
    "imagingStudies",
    "procedures",
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

  // If finalized, update appointment and notify patient
  if (updates.status === "FINALIZED") {
    if (record.appointment) {
      await Appointment.findByIdAndUpdate(record.appointment, {
        status: "COMPLETED",
        consultationEndTime: new Date()
      });
    }

    // Notify patient
    await Notification.create({
      recipient: {
        userId: record.patient,
        userType: "PATIENT"
      },
      type: "RECORD_UPDATED",
      priority: "MEDIUM",
      title: "Medical Record Finalized",
      message: `Your medical record from ${new Date(record.visitDate).toLocaleDateString()} has been finalized by Dr. ${req.user.fullName}.`,
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

    // Send real-time notification
    req.io.to(record.patient.toString()).emit("record:finalized", {
      recordId: record._id,
      recordNumber: record.recordNumber,
      visitDate: record.visitDate
    });
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
 * Upload document to medical record
 * POST /records/:id/documents
 * @access Private (Doctor, Nurse)
 */
export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file provided" });
  }

  const { type, description } = req.body;

  const record = await Record.findById(req.params.id);
  if (!record) {
    return res.status(404).json({ error: "Record not found" });
  }

  // Verify staff can upload to this record
  if (record.hospital.toString() !== req.user.hospitalId.toString()) {
    return res.status(403).json({ error: "Cannot upload to record from another hospital" });
  }

  // Determine resource type based on file
  let resourceType = "application";
  if (req.file.mimetype.startsWith("image")) {
    resourceType = "image";
  } else if (req.file.mimetype === "application/pdf") {
    resourceType = "raw";
  }

  // Upload to Cloudinary
  const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
  const uploadResult = await cloudinary.uploader.upload(fileStr, {
    folder: `healthsystem/records/${record.recordNumber}`,
    resource_type: resourceType,
    format: req.file.mimetype === "application/pdf" ? "pdf" : undefined
  });

  // Add to record attachments
  const attachment = {
    name: req.file.originalname,
    type: type || "OTHER",
    url: uploadResult.secure_url,
    publicId: uploadResult.public_id,
    uploadedBy: req.user.id,
    uploadedAt: new Date(),
    description: description || ""
  };

  record.attachments.push(attachment);
  await record.save();

  await record.populate("attachments.uploadedBy", "fullName role");

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
      action: "document_upload",
      recordNumber: record.recordNumber,
      documentType: type,
      fileName: req.file.originalname
    },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: req.user.hospitalId,
    status: "SUCCESS"
  });

  // Notify patient
  await Notification.create({
    recipient: {
      userId: record.patient,
      userType: "PATIENT"
    },
    type: "RECORD_UPDATED",
    priority: "MEDIUM",
    title: "New Document Added",
    message: `A new ${type || 'document'} has been added to your medical record.`,
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

  res.status(201).json({
    message: "Document uploaded successfully",
    attachment: record.attachments[record.attachments.length - 1]
  });
});

/**
 * Delete document from medical record
 * DELETE /records/:id/documents/:attachmentId
 * @access Private (Doctor who created record)
 */
export const deleteDocument = asyncHandler(async (req, res) => {
  const { id, attachmentId } = req.params;

  const record = await Record.findById(id);
  if (!record) {
    return res.status(404).json({ error: "Record not found" });
  }

  const attachment = record.attachments.id(attachmentId);
  if (!attachment) {
    return res.status(404).json({ error: "Document not found" });
  }

  // Only creator or admin can delete
  if (record.createdBy.toString() !== req.user.id && req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Only record creator or admin can delete documents" });
  }

  // Delete from Cloudinary
  if (attachment.publicId) {
    await cloudinary.uploader.destroy(attachment.publicId);
  }

  // Remove from record
  attachment.remove();
  await record.save();

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "DELETE",
    resource: "RECORD",
    resourceId: record._id,
    details: {
      action: "document_delete",
      recordNumber: record.recordNumber,
      fileName: attachment.name
    },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: req.user.hospitalId,
    status: "SUCCESS"
  });

  res.json({ message: "Document deleted successfully" });
});

/**
 * Get treatment history timeline for patient
 * GET /records/patient/:patientId/timeline
 * @access Private (Staff & Patient - own records)
 */
export const getTreatmentTimeline = asyncHandler(async (req, res) => {
  const { patientId } = req.params;
  const { startDate, endDate, department, diagnosis } = req.query;

  // Patients can only view their own timeline
  if (req.user.userType === "PATIENT" && req.user.id !== patientId) {
    return res.status(403).json({ error: "Access denied" });
  }

  const query = { patient: patientId, status: "FINALIZED" };

  // Date range filter
  if (startDate || endDate) {
    query.visitDate = {};
    if (startDate) query.visitDate.$gte = new Date(startDate);
    if (endDate) query.visitDate.$lte = new Date(endDate);
  }

  // Department filter
  if (department) query.department = department;

  // Diagnosis filter
  if (diagnosis) {
    query["diagnosis.primary.condition"] = { $regex: diagnosis, $options: "i" };
  }

  const records = await Record.find(query)
    .populate("attendingDoctor", "fullName specialization")
    .populate("hospital", "name")
    .populate("department", "name")
    .select("recordNumber visitDate diagnosis prescriptions labTests procedures followUp")
    .sort({ visitDate: -1 });

  // Build timeline with key events
  const timeline = records.map(record => ({
    recordId: record._id,
    recordNumber: record.recordNumber,
    date: record.visitDate,
    hospital: record.hospital.name,
    department: record.department.name,
    doctor: record.attendingDoctor.fullName,
    diagnosis: record.diagnosis.primary.condition,
    prescriptions: record.prescriptions.length,
    labTests: record.labTests.length,
    procedures: record.procedures.length,
    hasFollowUp: record.followUp?.required || false
  }));

  res.json({
    patient: patientId,
    totalRecords: timeline.length,
    timeline
  });
});

/**
 * Add prescription to record
 * POST /records/:id/prescriptions
 * @access Private (Doctor only)
 */
export const addPrescription = asyncHandler(async (req, res) => {
  const { medicationName, dosage, frequency, duration, instructions, startDate } = req.body;

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
  const prescription = {
    medicationName,
    dosage,
    frequency,
    duration,
    instructions,
    startDate: startDate || new Date(),
    isActive: true
  };

  record.prescriptions.push(prescription);
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

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "CREATE",
    resource: "PRESCRIPTION",
    resourceId: record._id,
    details: {
      recordNumber: record.recordNumber,
      medication: medicationName
    },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: req.user.hospitalId,
    status: "SUCCESS"
  });

  res.json({
    message: "Prescription added successfully",
    prescription: record.prescriptions[record.prescriptions.length - 1]
  });
});

/**
 * Update prescription status
 * PATCH /records/:id/prescriptions/:prescriptionId
 * @access Private (Doctor)
 */
export const updatePrescription = asyncHandler(async (req, res) => {
  const { id, prescriptionId } = req.params;
  const { isActive, endDate } = req.body;

  const record = await Record.findById(id);
  if (!record) {
    return res.status(404).json({ error: "Record not found" });
  }

  const prescription = record.prescriptions.id(prescriptionId);
  if (!prescription) {
    return res.status(404).json({ error: "Prescription not found" });
  }

  if (isActive !== undefined) prescription.isActive = isActive;
  if (endDate) prescription.endDate = new Date(endDate);

  await record.save();

  res.json({
    message: "Prescription updated successfully",
    prescription
  });
});

/**
 * Get active prescriptions for patient
 * GET /records/patient/:patientId/prescriptions/active
 * @access Private (Staff & Patient - own records)
 */
export const getActivePrescriptions = asyncHandler(async (req, res) => {
  const { patientId } = req.params;

  // Patients can only view their own prescriptions
  if (req.user.userType === "PATIENT" && req.user.id !== patientId) {
    return res.status(403).json({ error: "Access denied" });
  }

  const records = await Record.find({ 
    patient: patientId,
    "prescriptions.isActive": true 
  })
  .populate("attendingDoctor", "fullName specialization")
  .populate("hospital", "name")
  .select("recordNumber visitDate prescriptions");

  // Extract active prescriptions
  const activePrescriptions = [];
  records.forEach(record => {
    record.prescriptions.forEach(prescription => {
      if (prescription.isActive) {
        activePrescriptions.push({
          recordNumber: record.recordNumber,
          visitDate: record.visitDate,
          doctor: record.attendingDoctor.fullName,
          hospital: record.hospital.name,
          ...prescription.toObject()
        });
      }
    });
  });

  res.json({
    patient: patientId,
    totalActive: activePrescriptions.length,
    prescriptions: activePrescriptions
  });
});

/**
 * Add lab test to record
 * POST /records/:id/lab-tests
 * @access Private (Doctor, Lab Technician)
 */
export const addLabTest = asyncHandler(async (req, res) => {
  const { testName, orderedDate, instructions } = req.body;

  if (!testName) {
    return res.status(400).json({ error: "Test name is required" });
  }

  const record = await Record.findById(req.params.id);
  if (!record) {
    return res.status(404).json({ error: "Record not found" });
  }

  const labTest = {
    testName,
    orderedDate: orderedDate || new Date(),
    status: "ORDERED"
  };

  record.labTests.push(labTest);
  await record.save();

  // Notify patient
  await Notification.create({
    recipient: {
      userId: record.patient,
      userType: "PATIENT"
    },
    type: "LAB_RESULT_READY",
    priority: "MEDIUM",
    title: "Lab Test Ordered",
    message: `A lab test (${testName}) has been ordered for you.`,
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

  res.status(201).json({
    message: "Lab test added successfully",
    labTest: record.labTests[record.labTests.length - 1]
  });
});

/**
 * Update lab test result
 * PATCH /records/:id/lab-tests/:testId
 * @access Private (Lab Technician, Doctor)
 */
export const updateLabTest = asyncHandler(async (req, res) => {
  const { id, testId } = req.params;
  const { result, resultDate, normalRange, status, attachmentUrl } = req.body;

  const record = await Record.findById(id);
  if (!record) {
    return res.status(404).json({ error: "Record not found" });
  }

  const labTest = record.labTests.id(testId);
  if (!labTest) {
    return res.status(404).json({ error: "Lab test not found" });
  }

  if (result) labTest.result = result;
  if (resultDate) labTest.resultDate = new Date(resultDate);
  if (normalRange) labTest.normalRange = normalRange;
  if (status) labTest.status = status;
  if (attachmentUrl) labTest.attachmentUrl = attachmentUrl;

  await record.save();

  // Notify patient if result is ready
  if (status === "COMPLETED") {
    await Notification.create({
      recipient: {
        userId: record.patient,
        userType: "PATIENT"
      },
      type: "LAB_RESULT_READY",
      priority: "HIGH",
      title: "Lab Results Ready",
      message: `Your ${labTest.testName} results are now available.`,
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
  }

  res.json({
    message: "Lab test updated successfully",
    labTest
  });
});

/**
 * Get doctor's active patients
 * GET /records/doctor/active-patients
 * @access Private (Doctor only)
 */
export const getDoctorActivePatients = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get today's appointments for this doctor
  const appointments = await Appointment.find({
    doctor: req.user.id,
    date: { $gte: today, $lt: tomorrow },
    status: { $in: ["BOOKED", "CONFIRMED", "CHECKED_IN", "IN_PROGRESS"] }
  })
  .populate("patient", "fullName healthCardId age gender bloodGroup phone")
  .populate("department", "name")
  .sort({ date: 1 });

  // Get records that need finalization
  const pendingRecords = await Record.find({
    attendingDoctor: req.user.id,
    status: "DRAFT",
    visitDate: { $gte: today, $lt: tomorrow }
  })
  .populate("patient", "fullName healthCardId")
  .select("recordNumber patient chiefComplaint visitDate");

  res.json({
    date: today,
    appointments: appointments.length,
    pendingRecords: pendingRecords.length,
    patients: appointments,
    recordsToFinalize: pendingRecords
  });
});

/**
 * Search medical records
 * GET /records/search
 * @access Private (Staff)
 */
export const searchRecords = asyncHandler(async (req, res) => {
  const { 
    q, 
    patientName, 
    diagnosis, 
    startDate, 
    endDate,
    department,
    doctor,
    page = 1,
    limit = 20
  } = req.query;

  const query = { hospital: req.user.hospitalId };

  if (q) {
    query.$or = [
      { recordNumber: { $regex: q, $options: "i" } },
      { chiefComplaint: { $regex: q, $options: "i" } },
      { "diagnosis.primary.condition": { $regex: q, $options: "i" } }
    ];
  }

  if (diagnosis) {
    query["diagnosis.primary.condition"] = { $regex: diagnosis, $options: "i" };
  }

  if (startDate || endDate) {
    query.visitDate = {};
    if (startDate) query.visitDate.$gte = new Date(startDate);
    if (endDate) query.visitDate.$lte = new Date(endDate);
  }

  if (department) query.department = department;
  if (doctor) query.attendingDoctor = doctor;

  const skip = (page - 1) * limit;

  const [records, total] = await Promise.all([
    Record.find(query)
      .populate("patient", "fullName healthCardId")
      .populate("attendingDoctor", "fullName specialization")
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

export { getPatientRecords as listRecords };