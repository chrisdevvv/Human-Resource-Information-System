const express = require("express");
const {
  register,
  login,
  verifyPassword,
  changePassword,
  logout,
  forgotPassword,
  verifyOldPassword,
  resetPassword,
} = require("./authController");
const authMiddleware = require("../../middleware/authMiddleware");
const { validateRequest } = require("../../middleware/validateRequest");
const { authRegisterBodySchema } = require("../../validation/schemas");

const router = express.Router();

router.post(
  "/register",
  validateRequest({ body: authRegisterBodySchema }),
  register,
);
router.post("/login", login);
router.post("/verify-password", authMiddleware, verifyPassword);
router.patch("/change-password", authMiddleware, changePassword);
router.post("/logout", authMiddleware, logout);
router.post("/forgot-password", forgotPassword);
router.post("/verify-old-password", verifyOldPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
