import { Router } from "express";

import { tagGrooveController,getGroovesController, supportGrooveController } from "../controllers.ts/grooveController";
import { createUserController, getUserController, deleteUserController } from "../controllers.ts/userController";
import { reportController } from "../controllers.ts/reportController";
import { loginController } from "../controllers.ts/loginController";
import { deleteAccount } from "../controllers.ts/deleteAccount";
import { authMiddleware } from "../middleWare/middleWare";

const router = Router();


router.post("/grooves/tag", authMiddleware,tagGrooveController);
router.get("/grooves", getGroovesController);
router.post("/users/login", loginController)


router.post("/users/create",authMiddleware, createUserController);
router.get("/users/:id",authMiddleware, getUserController);
router.delete("/user/deleteAccount/:id",authMiddleware, deleteAccount);

router.post("/reports", reportController);

export default router;
