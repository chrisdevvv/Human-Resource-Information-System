const express = require("express");
const {
  getAllBacklogs,
  getBacklogById,
  getBacklogsByUser,
  getBacklogsBySchool,
  createBacklog,
  generateBacklogReport,
  archiveBacklogsByDateRange,
} = require("./backlogController");
const authMiddleware = require("../../middleware/authMiddleware");
const { roleAuthMiddleware } = require("../../middleware/roleAuthMiddleware");
const { validateRequest } = require("../../middleware/validateRequest");
const {
  idParamSchema,
  backlogReportQuerySchema,
  backlogArchiveBodySchema,
} = require("../../validation/schemas");

const router = express.Router();

// Backlogs - Admin and Super Admin only
router.get(
  "/",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  getAllBacklogs,
);
router.get(
  "/report",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  validateRequest({ query: backlogReportQuerySchema }),
  generateBacklogReport,
);
router.get(
  "/user/:user_id",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  getBacklogsByUser,
);
router.get(
  "/school/:school_id",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  getBacklogsBySchool,
);
router.get(
  "/:id",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  validateRequest({ params: idParamSchema }),
  getBacklogById,
);
router.post(
  "/",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  createBacklog,
);
router.patch(
  "/archive",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  validateRequest({ body: backlogArchiveBodySchema }),
  archiveBacklogsByDateRange,
);

module.exports = router;
