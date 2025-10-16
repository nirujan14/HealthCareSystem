import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true 
    },
    hospitalId: { 
      type: String, 
      required: true, 
      unique: true,
      uppercase: true 
    },
    type: { 
      type: String, 
      enum: ["GOVERNMENT", "PRIVATE"], 
      required: true 
    },
    address: {
      street: String,
      city: String,
      district: String,
      province: String,
      postalCode: String
    },
    contact: {
      phone: String,
      email: String,
      fax: String,
      emergencyHotline: String
    },
    facilities: [{
      type: String,
      enum: ["ICU", "EMERGENCY", "SURGERY", "LABORATORY", "PHARMACY", "RADIOLOGY", "MATERNITY", "PEDIATRICS", "DIALYSIS", "BLOOD_BANK"]
    }],
    operatingHours: {
      weekdays: {
        open: String,  // e.g., "08:00"
        close: String   // e.g., "20:00"
      },
      weekends: {
        open: String,
        close: String
      },
      is24x7: { type: Boolean, default: false }
    },
    totalBeds: { type: Number, default: 0 },
    availableBeds: { type: Number, default: 0 },
    services: [{
      name: String,
      description: String,
      cost: Number,  // 0 for government hospitals
      duration: Number  // in minutes
    }],
    isActive: { 
      type: Boolean, 
      default: true 
    },
    registrationDate: { 
      type: Date, 
      default: Date.now 
    },
    accreditation: {
      isAccredited: Boolean,
      accreditingBody: String,
      validUntil: Date
    },
    coordinates: {
      latitude: Number,
      longitude: Number
    }
  },
  { timestamps: true }
);

// Indexes for better query performance
hospitalSchema.index({ hospitalId: 1 });
hospitalSchema.index({ type: 1, isActive: 1 });
hospitalSchema.index({ "address.city": 1 });
hospitalSchema.index({ "coordinates.latitude": 1, "coordinates.longitude": 1 });

export default mongoose.model("Hospital", hospitalSchema);