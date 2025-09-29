import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { listRecords } from "../controllers/recordController.js";

const router = Router();

router.get("/", auth, listRecords);

export default router;
