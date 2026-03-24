const express = require("express");
const {
	getAllSchools,
	getSchoolById,
	createSchool,
	updateSchool,
	deleteSchool,
} = require("./schoolController");
const authMiddleware = require("../../middleware/authMiddleware");
const { roleAuthMiddleware } = require("../../middleware/roleAuthMiddleware");
const { validateRequest } = require("../../middleware/validateRequest");
const {
	idParamSchema,
	schoolBodySchema,
} = require("../../validation/schemas");

const router = express.Router();

// Read operations - All authenticated users
router.get(
	"/",
	authMiddleware,
	roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
	getAllSchools,
);
router.get(
	"/:id",
	authMiddleware,
	roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
	validateRequest({ params: idParamSchema }),
	getSchoolById,
);

// Write operations - Admin and Super Admin only
router.post(
	"/",
	authMiddleware,
	roleAuthMiddleware(["admin", "super-admin"]),
	validateRequest({ body: schoolBodySchema }),
	createSchool,
);
router.put(
	"/:id",
	authMiddleware,
	roleAuthMiddleware(["admin", "super-admin"]),
	validateRequest({ params: idParamSchema, body: schoolBodySchema }),
	updateSchool,
);
router.delete(
	"/:id",
	authMiddleware,
	roleAuthMiddleware(["admin", "super-admin"]),
	validateRequest({ params: idParamSchema }),
	deleteSchool,
);

module.exports = router;
