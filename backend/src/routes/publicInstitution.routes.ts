import { Router } from "express";
import { PublicInstitutionController } from "../controllers/publicInstitution.controller.js";
import { CollegeSearchController } from "../controllers/collegeSearch.controller.js";

const router = Router();

// Public: Autocomplete search recognized higher education institutions in India
router.get("/search-colleges", CollegeSearchController.searchColleges);

// Public: Get institution details by slug
router.get("/by-slug/:slug", PublicInstitutionController.getBySlug);

// Public: List active institutions for exploration
router.get("/active-tenants", PublicInstitutionController.listActiveTenants);
router.get("/public-list", PublicInstitutionController.listActiveTenants);

export default router;
