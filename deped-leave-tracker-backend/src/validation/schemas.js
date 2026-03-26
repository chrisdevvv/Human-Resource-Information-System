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
  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .allow(null, ""),
  employee_type: Joi.string().valid("teaching", "non-teaching").required(),
  school_id: Joi.number().integer().positive().required(),
});

const employeeListQuerySchema = Joi.object({
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1).max(200),
  include_archived: Joi.alternatives().try(
    Joi.boolean(),
    Joi.string().valid("true", "false", "1", "0"),
    Joi.number().valid(0, 1),
  ),
  on_leave: Joi.alternatives().try(
    Joi.boolean(),
    Joi.string().valid("true", "false", "1", "0"),
    Joi.number().valid(0, 1),
  ),
});

const employeeMarkOnLeaveBodySchema = Joi.object({
  on_leave_from: Joi.date().iso(),
  on_leave_until: Joi.date().iso().min(Joi.ref("on_leave_from")),
  reason: Joi.string().trim().max(500).allow(null, ""),
});

const employeeStatusCountsQuerySchema = Joi.object({
  school_id: Joi.number().integer().positive(),
  include_archived: Joi.alternatives().try(
    Joi.boolean(),
    Joi.string().valid("true", "false", "1", "0"),
    Joi.number().valid(0, 1),
  ),
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
  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .required(),
  password: Joi.string().min(8).max(128).required(),
  school_name: Joi.string().trim().min(1).max(255),
});

const usersQuerySchema = Joi.object({
  search: Joi.string().trim().max(255),
  role: Joi.string().valid("SUPER_ADMIN", "ADMIN", "DATA_ENCODER"),
  school_id: Joi.number().integer().positive(),
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

const employeeArchiveBodySchema = Joi.object({
  password: Joi.string().min(1).max(128).required(),
});

const leaveParticularBodySchema = Joi.object({
  particular: Joi.string().trim().min(1).max(255).required(),
});

const leaveParticularUpdateBodySchema = Joi.object({
  old_particular: Joi.string().trim().min(1).max(255).required(),
  new_particular: Joi.string().trim().min(1).max(255).required(),
});

const leaveParticularDeleteBodySchema = Joi.object({
  particular: Joi.string().trim().min(1).max(255).required(),
});

const leaveBodySchema = Joi.object({
  employee_id: Joi.number().integer().positive().required(),
  period_of_leave: Joi.string().trim().min(1).max(255).required(),
  particulars: Joi.string().trim().max(255).allow(null, ""),
  earned_vl: Joi.number().min(0).allow(null),
  abs_with_pay_vl: Joi.number().min(0).allow(null),
  abs_without_pay_vl: Joi.number().min(0).allow(null),
  earned_sl: Joi.number().min(0).allow(null),
  abs_with_pay_sl: Joi.number().min(0).allow(null),
  abs_without_pay_sl: Joi.number().min(0).allow(null),
});

const leaveUpdateBodySchema = Joi.object({
  period_of_leave: Joi.string().trim().min(1).max(255),
  particulars: Joi.string().trim().max(255).allow(null, ""),
  earned_vl: Joi.number().min(0).allow(null),
  abs_with_pay_vl: Joi.number().min(0).allow(null),
  abs_without_pay_vl: Joi.number().min(0).allow(null),
  earned_sl: Joi.number().min(0).allow(null),
  abs_with_pay_sl: Joi.number().min(0).allow(null),
  abs_without_pay_sl: Joi.number().min(0).allow(null),
});

const backlogReportQuerySchema = Joi.object({
  format: Joi.string().valid("json", "csv", "pdf").default("json"),
  from: Joi.date().iso(),
  to: Joi.date().iso(),
  action: Joi.string().trim().max(100),
  user_id: Joi.number().integer().positive(),
  school_id: Joi.number().integer().positive(),
  employee_id: Joi.number().integer().positive(),
  leave_id: Joi.number().integer().positive(),
  include_archived: Joi.alternatives().try(
    Joi.boolean(),
    Joi.string().valid("true", "false", "1", "0"),
    Joi.number().valid(0, 1),
  ),
});

const backlogArchiveBodySchema = Joi.object({
  from: Joi.date().iso().required(),
  to: Joi.date().iso().required(),
});

module.exports = {
  idParamSchema,
  schoolIdParamSchema,
  employeeBodySchema,
  employeeListQuerySchema,
  employeeMarkOnLeaveBodySchema,
  employeeStatusCountsQuerySchema,
  employeeArchiveBodySchema,
  schoolBodySchema,
  userRoleBodySchema,
  userStatusBodySchema,
  userPasswordResetBodySchema,
  userAdminCreateBodySchema,
  usersQuerySchema,
  registrationStatusQuerySchema,
  registrationApproveBodySchema,
  registrationRejectBodySchema,
  leaveParticularBodySchema,
  leaveParticularUpdateBodySchema,
  leaveParticularDeleteBodySchema,
  leaveBodySchema,
  leaveUpdateBodySchema,
  backlogReportQuerySchema,
  backlogArchiveBodySchema,
};
