import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    hospital: { type: String, required: true },       // e.g., "NHSL"
    department: { type: String, required: true },     // e.g., "Cardiology"
    doctor: { type: String },                         // optional text for now
    date: { type: Date, required: true },
    status: { type: String, enum: ["BOOKED", "CANCELLED", "COMPLETED"], default: "BOOKED" },
    notes: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
