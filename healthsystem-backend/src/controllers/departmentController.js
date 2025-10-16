// Department Management Controller
// Path: src/controllers/departmentController.js

import { Department, Hospital, Staff, AuditLog } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * Create new department
 * POST /departments
 * @access Private (Admin, Manager)
 */
export const createDepartment = asyncHandler(async (req, res) => {
  const {
    hospital,
    name,
    code,
    description,
    category,
    location,
    contact,
    operatingHours,
    bedsAllocated,
    equipmentList
  } = req.body;

  // Validation
  if (!hospital || !name || !code) {
    return res.status(400).json({ 
      error: "Hospital, name, and code are required" 
    });
  }

  // Check if hospital exists
  const hospitalExists = await Hospital.findById(hospital);
  if (!hospitalExists) {
    return res.status(404).json({ error: "Hospital not found" });
  }

  // Check if department code already exists in this hospital
  const existing = await Department.findOne({ 
    hospital, 
    code: code.toUpperCase() 
  });
  
  if (existing) {
    return res.status(400).json({ 
      error: "Department code already exists in this hospital" 
    });
  }

  // Create department
  const department = await Department.create({
    hospital,
    name,
    code: code.toUpperCase(),
    description,
    category,
    location,
    contact,
    operatingHours,
    bedsAllocated: bedsAllocated || 0,
    equipmentList: equipmentList || []
  });

  // Populate hospital details
  await department.populate("hospital", "name hospitalId type");

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "CREATE",
    resource: "DEPARTMENT",
    resourceId: department._id,
    details: { code: department.code, name: department.name, hospital: hospitalExists.name },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: hospital,
    status: "SUCCESS"
  });

  res.status(201).json({
    message: "Department created successfully",
    department
  });
});

/**
 * Get all departments
 * GET /departments?hospital=xxx&category=CARDIOLOGY&page=1&limit=20
 * @access Public
 */
export const listDepartments = asyncHandler(async (req, res) => {
  const { 
    hospital, 
    category, 
    isActive,
    page = 1, 
    limit = 20 
  } = req.query;

  const skip = (page - 1) * limit;
  const query = {};

  // Filters
  if (hospital) query.hospital = hospital;
  if (category) query.category = category;
  if (isActive !== undefined) query.isActive = isActive === "true";

  const [departments, total] = await Promise.all([
    Department.find(query)
      .populate("hospital", "name hospitalId type address")
      .populate("headOfDepartment", "fullName staffId role specialization")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 }),
    Department.countDocuments(query)
  ]);

  res.json({
    departments,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  });
});

/**
 * Get department by ID
 * GET /departments/:id
 * @access Public
 */
export const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id)
    .populate("hospital", "name hospitalId type address contact")
    .populate("headOfDepartment", "fullName staffId role specialization phone email avatarUrl");

  if (!department) {
    return res.status(404).json({ error: "Department not found" });
  }

  // Get staff count
  const staffCount = await Staff.countDocuments({ 
    department: department._id,
    isActive: true 
  });

  // Get staff by role
  const staffByRole = await Staff.aggregate([
    { 
      $match: { 
        department: department._id,
        isActive: true 
      } 
    },
    { 
      $group: { 
        _id: "$role", 
        count: { $sum: 1 } 
      } 
    }
  ]);

  res.json({
    ...department.toObject(),
    stats: {
      totalStaff: staffCount,
      staffByRole: staffByRole.reduce((acc, { _id, count }) => {
        acc[_id] = count;
        return acc;
      }, {})
    }
  });
});

/**
 * Update department
 * PATCH /departments/:id
 * @access Private (Manager, Admin)
 */
export const updateDepartment = asyncHandler(async (req, res) => {
  const updatable = [
    "name",
    "description",
    "category",
    "headOfDepartment",
    "location",
    "contact",
    "operatingHours",
    "bedsAllocated",
    "equipmentList",
    "isActive"
  ];

  const patch = {};
  updatable.forEach((key) => {
    if (req.body[key] !== undefined) {
      patch[key] = req.body[key];
    }
  });

  // If assigning head of department, verify staff exists and is eligible
  if (patch.headOfDepartment) {
    const staff = await Staff.findById(patch.headOfDepartment);
    if (!staff) {
      return res.status(404).json({ error: "Staff not found" });
    }
    if (!["DOCTOR", "MANAGER"].includes(staff.role)) {
      return res.status(400).json({ 
        error: "Only doctors or managers can be head of department" 
      });
    }
  }

  const department = await Department.findByIdAndUpdate(
    req.params.id,
    patch,
    { new: true, runValidators: true }
  )
  .populate("hospital", "name hospitalId")
  .populate("headOfDepartment", "fullName staffId role");

  if (!department) {
    return res.status(404).json({ error: "Department not found" });
  }

  // Update staff count in department
  const staffCount = await Staff.countDocuments({ 
    department: department._id,
    isActive: true 
  });
  department.staffCount = staffCount;
  await department.save();

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "UPDATE",
    resource: "DEPARTMENT",
    resourceId: department._id,
    details: { fields: Object.keys(patch) },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: department.hospital._id,
    status: "SUCCESS"
  });

  res.json({
    message: "Department updated successfully",
    department
  });
});

/**
 * Delete/Deactivate department
 * DELETE /departments/:id
 * @access Private (Admin only)
 */
