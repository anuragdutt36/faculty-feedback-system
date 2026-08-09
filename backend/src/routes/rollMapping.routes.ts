import { Router } from "express";
import { RollMappingController } from "../controllers/rollMapping.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = Router();

// Only admin can manage roll mappings
router.use(authenticate, authorize("admin"));

router.get("/", RollMappingController.getMappings);
router.post("/", RollMappingController.createMapping);
router.put("/:id", validateObjectId("id"), RollMappingController.updateMapping);
router.delete("/:id", validateObjectId("id"), RollMappingController.deleteMapping);

export default router;
