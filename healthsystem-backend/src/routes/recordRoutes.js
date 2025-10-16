import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { 
  listRecords,
  getPatientRecords,
  getRecordById 
} from "../controllers/recordController.js";

const router = Router();

// Get records - works for both patients (own records) and staff
router.get("/", auth, listRecords);

// Get records for specific patient
router.get("/patient/:patientId", auth, getPatientRecords);

// Get single record by ID
router.get("/:id", auth, getRecordById);

export default router;