export const deleteDepartment = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id);

  if (!department) {
    return res.status(404).json({ error: "Department not found" });
  }

  // Check if department has active staff
  const activeStaffCount = await Staff.countDocuments({ 
    department: department._id,
    isActive: true 
  });

  if (activeStaffCount > 0) {
    return res.status(400).json({ 
      error: `Cannot deactivate department with ${activeStaffCount} active staff members. Please reassign them first.` 
    });
  }

  // Soft delete - just deactivate
  department.isActive = false;
  await department.save();

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "DELETE",
    resource: "DEPARTMENT",
    resourceId: department._id,
    details: { action: "deactivate", code: department.code },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: department.hospital,
    status: "SUCCESS"
  });

  res.json({ 
    message: "Department deactivated successfully",
    department 
  });
});

/**
 * Get departments by hospital
 * GET /departments/hospital/:hospitalId
 * @access Public
 */
export const getDepartmentsByHospital = asyncHandler(async (req, res) => {
  const { hospitalId } = req.params;
  const { category, isActive } = req.query;

  // Find hospital
  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    return res.status(404).json({ error: "Hospital not found" });
  }

  const query = { hospital: hospitalId };
  if (category) query.category = category;
  if (isActive !== undefined) query.isActive = isActive === "true";

  const departments = await Department.find(query)
    .populate("headOfDepartment", "fullName staffId role specialization")
    .sort({ name: 1 });

  res.json({
    hospital: {
      id: hospital._id,
      name: hospital.name,
      hospitalId: hospital.hospitalId
    },
    departments
  });
});

/**
 * Assign head of department
 * PATCH /departments/:id/assign-head
 * @access Private (Manager, Admin)
 */
export const assignHeadOfDepartment = asyncHandler(async (req, res) => {
  const { staffId } = req.body;

  if (!staffId) {
    return res.status(400).json({ error: "Staff ID required" });
  }

  const department = await Department.findById(req.params.id);
  if (!department) {
    return res.status(404).json({ error: "Department not found" });
  }

  // Verify staff exists and is eligible
  const staff = await Staff.findById(staffId)
    .populate("hospital department");

  if (!staff) {
    return res.status(404).json({ error: "Staff not found" });
  }

  if (!["DOCTOR", "MANAGER"].includes(staff.role)) {
    return res.status(400).json({ 
      error: "Only doctors or managers can be head of department" 
    });
  }

  // Verify staff belongs to the same hospital
  if (staff.hospital._id.toString() !== department.hospital.toString()) {
    return res.status(400).json({ 
      error: "Staff must belong to the same hospital" 
    });
  }

  const previousHead = department.headOfDepartment;
  department.headOfDepartment = staffId;
  await department.save();

  await department.populate("headOfDepartment", "fullName staffId role specialization");

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "UPDATE",
    resource: "DEPARTMENT",
    resourceId: department._id,
    details: { 
      action: "assign_head",
      previousHead,
      newHead: staffId,
      departmentName: department.name
    },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: department.hospital,
    status: "SUCCESS"
  });

  res.json({
    message: "Head of department assigned successfully",
    department
  });
});

/**
 * Update equipment in department
 * PATCH /departments/:id/equipment
 * @access Private (Manager, Admin)
 */
export const updateEquipment = asyncHandler(async (req, res) => {
  const { equipmentList } = req.body;

  if (!Array.isArray(equipmentList)) {
    return res.status(400).json({ error: "Equipment list must be an array" });
  }

  const department = await Department.findById(req.params.id);
  if (!department) {
    return res.status(404).json({ error: "Department not found" });
  }

  department.equipmentList = equipmentList;
  await department.save();

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "UPDATE",
    resource: "DEPARTMENT",
    resourceId: department._id,
    details: { action: "update_equipment", equipmentCount: equipmentList.length },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: department.hospital,
    status: "SUCCESS"
  });

  res.json({
    message: "Equipment updated successfully",
    department
  });
});

/**
 * Get department statistics
 * GET /departments/:id/stats
 * @access Private (Staff)
 */
export const getDepartmentStats = asyncHandler(async (req, res) => {
  const department = await Department.findById(req.params.id)
    .populate("hospital", "name hospitalId");

  if (!department) {
    return res.status(404).json({ error: "Department not found" });
  }

  // Get various statistics
  const [
    totalStaff,
    staffByRole,
    totalBeds,
    operationalEquipment,
    maintenanceEquipment
  ] = await Promise.all([
    Staff.countDocuments({ department: department._id, isActive: true }),
    Staff.aggregate([
      { $match: { department: department._id, isActive: true } },
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]),
    department.bedsAllocated,
    department.equipmentList.filter(e => e.status === "OPERATIONAL").length,
    department.equipmentList.filter(e => e.status === "MAINTENANCE").length
  ]);

  res.json({
    department: {
      id: department._id,
      name: department.name,
      code: department.code,
      category: department.category,
      hospital: department.hospital
    },
    statistics: {
      staff: {
        total: totalStaff,
        byRole: staffByRole.reduce((acc, { _id, count }) => {
          acc[_id] = count;
          return acc;
        }, {})
      },
      beds: {
        allocated: totalBeds
      },
      equipment: {
        total: department.equipmentList.length,
        operational: operationalEquipment,
        maintenance: maintenanceEquipment,
        outOfService: department.equipmentList.length - operationalEquipment - maintenanceEquipment
      }
    }
  });
});