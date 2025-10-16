import mongoose from "mongoose";

const recordSchema = new mongoose.Schema(
  {
    recordNumber: {
      type: String,
      unique: true,
      required: true
      // Format: MR-YYYYMMDD-XXXXX
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
    appointment: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Appointment" 
    },
    visitDate: { 
      type: Date, 
      required: true 
    },
    visitType: {
      type: String,
      enum: [
        "OUTPATIENT",
        "INPATIENT",
        "EMERGENCY",
        "FOLLOW_UP",
        "SURGERY",
        "LAB_TEST",
        "SCAN",
        "THERAPY"
      ],
      default: "OUTPATIENT"
    },
    attendingDoctor: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Staff",
      required: true 
    },
    chiefComplaint: {
      // Main reason for visit
      type: String,
      required: true
    },
    symptoms: [String],
    vitalSigns: {
      bloodPressure: {
        systolic: Number,
        diastolic: Number,
        unit: { type: String, default: "mmHg" }
      },
      heartRate: {
        value: Number,
        unit: { type: String, default: "bpm" }
      },
      temperature: {
        value: Number,
        unit: { type: String, enum: ["C", "F"], default: "C" }
      },
      respiratoryRate: {
        value: Number,
        unit: { type: String, default: "breaths/min" }
      },
      oxygenSaturation: {
        value: Number,
        unit: { type: String, default: "%" }
      },
      weight: {
        value: Number,
        unit: { type: String, enum: ["kg", "lb"], default: "kg" }
      },
      height: {
        value: Number,
        unit: { type: String, enum: ["cm", "in"], default: "cm" }
      },
      bmi: Number
    },
    medicalHistory: {
      pastIllnesses: [String],
      surgeries: [{
        name: String,
        date: Date,
        hospital: String
      }],
      familyHistory: [String],
      socialHistory: {
        smoking: { type: String, enum: ["NEVER", "FORMER", "CURRENT", "UNKNOWN"] },
        alcohol: { type: String, enum: ["NEVER", "OCCASIONAL", "REGULAR", "HEAVY", "UNKNOWN"] },
        exercise: String,
        occupation: String
      }
    },
    diagnosis: {
      primary: {
        condition: { type: String, required: true },
        icdCode: String,  // ICD-10 code
        severity: { type: String, enum: ["MILD", "MODERATE", "SEVERE", "CRITICAL"] }
      },
      secondary: [{
        condition: String,
        icdCode: String,
        severity: String
      }]
    },
    clinicalNotes: String,
    treatmentPlan: String,
    prescriptions: [{
      medicationName: { type: String, required: true },
      dosage: { type: String, required: true },
      frequency: { type: String, required: true },
      duration: String,
      instructions: String,
      startDate: Date,
      endDate: Date,
      isActive: { type: Boolean, default: true }
    }],
    labTests: [{
      testName: String,
      orderedDate: Date,
      resultDate: Date,
      result: String,
      normalRange: String,
      status: { type: String, enum: ["ORDERED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] },
      attachmentUrl: String
    }],
    imagingStudies: [{
      studyType: String,  // X-Ray, CT, MRI, Ultrasound, etc.
      orderedDate: Date,
      performedDate: Date,
      findings: String,
      radiologistNotes: String,
      attachmentUrl: String
    }],
    procedures: [{
      name: String,
      date: Date,
      performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      notes: String,
      outcome: String
    }],
    followUp: {
      required: { type: Boolean, default: false },
      scheduledDate: Date,
      instructions: String,
      department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" }
    },
    attachments: [{
      name: String,
      type: { 
        type: String, 
        enum: ["REPORT", "SCAN", "XRAY", "LAB_RESULT", "PRESCRIPTION", "CONSENT_FORM", "OTHER"],
        default: "REPORT" 
      },
      url: String,
      publicId: String,  // Cloudinary public ID
      uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      uploadedAt: { type: Date, default: Date.now },
      description: String
    }],
    admissionDetails: {
      // For inpatient visits
      admissionDate: Date,
      dischargeDate: Date,
      ward: String,
      bedNumber: String,
      reasonForAdmission: String,
      dischargeSummary: String
    },
    billingStatus: {
      type: String,
      enum: ["PENDING", "BILLED", "PAID", "INSURANCE_CLAIMED", "GOVERNMENT_COVERED"],
      default: "PENDING"
    },
    payment: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Payment" 
    },
    status: {
      type: String,
      enum: ["DRAFT", "FINALIZED", "AMENDED", "ARCHIVED"],
      default: "DRAFT"
    },
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Staff",
      required: true 
    },
    lastModifiedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Staff" 
    },
    isConfidential: {
      type: Boolean,
      default: false
    },
    accessLog: [{
      accessedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      accessedAt: { type: Date, default: Date.now },
      action: { type: String, enum: ["VIEW", "EDIT", "PRINT", "EXPORT"] },
      ipAddress: String
    }],
    notes: String
  },
  { timestamps: true }
);

// Indexes for better performance
recordSchema.index({ recordNumber: 1 });
recordSchema.index({ patient: 1, visitDate: -1 });
recordSchema.index({ hospital: 1, department: 1, visitDate: -1 });
recordSchema.index({ attendingDoctor: 1, visitDate: -1 });
recordSchema.index({ appointment: 1 });
recordSchema.index({ status: 1 });
recordSchema.index({ "diagnosis.primary.condition": "text", chiefComplaint: "text" });

export default mongoose.model("Record", recordSchema);