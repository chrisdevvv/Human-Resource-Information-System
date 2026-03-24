const express = require("express");
const {
  getAllEmployees,
  getEmployeeById,
  getEmployeesBySchool,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require("./employeeController");
const authMiddleware = require("../../middleware/authMiddleware");
const { roleAuthMiddleware } = require("../../middleware/roleAuthMiddleware");
const { validateRequest } = require("../../middleware/validateRequest");
const {
  idParamSchema,
  schoolIdParamSchema,
  employeeBodySchema,
} = require("../../validation/schemas");

const router = express.Router();

// Read operations - All authenticated users
router.get(
  "/",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  getAllEmployees,
);
router.get(
  "/school/:school_id",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  validateRequest({ params: schoolIdParamSchema }),
  getEmployeesBySchool,
);
router.get(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  validateRequest({ params: idParamSchema }),
  getEmployeeById,
);

// Write operations - Admin and Super Admin only
router.post(
  "/",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  validateRequest({ body: employeeBodySchema }),
  createEmployee,
);
router.put(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  validateRequest({ params: idParamSchema, body: employeeBodySchema }),
  updateEmployee,
);
router.delete(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  validateRequest({ params: idParamSchema }),
  deleteEmployee,
);

module.exports = router;
