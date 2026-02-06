import express from "express";
import { signup, login, logout, getProfile } from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js"; 

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);

//protected route
router.get("/profile", verifyToken, getProfile); 

export default router;