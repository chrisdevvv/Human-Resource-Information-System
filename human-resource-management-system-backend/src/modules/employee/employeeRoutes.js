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

const EMPLOYEE_READ_WRITE_ROLES = [
  "data-encoder",
  "data_encoder",
  "DATA_ENCODER",
  "admin",
  "ADMIN",
  "super-admin",
  "super_admin",
  "SUPER_ADMIN",
];
const EMPLOYEE_ADMIN_ROLES = [
  "admin",
  "ADMIN",
  "super-admin",
  "super_admin",
  "SUPER_ADMIN",
];
const EMPLOYEE_SUPER_ADMIN_ROLES = [
  "super-admin",
  "super_admin",
  "SUPER_ADMIN",
];

// Read operations - All authenticated users
router.get(
  "/",
  authMiddleware,
  roleAuthMiddleware(EMPLOYEE_READ_WRITE_ROLES),
  validateRequest({ query: employeeListQuerySchema }),
  getAllEmployees,
);
router.get(
  "/school/:school_id",
  authMiddleware,
  roleAuthMiddleware(EMPLOYEE_READ_WRITE_ROLES),
  validateRequest({ params: schoolIdParamSchema }),
  getEmployeesBySchool,
);
router.get(
  "/status-counts",
  authMiddleware,
  roleAuthMiddleware(EMPLOYEE_READ_WRITE_ROLES),
  validateRequest({ query: employeeStatusCountsQuerySchema }),
  getEmployeeStatusCounts,
);
router.get(
  "/:employee_id/salary-information",
  authMiddleware,
  roleAuthMiddleware(EMPLOYEE_READ_WRITE_ROLES),
  validateRequest({
    params: employeeIdParamSchema,
    query: salaryInformationListQuerySchema,
  }),
  getSalaryInformationByEmployee,
);
router.get(
  "/:employee_id/salary-information/:id",
  authMiddleware,
  roleAuthMiddleware(EMPLOYEE_READ_WRITE_ROLES),
  validateRequest({ params: salaryInformationIdParamSchema }),
  getSalaryInformationById,
);
router.get(
  "/:employee_id/salary-information/:id/step-increment-notice-pdf",
  authMiddleware,
  roleAuthMiddleware(EMPLOYEE_READ_WRITE_ROLES),
  validateRequest({ params: salaryInformationIdParamSchema }),
  getStepIncrementNoticePdf,
);
router.post(
  "/:employee_id/salary-information",
  authMiddleware,
  roleAuthMiddleware(EMPLOYEE_SUPER_ADMIN_ROLES),
  validateRequest({
    params: employeeIdParamSchema,
    body: salaryInformationCreateBodySchema,
  }),
  createSalaryInformation,
);
router.patch(
  "/:employee_id/salary-information/:id",
  authMiddleware,
  roleAuthMiddleware(EMPLOYEE_SUPER_ADMIN_ROLES),
  validateRequest({
    params: salaryInformationIdParamSchema,
    body: salaryInformationUpdateBodySchema,
  }),
  updateSalaryInformation,
);
router.delete(
  "/:employee_id/salary-information/:id",
  authMiddleware,
  roleAuthMiddleware(EMPLOYEE_SUPER_ADMIN_ROLES),
  validateRequest({ params: salaryInformationIdParamSchema }),
  deleteSalaryInformation,
);
router.get(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(EMPLOYEE_READ_WRITE_ROLES),
  validateRequest({ params: idParamSchema }),
  getEmployeeById,
);

// Write operations - Admin, Data Encoder, and Super Admin
router.post(
  "/",
  authMiddleware,
  roleAuthMiddleware(EMPLOYEE_READ_WRITE_ROLES),
  validateRequest({ body: employeeCreateBodySchema }),
  createEmployee,
);
router.put(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(EMPLOYEE_SUPER_ADMIN_ROLES),
  validateRequest({ params: idParamSchema, body: employeeUpdateBodySchema }),
  updateEmployee,
);
router.patch(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(EMPLOYEE_READ_WRITE_ROLES),
  validateRequest({ params: idParamSchema, body: employeePatchBodySchema }),
  updateEmployee,
);
router.delete(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(EMPLOYEE_READ_WRITE_ROLES),
  validateRequest({ params: idParamSchema }),
  deleteEmployee,
);
router.patch(
  "/:id/archive",
  authMiddleware,
  roleAuthMiddleware(EMPLOYEE_ADMIN_ROLES),
  validateRequest({ params: idParamSchema, body: employeeArchiveBodySchema }),
  archiveEmployee,
);
router.patch(
  "/:id/unarchive",
  authMiddleware,
  roleAuthMiddleware(EMPLOYEE_ADMIN_ROLES),
  validateRequest({ params: idParamSchema, body: employeeUnarchiveBodySchema }),
  unarchiveEmployee,
);
router.patch(
  "/:id/mark-on-leave",
  authMiddleware,
  roleAuthMiddleware(EMPLOYEE_ADMIN_ROLES),
  validateRequest({
    params: idParamSchema,
    body: employeeMarkOnLeaveBodySchema,
  }),
  markEmployeeOnLeave,
);
router.patch(
  "/:id/mark-available",
  authMiddleware,
  roleAuthMiddleware(EMPLOYEE_ADMIN_ROLES),
  validateRequest({ params: idParamSchema }),
  markEmployeeAvailable,
);

module.exports = router;
