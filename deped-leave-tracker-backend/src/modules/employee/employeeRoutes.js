const express = require("express");
const {
  getAllEmployees,
  getEmployeeById,
  getEmployeesBySchool,
  getEmployeeStatusCounts,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  archiveEmployee,
  unarchiveEmployee,
  markEmployeeOnLeave,
  markEmployeeAvailable,
} = require("./employeeController");
const authMiddleware = require("../../middleware/authMiddleware");
const { roleAuthMiddleware } = require("../../middleware/roleAuthMiddleware");
const { validateRequest } = require("../../middleware/validateRequest");
const {
  idParamSchema,
  schoolIdParamSchema,
  employeeBodySchema,
  employeeListQuerySchema,
  employeeMarkOnLeaveBodySchema,
  employeeStatusCountsQuerySchema,
  employeeArchiveBodySchema,
} = require("../../validation/schemas");

const router = express.Router();

// Read operations - All authenticated users
router.get(
  "/",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  validateRequest({ query: employeeListQuerySchema }),
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
  "/status-counts",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  validateRequest({ query: employeeStatusCountsQuerySchema }),
  getEmployeeStatusCounts,
);
router.get(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  validateRequest({ params: idParamSchema }),
  getEmployeeById,
);

// Write operations - Admin, Data Encoder, and Super Admin
router.post(
  "/",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  validateRequest({ body: employeeBodySchema }),
  createEmployee,
);
router.put(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  validateRequest({ params: idParamSchema, body: employeeBodySchema }),
  updateEmployee,
);
router.delete(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  validateRequest({ params: idParamSchema }),
  deleteEmployee,
);
router.patch(
  "/:id/archive",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  validateRequest({ params: idParamSchema, body: employeeArchiveBodySchema }),
  archiveEmployee,
);
router.patch(
  "/:id/unarchive",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  validateRequest({ params: idParamSchema, body: employeeArchiveBodySchema }),
  unarchiveEmployee,
);
router.patch(
  "/:id/mark-on-leave",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  validateRequest({
    params: idParamSchema,
    body: employeeMarkOnLeaveBodySchema,
  }),
  markEmployeeOnLeave,
);
router.patch(
  "/:id/mark-available",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  validateRequest({ params: idParamSchema }),
  markEmployeeAvailable,
);

module.exports = router;
