import express from "express"
import { authenticate } from "../auth/auth.middleware";
import { endpointController } from "./endpoint.controller";

const router = express.Router();

router.post("/", authenticate, endpointController.create);
router.get("/", authenticate, endpointController.list);
router.get("/:id", authenticate, endpointController.listById);
router.patch("/:id", authenticate, endpointController.update);
router.delete("/:id", authenticate, endpointController.delete);

export default router;