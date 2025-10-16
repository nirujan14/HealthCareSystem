import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    appointmentNumber: {
      type: String,
      unique: true,
      required: true
      // Format: APT-YYYYMMDD-XXXXX
    },
    patient: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Patient", 
      required: true 
    },
    hospital: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Hospital", 
      required: true 
    },
    department: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Department", 
      required: true 
    },
    doctor: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Staff"  // Staff with role = DOCTOR
    },
    appointmentType: {
      type: String,
      enum: [
        "CONSULTATION",
        "FOLLOW_UP",
        "EMERGENCY",
        "SURGERY",
        "CHECKUP",
        "VACCINATION",
        "LAB_TEST",
        "SCAN",
        "THERAPY",
        "OTHER"
      ],
      default: "CONSULTATION"
    },
    date: { 
      type: Date, 
      required: true 
    },
    timeSlot: {
      start: String,  // e.g., "09:00"
      end: String     // e.g., "09:30"
    },
    status: { 
      type: String, 
      enum: [
        "BOOKED", 
        "CONFIRMED",
        "CHECKED_IN",
        "IN_PROGRESS",
        "COMPLETED", 
        "CANCELLED",
        "NO_SHOW",
        "RESCHEDULED"
      ], 
      default: "BOOKED" 
    },
    priority: {
      type: String,
      enum: ["NORMAL", "URGENT", "EMERGENCY"],
      default: "NORMAL"
    },
    tokenNumber: Number,  // Queue token for the day
    checkInTime: Date,
    consultationStartTime: Date,
    consultationEndTime: Date,
    reason: {
      type: String,
      required: true
    },
    symptoms: [String],
    notes: String,
    patientNotes: String,  // Notes from patient
    staffNotes: String,    // Notes from staff
    cancellationReason: String,
    cancelledBy: {
      userId: mongoose.Schema.Types.ObjectId,
      userType: { type: String, enum: ["PATIENT", "STAFF"] }
    },
    cancelledAt: Date,
    rescheduledFrom: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Appointment" 
    },
    rescheduledTo: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Appointment" 
    },
    payment: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Payment" 
    },
    attachments: [{
      name: String,
      url: String,
      uploadedAt: Date
    }],
    reminderSent: {
      email: { type: Boolean, default: false },
      sms: { type: Boolean, default: false }
    },
    createdBy: {
      userId: mongoose.Schema.Types.ObjectId,
      userType: { type: String, enum: ["PATIENT", "STAFF"] }
    }
  },
  { timestamps: true }
);

// Indexes for better performance
appointmentSchema.index({ appointmentNumber: 1 });
appointmentSchema.index({ patient: 1, date: -1 });
appointmentSchema.index({ doctor: 1, date: 1 });
appointmentSchema.index({ hospital: 1, department: 1, date: 1 });
appointmentSchema.index({ status: 1, date: 1 });
appointmentSchema.index({ date: 1, status: 1 });

// Virtual for duration
appointmentSchema.virtual("duration").get(function() {
  if (this.consultationStartTime && this.consultationEndTime) {
    return Math.floor((this.consultationEndTime - this.consultationStartTime) / (1000 * 60)); // in minutes
  }
  return null;
});

export default mongoose.model("Appointment", appointmentSchema);