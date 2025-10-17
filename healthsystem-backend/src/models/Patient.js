import mongoose from "mongoose";

const patientSchema = new mongoose.Schema(
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
    fullName: { 
      type: String, 
      required: true 
    },
    nic: { 
      type: String,
      sparse: true,
      unique: true 
    },
    dateOfBirth: Date,
    age: Number,  // Calculated field
    gender: {
      type: String,
      enum: ["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]
    },
    phone: { 
      type: String,
      required: true 
    },
    alternatePhone: String,
    address: {
      street: String,
      city: String,
      district: String,
      province: String,
      postalCode: String,
      country: { type: String, default: "Sri Lanka" }
    },
    bloodGroup: { 
      type: String,
      enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", null]
    },
    allergies: [{
      allergen: String,
      reaction: String,
      severity: { type: String, enum: ["MILD", "MODERATE", "SEVERE"] },
      identifiedDate: Date
    }],
    chronicConditions: [{
      condition: String,
      diagnosedDate: Date,
      status: { type: String, enum: ["ACTIVE", "MANAGED", "RESOLVED"] }
    }],
    currentMedications: [{
      name: String,
      dosage: String,
      frequency: String,
      prescribedBy: String,
      startDate: Date
    }],
    emergencyContact: {
      name: { type: String, required: false},
      relationship: String,
      phone: { type: String, required: false },
      alternatePhone: String,
      address: String
    },
    insuranceInfo: [{
      provider: String,
      policyNumber: String,
      validFrom: Date,
      validUntil: Date,
      coverageAmount: Number,
      isPrimary: { type: Boolean, default: false }
    }],
    avatarUrl: String,
    healthCardId: { 
      type: String, 
      unique: true,
      required: true 
    },
    qrCode: {
      type: String, // store QR as base64 string
      required: false
    },
    preferredLanguage: {
      type: String,
      enum: ["SINHALA", "TAMIL", "ENGLISH"],
      default: "ENGLISH"
    },
    occupation: String,
    maritalStatus: {
      type: String,
      enum: ["SINGLE", "MARRIED", "DIVORCED", "WIDOWED", "OTHER"]
    },
    nationality: {
      type: String,
      default: "Sri Lankan"
    },
    ethnicity: String,
    religion: String,
    registrationDate: { 
      type: Date, 
      default: Date.now 
    },
    lastVisit: {
      date: Date,
      hospital: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
      department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" }
    },
    preferredHospital: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Hospital" 
    },
    isActive: { 
      type: Boolean, 
      default: true 
    },
    accountStatus: {
      type: String,
      enum: ["ACTIVE", "SUSPENDED", "DEACTIVATED", "PENDING_VERIFICATION"],
      default: "ACTIVE"
    },
    verificationStatus: {
      email: { type: Boolean, default: false },
      phone: { type: Boolean, default: false },
      identity: { type: Boolean, default: false }
    },
    consents: [{
      type: { 
        type: String, 
        enum: ["DATA_SHARING", "RESEARCH", "MARKETING", "TELEMEDICINE"] 
      },
      granted: Boolean,
      date: Date
    }],
    notes: String,  // Internal notes by staff
    lastLogin: Date,
    loginHistory: [{
      loginTime: Date,
      ipAddress: String,
      deviceInfo: String
    }]
  },
  { timestamps: true }
);

// Indexes for better performance
patientSchema.index({ healthCardId: 1 });
patientSchema.index({ email: 1 });
patientSchema.index({ nic: 1 });
patientSchema.index({ phone: 1 });
patientSchema.index({ fullName: "text" });
patientSchema.index({ isActive: 1, accountStatus: 1 });

// Virtual for full address
patientSchema.virtual("fullAddress").get(function() {
  if (!this.address) return "";
  const { street, city, district, province, postalCode } = this.address;
  return [street, city, district, province, postalCode].filter(Boolean).join(", ");
});

// Calculate age from date of birth
patientSchema.pre("save", function(next) {
  if (this.dateOfBirth) {
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    this.age = age;
  }
  next();
});

export default mongoose.model("Patient", patientSchema);