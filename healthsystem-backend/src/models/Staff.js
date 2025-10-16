import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true 
    },
    passwordHash: { 
      type: String, 
      required: true 
    },
    staffId: { 
      type: String, 
      required: true, 
      unique: true,
      uppercase: true 
    },
    fullName: { 
      type: String, 
      required: true 
    },
    role: {
      type: String,
      enum: [
        "DOCTOR",
        "NURSE",
        "RECEPTIONIST",
        "PHARMACIST",
        "LAB_TECHNICIAN",
        "RADIOLOGIST",
        "ADMIN",
        "MANAGER",
        "SECURITY",
        "OTHER"
      ],
      required: true
    },
    specialization: {
      type: String,
      // Only applicable for doctors
      enum: [
        "GENERAL_PRACTITIONER",
        "CARDIOLOGIST",
        "NEUROLOGIST",
        "ORTHOPEDIC",
        "PEDIATRICIAN",
        "GYNECOLOGIST",
        "ONCOLOGIST",
        "PSYCHIATRIST",
        "DERMATOLOGIST",
        "ENT_SPECIALIST",
        "OPHTHALMOLOGIST",
        "DENTIST",
        "SURGEON",
        "ANESTHESIOLOGIST",
        "RADIOLOGIST",
        "PATHOLOGIST",
        "OTHER",
        null
      ]
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
    nic: String,
    phone: String,
    address: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER"]
    },
    qualifications: [{
      degree: String,
      institution: String,
      year: Number,
      country: String
    }],
    licenseNumber: {
      // Medical council registration number
      type: String,
      sparse: true,
      unique: true
    },
    experience: {
      years: Number,
      details: String
    },
    avatarUrl: String,
    shift: {
      type: String,
      enum: ["MORNING", "EVENING", "NIGHT", "ROTATING", "ON_CALL"],
      default: "MORNING"
    },
    workingHours: {
      monday: { start: String, end: String, isWorking: Boolean },
      tuesday: { start: String, end: String, isWorking: Boolean },
      wednesday: { start: String, end: String, isWorking: Boolean },
      thursday: { start: String, end: String, isWorking: Boolean },
      friday: { start: String, end: String, isWorking: Boolean },
      saturday: { start: String, end: String, isWorking: Boolean },
      sunday: { start: String, end: String, isWorking: Boolean }
    },
    consultationFee: {
      // For private hospitals
      type: Number,
      default: 0
    },
    maxPatientsPerDay: {
      type: Number,
      default: 20
    },
    languages: [{
      type: String,
      enum: ["SINHALA", "TAMIL", "ENGLISH", "OTHER"]
    }],
    emergencyContact: {
      name: String,
      relationship: String,
      phone: String
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    joinDate: { 
      type: Date, 
      default: Date.now 
    },
    lastLogin: Date,
    notes: String
  },
  { timestamps: true }
);

// Indexes
staffSchema.index({ staffId: 1 });
staffSchema.index({ email: 1 });
staffSchema.index({ hospital: 1, department: 1 });
staffSchema.index({ role: 1, isActive: 1 });
staffSchema.index({ specialization: 1 });

export default mongoose.model("Staff", staffSchema);