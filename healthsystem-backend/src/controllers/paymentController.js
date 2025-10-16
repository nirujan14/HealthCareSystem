import Payment from "../models/Payment.js";
import Notification from "../models/AuditNotification.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listMyPayments = asyncHandler(async (req, res) => {
  const { status } = req.query;
  let query = { patient: req.user.id };
  
  if (status) query.status = status;
  
  const payments = await Payment.find(query)
    .populate("appointment", "hospital department date")
    .sort({ createdAt: -1 });
  
  res.json(payments);
});

export const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findOne({ 
    _id: req.params.id, 
    patient: req.user.id 
  }).populate("appointment", "hospital department date");
  
  if (!payment) return res.status(404).json({ error: "Payment not found" });
  res.json(payment);
});

export const initiatePayment = asyncHandler(async (req, res) => {
  const { 
    appointmentId, 
    amount, 
    paymentMethod, 
    billItems,
    hospital,
    department,
    serviceDescription,
    insuranceProvider,
    insurancePolicyNumber,
    splitDetails
  } = req.body;

  if (!amount || !paymentMethod || !hospital) {
    return res.status(400).json({ error: "Missing required payment details" });
  }

  // Validate payment method
  if (paymentMethod === "SPLIT" && (!splitDetails || splitDetails.length === 0)) {
    return res.status(400).json({ error: "Split payment requires split details" });
  }

  // For insurance, submit claim automatically
  let insuranceClaimStatus = "N/A";
  if (paymentMethod === "INSURANCE") {
    if (!insuranceProvider || !insurancePolicyNumber) {
      return res.status(400).json({ error: "Insurance details required" });
    }
    insuranceClaimStatus = "PENDING";
  }

  const payment = await Payment.create({
    patient: req.user.id,
    appointment: appointmentId,
    amount,
    paymentMethod,
    hospital,
    department,
    serviceDescription,
    billItems,
    insuranceProvider,
    insurancePolicyNumber,
    insuranceClaimStatus,
    splitDetails,
    status: paymentMethod === "GOVERNMENT" ? "COMPLETED" : "PENDING",
    transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
  });

  // Create notification
  await Notification.create({
    patient: req.user.id,
    type: "PAYMENT",
    title: paymentMethod === "INSURANCE" ? "Insurance Claim Submitted" : "Payment Initiated",
    message: paymentMethod === "INSURANCE" 
      ? `Your insurance claim for LKR ${amount} has been submitted to ${insuranceProvider}.`
      : `Payment of LKR ${amount} via ${paymentMethod} is being processed.`,
    relatedId: payment._id,
    relatedModel: "Payment"
  });

  res.status(201).json(payment);
});

export const processPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { cardDetails, paymentGateway } = req.body;

  const payment = await Payment.findOne({ _id: id, patient: req.user.id });
  if (!payment) return res.status(404).json({ error: "Payment not found" });

  if (payment.status !== "PENDING") {
    return res.status(400).json({ error: "Payment already processed" });
  }

  // Simulate payment processing
  // In production, integrate with actual payment gateway
  const isSuccess = Math.random() > 0.1; // 90% success rate for demo

  if (isSuccess) {
    payment.status = "COMPLETED";
    payment.processedAt = new Date();
    payment.paymentGateway = paymentGateway || "DEMO_GATEWAY";
    await payment.save();

    await Notification.create({
      patient: req.user.id,
      type: "PAYMENT",
      title: "Payment Successful",
      message: `Your payment of LKR ${payment.amount} has been processed successfully.`,
      relatedId: payment._id,
      relatedModel: "Payment"
    });

    req.io.to(req.user.id.toString()).emit("payment:completed", payment);
    res.json(payment);
  } else {
    payment.status = "FAILED";
    await payment.save();

    await Notification.create({
      patient: req.user.id,
      type: "PAYMENT",
      title: "Payment Failed",
      message: `Payment of LKR ${payment.amount} failed. Please try again.`,
      relatedId: payment._id,
      relatedModel: "Payment",
      priority: "HIGH"
    });

    res.status(400).json({ error: "Payment processing failed", payment });
  }
});

export const updateInsuranceClaim = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { insuranceClaimStatus, insuranceCoverageAmount } = req.body;

  const payment = await Payment.findOne({ _id: id, patient: req.user.id });
  if (!payment) return res.status(404).json({ error: "Payment not found" });

  if (payment.paymentMethod !== "INSURANCE") {
    return res.status(400).json({ error: "Not an insurance payment" });
  }

  payment.insuranceClaimStatus = insuranceClaimStatus;
  if (insuranceCoverageAmount !== undefined) {
    payment.insuranceCoverageAmount = insuranceCoverageAmount;
  }

  // If claim approved, calculate remaining amount patient needs to pay
  if (insuranceClaimStatus === "APPROVED") {
    const remainingAmount = payment.amount - payment.insuranceCoverageAmount;
    if (remainingAmount > 0) {
      payment.status = "PENDING"; // Patient needs to pay remaining
    } else {
      payment.status = "COMPLETED";
    }
  } else if (insuranceClaimStatus === "REJECTED") {
    payment.status = "PENDING"; // Patient needs to pay full amount
  }

  await payment.save();

  await Notification.create({
    patient: req.user.id,
    type: "PAYMENT",
    title: `Insurance Claim ${insuranceClaimStatus}`,
    message: insuranceClaimStatus === "APPROVED"
      ? `Your insurance claim has been approved. Coverage: LKR ${insuranceCoverageAmount}.`
      : `Your insurance claim has been ${insuranceClaimStatus.toLowerCase()}.`,
    relatedId: payment._id,
    relatedModel: "Payment",
    priority: "HIGH"
  });

  req.io.to(req.user.id.toString()).emit("payment:updated", payment);
  res.json(payment);
});