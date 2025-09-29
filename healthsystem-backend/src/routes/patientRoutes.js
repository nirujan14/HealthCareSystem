import { Router } from "express";
import { auth } from "../middleware/auth.js";
import { getMe, updateMe, uploadAvatar, avatarUploadMiddleware } from "../controllers/patientController.js";

const router = Router();

router.get("/me", auth, getMe);
router.patch("/me", auth, updateMe);
router.post("/me/avatar", auth, avatarUploadMiddleware, uploadAvatar);

export default router;
