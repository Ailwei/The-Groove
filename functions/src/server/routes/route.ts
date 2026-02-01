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
import { updateSettingsController, getSettingsController } from "../controllers/settings";
import { updateLocationController } from "../controllers/updateLocation";
import {joinChatGroupController, getChatGroupsController,markChatAsReadController, leaveChatGroupController, fetchMessagesController ,sendMessageController } from "../controllers/chatController";
const router = Router();

router.patch('/updateSettings/:userId', authMiddleware, updateSettingsController);
router.get('/getSettings/:userId', authMiddleware, getSettingsController);

router.post("/grooves/tag", authMiddleware,tagGrooveController);
router.get("/grooves",authMiddleware, getGroovesController);
router.get("/grooves/userRecentGroove",authMiddleware, getUserGroovesController);
router.patch("/user/upldatelocation", authMiddleware, updateLocationController)
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

router.post("/chat/joinChat", authMiddleware, joinChatGroupController)
router.post("/chat/sendMessage", authMiddleware, sendMessageController)
router.post("/chat/leaveChat", authMiddleware, leaveChatGroupController)
router.get("/chat/fetchChats", authMiddleware,fetchMessagesController)
router.get("/chat/groups", authMiddleware, getChatGroupsController)
router.post("/chat/markAsRead", authMiddleware,markChatAsReadController)
export default router;
