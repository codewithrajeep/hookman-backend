import express from "express";
import { authenticate } from "../auth/auth.middleware";
import { deliveryController } from "./delivery.controller";

const router = express.Router();

router.get("/attempts/:eventId", authenticate, deliveryController.listAttempts);
router.get("/dead-letters", authenticate, deliveryController.listDeadLetters);
router.get("/dead-letters/:eventId", authenticate, deliveryController.getDeadLetter)

export default router;
