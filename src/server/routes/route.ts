import { Router } from "express";

import { deleteAccount } from "../controllers/deleteAccount";
import { getGroovesController, tagGrooveController } from "../controllers/grooveController";
import { loginController } from "../controllers/loginController";
import { requestPasswordResetController } from "../controllers/passwordResetRequest";
import { getProfileController } from "../controllers/profileDetailsController";
import { reportController } from "../controllers/reportController";
import { resetPasswordWithOtp } from "../controllers/resetPassword";
import { createUserController, getUserController } from "../controllers/userController";
import { authMiddleware } from "../middleWare/middleWare";
import {saveTokenController} from "../controllers/save-device-token";
import { supportGrooveController } from "../controllers/grooveController";
import { deleteGrooveController } from "../controllers/grooveController";
import { getUserGroovesController } from "../controllers/grooveController";
import { updateSettingsController } from "../controllers/settings";

const router = Router();

router.patch('/updateSettings/:userId', authMiddleware, updateSettingsController);
router.post("/grooves/tag", authMiddleware,tagGrooveController);
router.get("/grooves",authMiddleware, getGroovesController);
router.get("/grooves/userRecentGroove",authMiddleware, getUserGroovesController);

router.post("/users/login", loginController)
router.post("/user/resetPassword", resetPasswordWithOtp )
router.post("/user/forgotPassword", requestPasswordResetController)
router.delete("/grooves/delete", authMiddleware, deleteGrooveController);

router.post("/users/create", createUserController);
router.get("/users/:id",authMiddleware, getUserController);
router.delete("/user/deleteAccount/:id",authMiddleware, deleteAccount);
router.get("/user/profile",authMiddleware, getProfileController)
router.post("/groove/report",authMiddleware, reportController);
router.patch("/user/updateDeviceToken/:userId",authMiddleware, saveTokenController)
router.post("/groove/support", authMiddleware, supportGrooveController)

export default router;
