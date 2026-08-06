import { Router } from "express";
import { RollMappingController } from "../controllers/rollMapping.controller.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

// Only admin can manage roll mappings
router.use(authenticate, authorize("admin"));

router.get("/", RollMappingController.getMappings);
router.post("/", RollMappingController.createMapping);
router.put("/:id", RollMappingController.updateMapping);
router.delete("/:id", RollMappingController.deleteMapping);

export default router;
