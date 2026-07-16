import express from "express"
import { authenticate } from "../auth/auth.middleware";
import { statsController } from "./stats.controller";

const router = express.Router();

router.get("/", authenticate, statsController.getOverallStats);
router.get("/:endpointId", authenticate, statsController.getStatsByEndpoint);

export default router;
