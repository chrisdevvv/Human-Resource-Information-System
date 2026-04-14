const Joi = require("joi");

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

const schoolIdParamSchema = Joi.object({
  school_id: Joi.number().integer().positive().required(),
});

const birthdateSchema = Joi.date().iso().max("now");
const firstAppointmentDateSchema = Joi.date().iso().max("now");
const noMiddleNameSchema = Joi.alternatives().try(
  Joi.boolean(),
  Joi.string().valid("true", "false", "1", "0"),
  Joi.number().valid(0, 1),
);

const middleNameSchema = Joi.string().trim().max(100).allow(null, "");
const middleInitialSchema = Joi.string().trim().max(10).allow(null, "");
const mobileNumberSchema = Joi.string().trim().max(30).allow(null, "");
const homeAddressSchema = Joi.string().trim().max(255).allow(null, "");
const placeOfBirthSchema = Joi.string().trim().max(255).allow(null, "");
const civilStatusSchema = Joi.string().trim().max(50).allow(null, "");
const sexSchema = Joi.string().trim().max(20).allow(null, "");
const employeeNoSchema = Joi.string().trim().max(100).allow(null, "");
const workEmailSchema = Joi.string()
  .trim()
  .lowercase()
  .email({ tlds: { allow: false } })
  .allow(null, "");
const districtSchema = Joi.string().trim().max(255).allow(null, "");
const positionSchema = Joi.string().trim().max(255).allow(null, "");
const plantillaNoSchema = Joi.string().trim().max(100).allow(null, "");
const prcLicenseNoSchema = Joi.string().trim().max(100).allow(null, "");
const tinSchema = Joi.string().trim().max(50).allow(null, "");
const gsisBpNoSchema = Joi.string().trim().max(50).allow(null, "");
const gsisCrnNoSchema = Joi.string().trim().max(50).allow(null, "");
const pagibigNoSchema = Joi.string().trim().max(50).allow(null, "");
const philhealthNoSchema = Joi.string().trim().max(50).allow(null, "");
const ageSchema = Joi.number().integer().min(0).max(150).allow(null);
const employeeTypeSchema = Joi.string()
  .trim()
  .lowercase()
  .valid("teaching", "non-teaching", "teaching-related", "teaching related")
  .required();

const requiredMiddleNameWhenApplicable = middleNameSchema.when(
  "no_middle_name",
  {
    is: Joi.alternatives().try(
      Joi.boolean().valid(true),
      Joi.string().valid("true", "1"),
      Joi.number().valid(1),
    ),
    then: middleNameSchema,
    otherwise: Joi.string().trim().min(1).max(100).required(),
  },
);

const employeeCreateBodySchema = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).required(),
  middle_name: requiredMiddleNameWhenApplicable,
  no_middle_name: noMiddleNameSchema,
  last_name: Joi.string().trim().min(1).max(100).required(),
  middle_initial: middleInitialSchema,
  personal_email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .allow(null, ""),
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .allow(null, ""),
  mobile_number: mobileNumberSchema,
  home_address: homeAddressSchema,
  place_of_birth: placeOfBirthSchema,
  civil_status: civilStatusSchema,
  civil_status_id: Joi.number().integer().positive().allow(null, ""),
  sex: sexSchema,
  sex_id: Joi.number().integer().positive().allow(null, ""),
  employee_type: employeeTypeSchema,
  school_id: Joi.number().integer().positive().required(),
  employee_no: employeeNoSchema,
  work_email: workEmailSchema,
  district: districtSchema,
  work_district: districtSchema,
  position: positionSchema,
  position_id: Joi.number().integer().positive().allow(null, ""),
  plantilla_no: plantillaNoSchema,
  prc_license_no: prcLicenseNoSchema,
  tin: tinSchema,
  gsis_bp_no: gsisBpNoSchema,
  gsis_crn_no: gsisCrnNoSchema,
  pagibig_no: pagibigNoSchema,
  philhealth_no: philhealthNoSchema,
  birthdate: birthdateSchema.required(),
  date_of_first_appointment: firstAppointmentDateSchema.allow(null, ""),
  age: ageSchema,
});

