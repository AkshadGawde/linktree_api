import express from "express";
import { getReferrals } from "../controllers/referralController.js";
import { getReferralStats } from "../controllers/referralController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/", authMiddleware, getReferrals);
router.get("/stats", authMiddleware, getReferralStats);

export default router;
