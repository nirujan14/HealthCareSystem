import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { 
  listRecords,
  getPatientRecords,  // Add this import
  getRecordById 
} from "../controllers/recordController.js";

const router = Router();

// Get all records (for staff/admin)
router.get("/", auth, listRecords);

// Get records for specific patient (for patients and staff)
router.get("/patient/:patientId", auth, getPatientRecords);

// Get single record by ID
router.get("/:id", auth, getRecordById);

export default router;