const employeeUpdateBodySchema = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).required(),
  middle_name: requiredMiddleNameWhenApplicable,
  no_middle_name: noMiddleNameSchema,
  last_name: Joi.string().trim().min(1).max(100).required(),
  middle_initial: middleInitialSchema,
  personal_email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .allow(null, ""),
  email: Joi.string()
    .trim()
    .lowercase()
    .email({ tlds: { allow: false } })
    .allow(null, ""),
  mobile_number: mobileNumberSchema,
  home_address: homeAddressSchema,
  place_of_birth: placeOfBirthSchema,
  civil_status: civilStatusSchema,
  civil_status_id: Joi.number().integer().positive().allow(null, ""),
  sex: sexSchema,
  sex_id: Joi.number().integer().positive().allow(null, ""),
  employee_type: employeeTypeSchema,
  school_id: Joi.number().integer().positive().required(),
  employee_no: employeeNoSchema,
  work_email: workEmailSchema,
  district: districtSchema,
  work_district: districtSchema,
  position: positionSchema,
  position_id: Joi.number().integer().positive().allow(null, ""),
  plantilla_no: plantillaNoSchema,
  prc_license_no: prcLicenseNoSchema,
  tin: tinSchema,
  gsis_bp_no: gsisBpNoSchema,
  gsis_crn_no: gsisCrnNoSchema,
  pagibig_no: pagibigNoSchema,
  philhealth_no: philhealthNoSchema,
  birthdate: birthdateSchema.allow(null),
  date_of_first_appointment: firstAppointmentDateSchema.allow(null, ""),
  age: ageSchema,
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

const civilStatusBodySchema = Joi.object({
  civil_status_name: Joi.string().trim().min(1).max(50).required(),
});

const districtBodySchema = Joi.object({
  district_name: Joi.string().trim().min(1).max(50).required(),
});

const archivingReasonBodySchema = Joi.object({
  reason_name: Joi.string().trim().min(1).max(255).required(),
});

const positionBodySchema = Joi.object({
  position_name: Joi.string().trim().min(1).max(255).required(),
});

const sexBodySchema = Joi.object({
  sex_name: Joi.string().trim().min(1).max(20).required(),
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
  birthdate: birthdateSchema.required(),
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
  search: Joi.string().trim().max(255),
  page: Joi.number().integer().min(1),
  pageSize: Joi.number().integer().min(1).max(200),
});

const authRegisterBodySchema = Joi.object({
  first_name: Joi.string().trim().min(1).max(100).required(),
  middle_name: requiredMiddleNameWhenApplicable,
  no_middle_name: noMiddleNameSchema,
  last_name: Joi.string().trim().min(1).max(100).required(),
  email: Joi.string()
    .trim()
    .email({ tlds: { allow: false } })
    .required(),
  password: Joi.string().min(8).max(128).required(),
  school_name: Joi.string().trim().min(1).max(255).required(),
  requested_role: Joi.string().valid("ADMIN", "DATA_ENCODER").optional(),
  birthdate: birthdateSchema.required(),
  suppress_pending_email: Joi.alternatives().try(
    Joi.boolean(),
    Joi.string().valid("true", "false"),
  ),
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
  archive_reason: Joi.string().trim().min(1).max(500).required(),
});

const employeeUnarchiveBodySchema = Joi.object({
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
  ids: Joi.array().items(Joi.number().integer().positive()).min(1).optional(),
});

module.exports = {
  idParamSchema,
  schoolIdParamSchema,
  employeeCreateBodySchema,
  employeeUpdateBodySchema,
  employeeListQuerySchema,
  employeeMarkOnLeaveBodySchema,
  employeeStatusCountsQuerySchema,
  employeeArchiveBodySchema,
  employeeUnarchiveBodySchema,
  schoolBodySchema,
  civilStatusBodySchema,
  districtBodySchema,
  archivingReasonBodySchema,
  positionBodySchema,
  sexBodySchema,
  userRoleBodySchema,
  userStatusBodySchema,
  userPasswordResetBodySchema,
  userAdminCreateBodySchema,
  usersQuerySchema,
  authRegisterBodySchema,
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
