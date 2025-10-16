// Check-in Management Controller
// Path: src/controllers/checkinController.js

import { Patient, Appointment, AuditLog } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * Verify QR code and get patient details
 * POST /checkin/verify
 * @access Private (Staff only)
 * @body { healthCardId, patientId }
 */
export const verifyHealthCard = asyncHandler(async (req, res) => {
  const { healthCardId, patientId } = req.body;

  if (!healthCardId || !patientId) {
    return res.status(400).json({ 
      error: "Health card ID and patient ID are required" 
    });
  }

  // Find patient
  const patient = await Patient.findOne({ 
    _id: patientId,
    healthCardId: healthCardId,
    isActive: true 
  })
  .populate("preferredHospital lastVisit.hospital")
  .select("-passwordHash");

  if (!patient) {
    // Log failed attempt
    await AuditLog.create({
      user: {
        userId: req.user.id,
        userType: "STAFF",
        userName: req.user.fullName,
        userEmail: req.user.email
      },
      action: "SCAN_QR",
      resource: "PATIENT",
      resourceId: null,
      details: { healthCardId, result: "NOT_FOUND" },
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
      hospital: req.user.hospitalId,
      status: "FAILED"
    });

    return res.status(404).json({ 
      error: "Patient not found or inactive",
      verified: false 
    });
  }

  // Get today's appointments for this patient at this hospital
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const todayAppointments = await Appointment.find({
    patient: patient._id,
    hospital: req.user.hospitalId,
    date: { $gte: today, $lt: tomorrow },
    status: { $in: ["BOOKED", "CONFIRMED"] }
  })
  .populate("department", "name code")
  .populate("doctor", "fullName specialization");

  // Log successful scan
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "SCAN_QR",
    resource: "PATIENT",
    resourceId: patient._id,
    details: { 
      healthCardId, 
      patientName: patient.fullName,
      appointmentsFound: todayAppointments.length 
    },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: req.user.hospitalId,
    status: "SUCCESS"
  });

  res.json({
    verified: true,
    patient: {
      id: patient._id,
      healthCardId: patient.healthCardId,
      fullName: patient.fullName,
      age: patient.age,
      gender: patient.gender,
      bloodGroup: patient.bloodGroup,
      phone: patient.phone,
      allergies: patient.allergies,
      chronicConditions: patient.chronicConditions,
      avatarUrl: patient.avatarUrl
    },
    todayAppointments,
    lastVisit: patient.lastVisit
  });
});

/**
 * Check-in patient for appointment
 * POST /checkin/appointment/:appointmentId
 * @access Private (Staff only)
 */
export const checkInAppointment = asyncHandler(async (req, res) => {
  const { appointmentId } = req.params;
  const { notes } = req.body;

  const appointment = await Appointment.findById(appointmentId)
    .populate("patient", "fullName healthCardId phone")
    .populate("department", "name")
    .populate("doctor", "fullName");

  if (!appointment) {
    return res.status(404).json({ error: "Appointment not found" });
  }

  // Verify appointment is at staff's hospital
  if (appointment.hospital.toString() !== req.user.hospitalId.toString()) {
    return res.status(403).json({ 
      error: "Cannot check-in appointment from different hospital" 
    });
  }

  // Verify appointment status
  if (!["BOOKED", "CONFIRMED"].includes(appointment.status)) {
    return res.status(400).json({ 
      error: `Cannot check-in appointment with status: ${appointment.status}` 
    });
  }

  // Update appointment
  appointment.status = "CHECKED_IN";
  appointment.checkInTime = new Date();
  if (notes) appointment.staffNotes = notes;
  await appointment.save();

  // Update patient last visit
  await Patient.findByIdAndUpdate(appointment.patient._id, {
    lastVisit: {
      date: new Date(),
      hospital: appointment.hospital,
      department: appointment.department
    }
  });

  // Log check-in
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "CHECK_IN",
    resource: "APPOINTMENT",
    resourceId: appointment._id,
    details: { 
      patientName: appointment.patient.fullName,
      department: appointment.department.name,
      doctor: appointment.doctor?.fullName
    },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: req.user.hospitalId,
    status: "SUCCESS"
  });

  // Send real-time notification to patient
  req.io.to(appointment.patient._id.toString()).emit("appointment:checkedin", {
    appointmentId: appointment._id,
    status: "CHECKED_IN",
    checkInTime: appointment.checkInTime
  });

  res.json({
    message: "Patient checked in successfully",
    appointment
  });
});

/**
 * Get check-in statistics
 * GET /checkin/stats
 * @access Private (Staff only)
 */
export const getCheckInStats = asyncHandler(async (req, res) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [totalToday, checkedIn, pending, inProgress] = await Promise.all([
    Appointment.countDocuments({
      hospital: req.user.hospitalId,
      date: { $gte: today, $lt: tomorrow }
    }),
    Appointment.countDocuments({
      hospital: req.user.hospitalId,
      date: { $gte: today, $lt: tomorrow },
      status: "CHECKED_IN"
    }),
    Appointment.countDocuments({
      hospital: req.user.hospitalId,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ["BOOKED", "CONFIRMED"] }
    }),
    Appointment.countDocuments({
      hospital: req.user.hospitalId,
      date: { $gte: today, $lt: tomorrow },
      status: "IN_PROGRESS"
    })
  ]);

  res.json({
    date: today,
    statistics: {
      totalAppointments: totalToday,
      checkedIn,
      pending,
      inProgress,
      completed: totalToday - checkedIn - pending - inProgress
    }
  });
});