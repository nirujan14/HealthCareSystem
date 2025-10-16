import Appointment from "../models/Appointment.js";
import Notification from "../models/AuditNotification.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const listMine = asyncHandler(async (req, res) => {
  const { status, upcoming } = req.query;
  let query = { patient: req.user.id };
  
  if (status) query.status = status;
  if (upcoming === 'true') {
    query.date = { $gte: new Date() };
    query.status = "BOOKED";
  }
  
  const items = await Appointment.find(query).sort({ date: 1 });
  res.json(items);
});

export const getById = asyncHandler(async (req, res) => {
  const appt = await Appointment.findOne({ 
    _id: req.params.id, 
    patient: req.user.id 
  });
  if (!appt) return res.status(404).json({ error: "Appointment not found" });
  res.json(appt);
});

// Get available time slots for a specific doctor/department
export const getAvailableSlots = asyncHandler(async (req, res) => {
  const { hospital, department, date } = req.query;
  
  if (!hospital || !department || !date) {
    return res.status(400).json({ error: "hospital, department, and date required" });
  }

  const selectedDate = new Date(date);
  const startOfDay = new Date(selectedDate);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(selectedDate);
  endOfDay.setHours(23, 59, 59, 999);

  // Find booked appointments for that day
  const bookedAppointments = await Appointment.find({
    hospital,
    department,
    date: { $gte: startOfDay, $lte: endOfDay },
    status: "BOOKED"
  });

  // Generate time slots (9 AM - 5 PM, 30-minute intervals)
  const slots = [];
  const bookedTimes = bookedAppointments.map(a => a.date.toISOString());
  
  for (let hour = 9; hour < 17; hour++) {
    for (let minute of [0, 30]) {
      const slotDate = new Date(selectedDate);
      slotDate.setHours(hour, minute, 0, 0);
      
      const isBooked = bookedTimes.includes(slotDate.toISOString());
      const isPast = slotDate < new Date();
      
      slots.push({
        time: slotDate.toISOString(),
        available: !isBooked && !isPast,
        displayTime: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      });
    }
  }

  res.json({ slots });
});

export const create = asyncHandler(async (req, res) => {
  const { hospital, department, doctor, date, notes, bookingMethod } = req.body;
  if (!hospital || !department || !date) {
    return res.status(400).json({ error: "hospital, department, date required" });
  }

  // Check if slot is already booked
  const existingAppointment = await Appointment.findOne({
    hospital,
    department,
    date: new Date(date),
    status: "BOOKED"
  });

  if (existingAppointment) {
    return res.status(400).json({ error: "Time slot already booked" });
  }

  const appt = await Appointment.create({
    patient: req.user.id,
    hospital,
    department,
    doctor,
    date: new Date(date),
    notes,
    bookingMethod: bookingMethod || "online"
  });

  // Create notification
  await Notification.create({
    patient: req.user.id,
    type: "APPOINTMENT",
    title: "Appointment Booked",
    message: `Your appointment at ${hospital} - ${department} on ${new Date(date).toLocaleString()} has been confirmed.`,
    relatedId: appt._id
  });

  // Send real-time update
  req.io.to(req.user.id.toString()).emit("appointment:created", appt);
  
  res.status(201).json(appt);
});

export const cancel = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  
  const appt = await Appointment.findOne({ _id: id, patient: req.user.id });
  if (!appt) return res.status(404).json({ error: "Appointment not found" });
  
  if (appt.status !== "BOOKED") {
    return res.status(400).json({ error: "Cannot cancel this appointment" });
  }

  appt.status = "CANCELLED";
  appt.cancellationReason = reason;
  appt.cancelledAt = new Date();
  await appt.save();

  // Create notification
  await Notification.create({
    patient: req.user.id,
    type: "APPOINTMENT",
    title: "Appointment Cancelled",
    message: `Your appointment at ${appt.hospital} on ${appt.date.toLocaleString()} has been cancelled.`,
    relatedId: appt._id
  });

  req.io.to(req.user.id.toString()).emit("appointment:updated", appt);
  res.json(appt);
});

export const reschedule = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { newDate } = req.body;

  if (!newDate) {
    return res.status(400).json({ error: "New date is required" });
  }

  const appt = await Appointment.findOne({ _id: id, patient: req.user.id });
  if (!appt) return res.status(404).json({ error: "Appointment not found" });

  if (appt.status !== "BOOKED") {
    return res.status(400).json({ error: "Cannot reschedule this appointment" });
  }

  // Check if new slot is available
  const conflicting = await Appointment.findOne({
    hospital: appt.hospital,
    department: appt.department,
    date: new Date(newDate),
    status: "BOOKED",
    _id: { $ne: id }
  });

  if (conflicting) {
    return res.status(400).json({ error: "New time slot is not available" });
  }

  const oldDate = appt.date;
  appt.date = new Date(newDate);
  await appt.save();

  // Create notification
  await Notification.create({
    patient: req.user.id,
    type: "APPOINTMENT",
    title: "Appointment Rescheduled",
    message: `Your appointment has been rescheduled from ${oldDate.toLocaleString()} to ${new Date(newDate).toLocaleString()}.`,
    relatedId: appt._id
  });

  req.io.to(req.user.id.toString()).emit("appointment:updated", appt);
  res.json(appt);
});