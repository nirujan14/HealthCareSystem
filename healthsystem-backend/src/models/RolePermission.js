import mongoose from "mongoose";

// Permission Model
const permissionSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true,
      uppercase: true 
    },
    resource: {
      // What resource this permission applies to
      type: String,
      required: true,
      enum: [
        "PATIENT",
        "APPOINTMENT",
        "RECORD",
        "PAYMENT",
        "STAFF",
        "HOSPITAL",
        "DEPARTMENT",
        "REPORT",
        "PRESCRIPTION",
        "LAB_RESULT",
        "SYSTEM"
      ]
    },
    action: {
      // What action can be performed
      type: String,
      required: true,
      enum: ["CREATE", "READ", "UPDATE", "DELETE", "MANAGE", "APPROVE", "REJECT"]
    },
    description: String,
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);

// Compound index for resource and action
permissionSchema.index({ resource: 1, action: 1 }, { unique: true });

// Role Model
const roleSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      unique: true,
      uppercase: true 
    },
    displayName: {
      type: String,
      required: true
    },
    description: String,
    permissions: [{ 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Permission" 
    }],
    level: {
      // Hierarchy level for role-based decisions
      type: Number,
      default: 1,
      min: 1,
      max: 10
      // 1 = Patient, 2 = Receptionist, 3 = Nurse, 4 = Doctor, 
      // 5 = HOD, 6 = Manager, 7 = Admin, 8 = Super Admin
    },
    isSystemRole: {
      // System roles cannot be deleted
      type: Boolean,
      default: false
    },
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);

// Indexes
roleSchema.index({ name: 1 });
roleSchema.index({ level: 1 });

// User-Role Association Model (for flexible role assignment)
const userRoleSchema = new mongoose.Schema(
  {
    user: {
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      userType: { 
        type: String, 
        enum: ["PATIENT", "STAFF"], 
        required: true 
      }
    },
    role: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Role", 
      required: true 
    },
    hospital: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Hospital" 
      // Optional: for hospital-specific role assignments
    },
    assignedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Staff" 
    },
    assignedDate: { 
      type: Date, 
      default: Date.now 
    },
    expiryDate: Date,  // For temporary role assignments
    isActive: { 
      type: Boolean, 
      default: true 
    }
  },
  { timestamps: true }
);

// Compound index to prevent duplicate role assignments
userRoleSchema.index({ "user.userId": 1, "user.userType": 1, role: 1, hospital: 1 }, { unique: true });
userRoleSchema.index({ "user.userId": 1, isActive: 1 });

// Export all models
export const Permission = mongoose.model("Permission", permissionSchema);
export const Role = mongoose.model("Role", roleSchema);
export const UserRole = mongoose.model("UserRole", userRoleSchema);