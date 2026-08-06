import { Router } from "express";
import { MappingsController } from "../controllers/mappings.controller.js";
import { mappingValidator } from "../validators/academic.validator.js";
import { validateRequest } from "../middleware/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";

const router = Router();

router.get("/", authenticate, MappingsController.getMappings);
router.post(
  "/",
  authenticate,
  authorize("admin"),
  mappingValidator,
  validateRequest,
  MappingsController.createMapping
);
router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  MappingsController.updateMapping
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  MappingsController.deleteMapping
);

export default router;
