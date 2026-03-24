const Joi = require("joi");

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const schoolIdParamSchema = Joi.object({
  school_id: Joi.number().integer().positive().required(),
});

const employeeBodySchema = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).required(),
  last_name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().trim().email({ tlds: { allow: false } }).allow(null, ""),
  employee_type: Joi.string().valid("teaching", "non-teaching").required(),
  school_id: Joi.number().integer().positive().required(),
});

const schoolBodySchema = Joi.object({
  school_name: Joi.string().trim().min(1).max(255).required(),
  school_code: Joi.string().trim().min(1).max(50).required(),
});

const userRoleBodySchema = Joi.object({
  role: Joi.string().valid("SUPER_ADMIN", "ADMIN", "DATA_ENCODER").required(),
});

const userStatusBodySchema = Joi.object({
  is_active: Joi.alternatives()
    .try(
      Joi.boolean(),
      Joi.number().valid(0, 1),
      Joi.string().valid("0", "1", "true", "false"),
    )
    .required(),
});

const userPasswordResetBodySchema = Joi.object({
  new_password: Joi.string().min(8).max(128).required(),
  admin_password: Joi.string().min(1).max(128).required(),
});

const userAdminCreateBodySchema = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).required(),
  last_name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string().trim().email({ tlds: { allow: false } }).required(),
  password: Joi.string().min(8).max(128).required(),
  school_name: Joi.string().trim().min(1).max(255).required(),
});

const usersQuerySchema = Joi.object({
  search: Joi.string().trim().max(255),
  role: Joi.string().valid("SUPER_ADMIN", "ADMIN", "DATA_ENCODER"),
  is_active: Joi.alternatives().try(
    Joi.number().valid(0, 1),
    Joi.string().valid("0", "1"),
  ),
});

const registrationStatusQuerySchema = Joi.object({
  status: Joi.string().valid("PENDING", "APPROVED", "REJECTED"),
});

const registrationApproveBodySchema = Joi.object({
  approved_role: Joi.string().valid("ADMIN", "DATA_ENCODER"),
  temporary_password: Joi.string().min(8).max(128),
  suppress_approved_email: Joi.alternatives().try(
    Joi.boolean(),
    Joi.string().valid("true", "false"),
  ),
});

const registrationRejectBodySchema = Joi.object({
  rejection_reason: Joi.string().trim().max(500).allow(null, ""),
});

module.exports = {
  idParamSchema,
  schoolIdParamSchema,
  employeeBodySchema,
  schoolBodySchema,
  userRoleBodySchema,
  userStatusBodySchema,
  userPasswordResetBodySchema,
  userAdminCreateBodySchema,
  usersQuerySchema,
  registrationStatusQuerySchema,
  registrationApproveBodySchema,
  registrationRejectBodySchema,
};