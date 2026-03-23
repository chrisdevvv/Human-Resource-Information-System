const express = require("express");
const {
  getAllBacklogs,
  getBacklogById,
  getBacklogsByUser,
  getBacklogsBySchool,
  createBacklog,
} = require("./backlogController");
const authMiddleware = require("../../middleware/authMiddleware");
const { roleAuthMiddleware } = require("../../middleware/roleAuthMiddleware");

const router = express.Router();

// Backlogs - Admin and Super Admin only
router.get(
  "/",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  getAllBacklogs,
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
  getBacklogById,
);
router.post(
  "/",
  authMiddleware,
  roleAuthMiddleware(["admin", "super-admin"]),
  createBacklog,
);

module.exports = router;
