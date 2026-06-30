import express from "express";
import { authenticateApiKey } from "../api-key/api-key.middleware";
import { eventController } from "./event.controller";
import { authenticate } from "../auth/auth.middleware";

const router = express.Router();

router.post("/", authenticateApiKey, eventController.create);
router.get("/", authenticate, eventController.list);
router.get("/:id", authenticate, eventController.getById);

export default router;
