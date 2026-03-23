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
  getEmployeesBySchool,
);
router.get(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  getEmployeeById,
);

// Write operations - Admin and Super Admin only
router.post(
  "/",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  createEmployee,
);
router.put(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  updateEmployee,
);
router.delete(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  deleteEmployee,
);

module.exports = router;
