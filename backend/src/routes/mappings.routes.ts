import { Router } from "express";
import { MappingsController } from "../controllers/mappings.controller.js";
import { mappingValidator } from "../validators/academic.validator.js";
import { validateRequest } from "../middleware/validate.js";
import { authenticate, authorize } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

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
  validateObjectId("id"),
  MappingsController.updateMapping
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  validateObjectId("id"),
  MappingsController.deleteMapping
);

export default router;
