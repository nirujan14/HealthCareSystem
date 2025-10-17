// Central export file for all models
// Path: src/models/index.js

export { default as Patient } from "./Patient.js";
export { default as Staff } from "./Staff.js";
export { default as Receptionist } from "./Receptionist/Receptionist.js"; 
export { default as Hospital } from "./Hospital.js";
export { default as Department } from "./Department.js";
export { default as Appointment } from "./Appointment.js";
export { default as Record } from "./Record.js";
export { default as Payment } from "./Payment.js";
export { Permission, Role, UserRole } from "./RolePermission.js";
export { AuditLog, Notification } from "./AuditNotification.js";