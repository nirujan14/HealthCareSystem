import Appointment from "../models/Appointment.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listMine = asyncHandler(async (req, res) => {
  const items = await Appointment.find({ patient: req.user.id }).sort({ date: 1 });
  res.json(items);
});

export const create = asyncHandler(async (req, res) => {
  const { hospital, department, doctor, date, notes } = req.body;
  if (!hospital || !department || !date) return res.status(400).json({ error: "hospital, department, date required" });

  const appt = await Appointment.create({
    patient: req.user.id, hospital, department, doctor, date, notes
  });

  req.io.to(req.user.id.toString()).emit("appointment:created", appt); // realtime to the patient
  res.status(201).json(appt);
});

export const cancel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const appt = await Appointment.findOne({ _id: id, patient: req.user.id });
  if (!appt) return res.status(404).json({ error: "Not found" });
  appt.status = "CANCELLED";
  await appt.save();

  req.io.to(req.user.id.toString()).emit("appointment:updated", appt);
  res.json(appt);
});
