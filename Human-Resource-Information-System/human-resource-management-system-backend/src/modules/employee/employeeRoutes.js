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
const {
  getSalaryInformationByEmployee,
  getSalaryInformationById,
  getStepIncrementNoticePdf,
  createSalaryInformation,
  updateSalaryInformation,
  deleteSalaryInformation,
} = require("./salaryInformationController");
const authMiddleware = require("../../middleware/authMiddleware");
const { roleAuthMiddleware } = require("../../middleware/roleAuthMiddleware");
const { validateRequest } = require("../../middleware/validateRequest");
const {
  idParamSchema,
  schoolIdParamSchema,
  employeeIdParamSchema,
  salaryInformationIdParamSchema,
  employeeCreateBodySchema,
  employeeUpdateBodySchema,
  employeePatchBodySchema,
  employeeListQuerySchema,
  employeeMarkOnLeaveBodySchema,
  employeeStatusCountsQuerySchema,
  salaryInformationListQuerySchema,
  salaryInformationCreateBodySchema,
  salaryInformationUpdateBodySchema,
  employeeArchiveBodySchema,
  employeeUnarchiveBodySchema,
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
  "/:employee_id/salary-information",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  validateRequest({
    params: employeeIdParamSchema,
    query: salaryInformationListQuerySchema,
  }),
  getSalaryInformationByEmployee,
);
router.get(
  "/:employee_id/salary-information/:id",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  validateRequest({ params: salaryInformationIdParamSchema }),
  getSalaryInformationById,
);
router.get(
  "/:employee_id/salary-information/:id/step-increment-notice-pdf",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  validateRequest({ params: salaryInformationIdParamSchema }),
  getStepIncrementNoticePdf,
);
router.post(
  "/:employee_id/salary-information",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  validateRequest({
    params: employeeIdParamSchema,
    body: salaryInformationCreateBodySchema,
  }),
  createSalaryInformation,
);
router.patch(
  "/:employee_id/salary-information/:id",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  validateRequest({
    params: salaryInformationIdParamSchema,
    body: salaryInformationUpdateBodySchema,
  }),
  updateSalaryInformation,
);
router.delete(
  "/:employee_id/salary-information/:id",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  validateRequest({ params: salaryInformationIdParamSchema }),
  deleteSalaryInformation,
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
  validateRequest({ body: employeeCreateBodySchema }),
  createEmployee,
);
router.put(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["super-admin"]),
  validateRequest({ params: idParamSchema, body: employeeUpdateBodySchema }),
  updateEmployee,
);
router.patch(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["data-encoder", "admin", "super-admin"]),
  validateRequest({ params: idParamSchema, body: employeePatchBodySchema }),
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
  validateRequest({ params: idParamSchema, body: employeeUnarchiveBodySchema }),
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
