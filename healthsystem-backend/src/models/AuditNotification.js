import mongoose from "mongoose";

// Audit Log Model for tracking all system actions
const auditLogSchema = new mongoose.Schema(
  {
    user: {
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      userType: { 
        type: String, 
        enum: ["PATIENT", "STAFF"], 
        required: true 
      },
      userName: String,
      userEmail: String
    },
    action: {
      type: String,
      required: true,
      enum: [
        "LOGIN",
        "LOGOUT",
        "CREATE",
        "READ",
        "UPDATE",
        "DELETE",
        "APPROVE",
        "REJECT",
        "CANCEL",
        "EXPORT",
        "PRINT",
        "SCAN_QR",
        "CHECK_IN",
        "PAYMENT",
        "ACCESS_DENIED"
      ]
    },
    resource: {
      type: String,
      required: true,
      enum: [
        "PATIENT",
        "STAFF",
        "APPOINTMENT",
        "RECORD",
        "PAYMENT",
        "HOSPITAL",
        "DEPARTMENT",
        "PRESCRIPTION",
        "LAB_RESULT",
        "SYSTEM"
      ]
    },
    resourceId: mongoose.Schema.Types.ObjectId,
    details: {
      type: mongoose.Schema.Types.Mixed
      // Store relevant details about the action
    },
    ipAddress: String,
    userAgent: String,
    location: {
      country: String,
      city: String
    },
    hospital: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Hospital" 
    },
    status: {
      type: String,
      enum: ["SUCCESS", "FAILED", "UNAUTHORIZED"],
      default: "SUCCESS"
    },
    errorMessage: String,
    timestamp: { 
      type: Date, 
      default: Date.now,
      index: true
    }
  },
  { timestamps: false }  // Using custom timestamp field
);

// Indexes for audit log queries
auditLogSchema.index({ "user.userId": 1, timestamp: -1 });
auditLogSchema.index({ action: 1, resource: 1, timestamp: -1 });
auditLogSchema.index({ hospital: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ resourceId: 1, timestamp: -1 });

// Notification Model
const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      userId: { type: mongoose.Schema.Types.ObjectId, required: true },
      userType: { 
        type: String, 
        enum: ["PATIENT", "STAFF"], 
        required: true 
      }
    },
    type: {
      type: String,
      required: true,
      enum: [
        "APPOINTMENT_REMINDER",
        "APPOINTMENT_CONFIRMED",
        "APPOINTMENT_CANCELLED",
        "APPOINTMENT_RESCHEDULED",
        "PAYMENT_RECEIVED",
        "PAYMENT_DUE",
        "RECORD_UPDATED",
        "LAB_RESULT_READY",
        "PRESCRIPTION_READY",
        "SYSTEM_ALERT",
        "EMERGENCY_ALERT",
        "GENERAL"
      ]
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "URGENT"],
      default: "MEDIUM"
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    relatedResource: {
      resourceType: {
        type: String,
        enum: ["APPOINTMENT", "RECORD", "PAYMENT", "PRESCRIPTION", null]
      },
      resourceId: mongoose.Schema.Types.ObjectId
    },
    channels: {
      inApp: { 
        sent: { type: Boolean, default: false },
        sentAt: Date,
        read: { type: Boolean, default: false },
        readAt: Date
      },
      email: {
        sent: { type: Boolean, default: false },
        sentAt: Date,
        emailAddress: String
      },
      sms: {
        sent: { type: Boolean, default: false },
        sentAt: Date,
        phoneNumber: String
      },
      push: {
        sent: { type: Boolean, default: false },
        sentAt: Date
      }
    },
    actionUrl: String,  // Deep link or URL to related resource
    actionLabel: String,  // Button text like "View Appointment"
    expiresAt: Date,  // For time-sensitive notifications
    sentBy: {
      userId: mongoose.Schema.Types.ObjectId,
      userType: String,
      system: { type: Boolean, default: false }  // True if auto-generated
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed
      // Additional context-specific data
    }
  },
  { timestamps: true }
);

// Indexes for notification queries
notificationSchema.index({ "recipient.userId": 1, createdAt: -1 });
notificationSchema.index({ "recipient.userId": 1, "channels.inApp.read": 1 });
notificationSchema.index({ type: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ "relatedResource.resourceId": 1 });

// TTL index to automatically delete old notifications after 90 days
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 });

// Export models
export const AuditLog = mongoose.model("AuditLog", auditLogSchema);
export const Notification = mongoose.model("Notification", notificationSchema);


export default { AuditLog, Notification };
// Removed the erroneous default export (it referenced an undefined schema and mismatched model name).
// If you need a default export or a Department model, define it properly in a separate file or add it here with its schema.