// src/middleware/auth.js
import jwt from "jsonwebtoken";
import { Patient, Staff, Role, Permission } from "../models/index.js";
import Receptionist from "../models/Receptionist/Receptionist.js"; // ✅ Import Receptionist model

/**
 * Main authentication middleware
 * Supports Patient, Staff, and Receptionist
 */
export const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    if (!payload.id || !payload.userType) {
      return res.status(401).json({ error: "Invalid token structure" });
    }

    let user;

    // ✅ PATIENT authentication
    if (payload.userType === "PATIENT") {
      user = await Patient.findById(payload.id);
      if (!user || user.isActive === false) {
        return res.status(401).json({ error: "Patient not found or inactive" });
      }
    }

    // ✅ RECEPTIONIST authentication
    else if (payload.userType === "RECEPTIONIST") {
      user = await Receptionist.findById(payload.id);
      if (!user || user.isActive === false) {
        return res.status(401).json({ error: "RECEPTIONIST not found or inactive" });
      }
    }

    // ✅ STAFF authentication
    else if (payload.userType === "STAFF") {
      user = await Staff.findById(payload.id);
      if (!user || user.isActive === false) {
        return res.status(401).json({ error: "STAFF not found or inactive" });
      }
    }

    // ❌ Unknown userType
    else {
      return res.status(401).json({ error: "Invalid user type" });
    }

    // ✅ Attach user to request
    req.user = {
      id: user._id,
      userType: payload.userType,
      role: payload.role,
      email: user.email,
      fullName: user.fullName || user.name, // fallback for Receptionist model
      hospitalId: user.hospital?._id,
      departmentId: user.department?._id
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({ error: "Invalid token" });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired" });
    }
    console.error("Auth Error:", error);
    return res.status(401).json({ error: "Authentication failed" });
  }
};

/**
 * Middleware to check if user is a patient
 */
export const requirePatient = (req, res, next) => {
  if (req.user.userType !== "PATIENT") {
    return res.status(403).json({ error: "Patient access required" });
  }
  next();
};

/**
 * Middleware to check if user is staff or receptionist
 */
export const requireStaff = (req, res, next) => {
  if (!["STAFF", "RECEPTIONIST"].includes(req.user.userType)) {
    return res.status(403).json({ error: "Staff access required" });
  }
  next();
};

/**
 * Middleware for receptionist only
 */
export const requireReceptionist = (req, res, next) => {
  if (req.user.userType !== "RECEPTIONIST") {
    return res.status(403).json({ error: "Receptionist access required" });
  }
  next();
};

/**
 * Middleware to check specific staff roles
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!["STAFF", "RECEPTIONIST"].includes(req.user.userType)) {
      return res.status(403).json({ error: "Staff access required" });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        requiredRoles: allowedRoles,
        yourRole: req.user.role
      });
    }
    next();
  };
};

/**
 * Middleware to check specific permissions
 */
export const requirePermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      if (req.user.userType === "PATIENT") {
        const patientPermissions = [
          "READ_OWN_PATIENT",
          "UPDATE_OWN_PATIENT",
          "READ_OWN_APPOINTMENT",
          "CREATE_APPOINTMENT",
          "CANCEL_OWN_APPOINTMENT",
          "READ_OWN_RECORD",
          "READ_OWN_PAYMENT"
        ];
        if (!patientPermissions.includes(requiredPermission)) {
          return res.status(403).json({ error: "Insufficient permissions" });
        }
        return next();
      }

      // Staff/Receptionist permission check
      const role = await Role.findOne({ name: req.user.role }).populate("permissions");
      if (!role) {
        return res.status(403).json({ error: "Role not found" });
      }
      const hasPermission = role.permissions.some(
        (p) => p.name === requiredPermission && p.isActive
      );
      if (!hasPermission) {
        return res.status(403).json({
          error: "Insufficient permissions",
          required: requiredPermission,
          yourRole: req.user.role
        });
      }
      next();
    } catch (error) {
      return res.status(500).json({ error: "Permission check failed" });
    }
  };
};

/**
 * Middleware to check resource-action permission
 */
export const requireResourcePermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      if (req.user.userType === "PATIENT") {
        const allowedActions = {
          PATIENT: ["READ", "UPDATE"],
          APPOINTMENT: ["READ", "CREATE", "DELETE"],
          RECORD: ["READ"],
          PAYMENT: ["READ"]
        };
        if (!allowedActions[resource]?.includes(action)) {
          return res.status(403).json({ error: "Insufficient permissions" });
        }
        return next();
      }

      // Staff/Receptionist check
      const role = await Role.findOne({ name: req.user.role }).populate("permissions");
      if (!role) return res.status(403).json({ error: "Role not found" });

      const hasPermission = role.permissions.some(
        (p) => p.resource === resource && p.action === action && p.isActive
      );
      if (!hasPermission) {
        return res.status(403).json({
          error: "Insufficient permissions",
          required: `${action} on ${resource}`,
          yourRole: req.user.role
        });
      }
      next();
    } catch (error) {
      return res.status(500).json({ error: "Permission check failed" });
    }
  };
};

/**
 * Middleware to check if staff belongs to specific hospital
 */
export const requireHospital = (req, res, next) => {
  if (!["STAFF", "RECEPTIONIST"].includes(req.user.userType)) return next();
  const hospitalId = req.params.hospitalId || req.body.hospital;
  if (!hospitalId) return next();
  if (req.user.hospitalId?.toString() !== hospitalId.toString()) {
    return res.status(403).json({
      error: "Access denied: You can only access data from your hospital"
    });
  }
  next();
};

/**
 * Combine multiple middleware
 */
export const combineMiddleware = (middlewares) => {
  return (req, res, next) => {
    const executeMiddleware = (index) => {
      if (index >= middlewares.length) return next();
      middlewares[index](req, res, (err) => {
        if (err) return next(err);
        executeMiddleware(index + 1);
      });
    };
    executeMiddleware(0);
  };
};

// Legacy export
export const auth = authenticate;
