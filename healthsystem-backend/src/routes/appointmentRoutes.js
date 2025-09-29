import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { listMine, create, cancel } from "../controllers/appointmentController.js";

const router = Router();

router.get("/", auth, listMine);
router.post("/", auth, create);
router.patch("/:id/cancel", auth, cancel);

export default router;
