import express from "express";
import { apiKeyController } from "./api-key.controller";
import { authenticate } from "../auth/auth.middleware";

const router = express.Router();

router.post("/", authenticate, apiKeyController.create);
router.get("/", authenticate, apiKeyController.list);
router.delete("/:id", authenticate, apiKeyController.delete);

export default router;
