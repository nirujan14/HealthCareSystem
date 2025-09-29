import jwt from "jsonwebtoken";
import Patient from "../models/Patient.js";

export const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const patient = await Patient.findById(payload.id);
    if (!patient || !patient.isActive) return res.status(401).json({ error: "Unauthorized" });

    req.user = { id: patient._id };
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
};
