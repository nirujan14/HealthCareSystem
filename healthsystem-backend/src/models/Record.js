import mongoose from "mongoose";

const recordSchema = new mongoose.Schema(
  {
    patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    visitDate: { type: Date, required: true },
    hospital: { type: String, required: true },
    department: { type: String, required: true },
    diagnosis: { type: String },
    prescription: { type: String },
    attachments: [{
      publicId: String,
      url: String,
      type: { type: String, enum: ["report", "scan", "other"], default: "report" }
    }]
  },
  { timestamps: true }
);

export default mongoose.model("Record", recordSchema);
