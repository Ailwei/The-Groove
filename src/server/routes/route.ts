import { Router } from "express";

import { tagGrooveController,getGroovesController, supportGrooveController } from "../controllers.ts/grooveController";
import { createUserController, getUserController, deleteUserController } from "../controllers.ts/userController";
import { reportController } from "../controllers.ts/reportController";
import { loginController } from "../controllers.ts/loginController";
import { deleteAccount } from "../controllers.ts/deleteAccount";
import { authMiddleware } from "../middleWare/middleWare";
import { getProfileController } from "../controllers.ts/profileDetailsController";
import { resetPasswordWithOtp } from "../controllers.ts/resetPassword";
import { requestPasswordResetController } from "../controllers.ts/passwordResetRequest";


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

export default router;
