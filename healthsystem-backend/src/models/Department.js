import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    hospital: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Hospital", 
      required: true 
    },
    name: { 
      type: String, 
      required: true,
      trim: true 
    },
    code: { 
      type: String, 
      required: true,
      uppercase: true 
    },
    description: String,
    category: {
      type: String,
      enum: [
        "GENERAL",
        "CARDIOLOGY",
        "NEUROLOGY",
        "ORTHOPEDICS",
        "PEDIATRICS",
        "OBSTETRICS_GYNECOLOGY",
        "ONCOLOGY",
        "RADIOLOGY",
        "PATHOLOGY",
        "EMERGENCY",
        "SURGERY",
        "PSYCHIATRY",
        "DERMATOLOGY",
        "ENT",
        "OPHTHALMOLOGY",
        "DENTISTRY",
        "PHYSIOTHERAPY",
        "OTHER"
      ],
      default: "GENERAL"
    },
    headOfDepartment: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Staff" 
    },
    location: {
      building: String,
      floor: String,
      wing: String
    },
    contact: {
      phone: String,
      extension: String,
      email: String
    },
    operatingHours: {
      weekdays: {
        open: String,
        close: String
      },
      weekends: {
        open: String,
        close: String
      },
      is24x7: { type: Boolean, default: false }
    },
    staffCount: { 
      type: Number, 
      default: 0 
    },
    bedsAllocated: { 
      type: Number, 
      default: 0 
    },
    equipmentList: [{
      name: String,
      quantity: Number,
      status: {
        type: String,
        enum: ["OPERATIONAL", "MAINTENANCE", "OUT_OF_SERVICE"],
        default: "OPERATIONAL"
      }
    }],
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);

// Compound index to ensure unique department codes per hospital
departmentSchema.index({ hospital: 1, code: 1 }, { unique: true });
departmentSchema.index({ hospital: 1, category: 1 });

export default mongoose.model("Department", departmentSchema);