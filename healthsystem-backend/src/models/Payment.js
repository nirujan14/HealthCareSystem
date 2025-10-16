import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    paymentId: { 
      type: String, 
      required: true, 
      unique: true 
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
    appointment: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Appointment" 
    },
    record: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Record" 
    },
    amount: { 
      type: Number, 
      required: true,
      min: 0 
    },
    currency: { 
      type: String, 
      default: "LKR" 
    },
    paymentMethod: {
      type: String,
      enum: [
        "CASH",
        "CREDIT_CARD",
        "DEBIT_CARD",
        "MOBILE_PAYMENT",
        "BANK_TRANSFER",
        "INSURANCE",
        "GOVERNMENT_COVERED",
        "OTHER"
      ],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: [
        "PENDING",
        "COMPLETED",
        "FAILED",
        "REFUNDED",
        "CANCELLED",
        "PARTIALLY_PAID"
      ],
      default: "PENDING"
    },
    transactionId: {
      // External transaction ID from payment gateway
      type: String,
      sparse: true
    },
    insuranceDetails: {
      provider: String,
      policyNumber: String,
      claimNumber: String,
      coverageAmount: Number,
      patientResponsibility: Number,  // Co-pay amount
      claimStatus: {
        type: String,
        enum: ["SUBMITTED", "APPROVED", "REJECTED", "PENDING", "PAID", null],
        default: null
      }
    },
    breakdown: [{
      service: String,
      description: String,
      quantity: { type: Number, default: 1 },
      unitPrice: Number,
      totalPrice: Number,
      isCoveredByInsurance: { type: Boolean, default: false },
      isCoveredByGovernment: { type: Boolean, default: false }
    }],
    paymentDate: { 
      type: Date, 
      default: Date.now 
    },
    paidBy: {
      name: String,
      relationship: String,  // "SELF", "FAMILY_MEMBER", "GUARDIAN", etc.
      contact: String
    },
    receiptNumber: String,
    receiptUrl: String,  // PDF receipt stored in cloud
    refundDetails: {
      amount: Number,
      reason: String,
      refundedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
      refundDate: Date,
      refundMethod: String
    },
    processedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Staff" 
    },
    notes: String,
    metadata: {
      // Additional payment gateway data
      type: mongoose.Schema.Types.Mixed
    }
  },
  { timestamps: true }
);

// Indexes
paymentSchema.index({ paymentId: 1 });
paymentSchema.index({ patient: 1, paymentDate: -1 });
paymentSchema.index({ hospital: 1, paymentStatus: 1 });
paymentSchema.index({ appointment: 1 });
paymentSchema.index({ paymentStatus: 1, paymentDate: -1 });
paymentSchema.index({ "insuranceDetails.claimNumber": 1 });

export default mongoose.model("Payment", paymentSchema);