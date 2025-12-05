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

const router = Router();


router.post("/grooves/tag", authMiddleware,tagGrooveController);
router.get("/grooves", getGroovesController);
router.post("/users/login", loginController)
router.post("/user/resetPassword", resetPasswordWithOtp )
router.post("/user/forgotPassword", requestPasswordResetController)


router.post("/users/create", createUserController);
router.get("/users/:id", getUserController);
router.delete("/user/deleteAccount/:id",authMiddleware, deleteAccount);
router.get("/user/profile",authMiddleware, getProfileController)
router.post("/reports", reportController);
router.post("/save-device-token", saveTokenController)

export default router;
