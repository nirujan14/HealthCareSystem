// Staff Assignment & Transfer Controller
// Path: src/controllers/staffAssignmentController.js

import { Staff, Hospital, Department, AuditLog } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * Assign staff to hospital and department
 * POST /staff/assign
 * @access Private (Manager, Admin)
 */
export const assignStaff = asyncHandler(async (req, res) => {
  const { staffId, hospitalId, departmentId } = req.body;

  if (!staffId || !hospitalId || !departmentId) {
    return res.status(400).json({ 
      error: "Staff ID, hospital ID, and department ID are required" 
    });
  }

  // Verify staff exists
  const staff = await Staff.findById(staffId);
  if (!staff) {
    return res.status(404).json({ error: "Staff not found" });
  }

  // Verify hospital exists
  const hospital = await Hospital.findById(hospitalId);
  if (!hospital || !hospital.isActive) {
    return res.status(404).json({ error: "Hospital not found or inactive" });
  }

  // Verify department exists and belongs to hospital
  const department = await Department.findById(departmentId);
  if (!department || !department.isActive) {
    return res.status(404).json({ error: "Department not found or inactive" });
  }

  if (department.hospital.toString() !== hospitalId) {
    return res.status(400).json({ 
      error: "Department does not belong to the specified hospital" 
    });
  }

  // Store old assignment for audit
  const oldHospital = staff.hospital;
  const oldDepartment = staff.department;

  // Assign staff
  staff.hospital = hospitalId;
  staff.department = departmentId;
  await staff.save();

  await staff.populate("hospital department");

  // Update staff count in new department
  const newStaffCount = await Staff.countDocuments({ 
    department: departmentId,
    isActive: true 
  });
  department.staffCount = newStaffCount;
  await department.save();

  // Update staff count in old department if exists
  if (oldDepartment) {
    const oldDept = await Department.findById(oldDepartment);
    if (oldDept) {
      const oldStaffCount = await Staff.countDocuments({ 
        department: oldDepartment,
        isActive: true 
      });
      oldDept.staffCount = oldStaffCount;
      await oldDept.save();
    }
  }

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "UPDATE",
    resource: "STAFF",
    resourceId: staff._id,
    details: { 
      action: "staff_assignment",
      staffName: staff.fullName,
      oldHospital,
      newHospital: hospitalId,
      oldDepartment,
      newDepartment: departmentId
    },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: hospitalId,
    status: "SUCCESS"
  });

  res.json({
    message: "Staff assigned successfully",
    staff
  });
});

/**
 * Transfer staff between departments (same hospital)
 * POST /staff/transfer
 * @access Private (Manager, Admin)
 */
export const transferStaff = asyncHandler(async (req, res) => {
  const { staffId, newDepartmentId, reason, effectiveDate } = req.body;

  if (!staffId || !newDepartmentId) {
    return res.status(400).json({ 
      error: "Staff ID and new department ID are required" 
    });
  }

  // Verify staff exists
  const staff = await Staff.findById(staffId)
    .populate("hospital department");

  if (!staff) {
    return res.status(404).json({ error: "Staff not found" });
  }

  // Verify new department exists
  const newDepartment = await Department.findById(newDepartmentId)
    .populate("hospital");

  if (!newDepartment || !newDepartment.isActive) {
    return res.status(404).json({ error: "New department not found or inactive" });
  }

  // Verify both departments belong to same hospital
  if (staff.hospital._id.toString() !== newDepartment.hospital._id.toString()) {
    return res.status(400).json({ 
      error: "Staff can only be transferred within the same hospital. Use 'assign' for inter-hospital transfers." 
    });
  }

  // Check if already in that department
  if (staff.department._id.toString() === newDepartmentId) {
    return res.status(400).json({ 
      error: "Staff is already in this department" 
    });
  }

  const oldDepartment = staff.department;

  // Transfer staff
  staff.department = newDepartmentId;
  await staff.save();

  await staff.populate("department");

  // Update staff counts
  const [oldStaffCount, newStaffCount] = await Promise.all([
    Staff.countDocuments({ department: oldDepartment._id, isActive: true }),
    Staff.countDocuments({ department: newDepartmentId, isActive: true })
  ]);

  await Promise.all([
    Department.findByIdAndUpdate(oldDepartment._id, { staffCount: oldStaffCount }),
    Department.findByIdAndUpdate(newDepartmentId, { staffCount: newStaffCount })
  ]);

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "UPDATE",
    resource: "STAFF",
    resourceId: staff._id,
    details: { 
      action: "staff_transfer",
      staffName: staff.fullName,
      oldDepartment: oldDepartment.name,
      newDepartment: newDepartment.name,
      reason: reason || "Not specified",
      effectiveDate: effectiveDate || new Date()
    },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: staff.hospital._id,
    status: "SUCCESS"
  });

  res.json({
    message: "Staff transferred successfully",
    staff,
    transfer: {
      from: {
        id: oldDepartment._id,
        name: oldDepartment.name
      },
      to: {
        id: newDepartment._id,
        name: newDepartment.name
      },
      effectiveDate: effectiveDate || new Date()
    }
  });
});

/**
 * Batch assign multiple staff members
 * POST /staff/batch-assign
 * @access Private (Admin)
 */
export const batchAssignStaff = asyncHandler(async (req, res) => {
  const { assignments } = req.body;
  // assignments format: [{ staffId, hospitalId, departmentId }]

  if (!Array.isArray(assignments) || assignments.length === 0) {
    return res.status(400).json({ 
      error: "Assignments array is required" 
    });
  }

  const results = {
    successful: [],
    failed: []
  };

  for (const assignment of assignments) {
    const { staffId, hospitalId, departmentId } = assignment;

    try {
      // Verify all entities exist
      const [staff, hospital, department] = await Promise.all([
        Staff.findById(staffId),
        Hospital.findById(hospitalId),
        Department.findById(departmentId)
      ]);

      if (!staff) {
        results.failed.push({ staffId, error: "Staff not found" });
        continue;
      }

      if (!hospital || !hospital.isActive) {
        results.failed.push({ staffId, error: "Hospital not found or inactive" });
        continue;
      }

      if (!department || !department.isActive) {
        results.failed.push({ staffId, error: "Department not found or inactive" });
        continue;
      }

      if (department.hospital.toString() !== hospitalId) {
        results.failed.push({ staffId, error: "Department does not belong to hospital" });
        continue;
      }

      // Assign staff
      staff.hospital = hospitalId;
      staff.department = departmentId;
      await staff.save();

      results.successful.push({
        staffId,
        staffName: staff.fullName,
        hospital: hospital.name,
        department: department.name
      });

    } catch (error) {
      results.failed.push({ staffId, error: error.message });
    }
  }

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "UPDATE",
    resource: "STAFF",
    details: { 
      action: "batch_assignment",
      totalAttempted: assignments.length,
      successful: results.successful.length,
      failed: results.failed.length
    },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    status: results.failed.length === 0 ? "SUCCESS" : "PARTIAL"
  });

  res.json({
    message: `Batch assignment completed: ${results.successful.length} successful, ${results.failed.length} failed`,
    results
  });
});

/**
 * Update staff schedule
 * PATCH /staff/:id/schedule
 * @access Private (Manager, Admin)
 */
export const updateStaffSchedule = asyncHandler(async (req, res) => {
  const { workingHours, shift, maxPatientsPerDay } = req.body;

  const staff = await Staff.findById(req.params.id);
  if (!staff) {
    return res.status(404).json({ error: "Staff not found" });
  }

  if (workingHours) {
    // Validate working hours structure
    const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    for (const day of daysOfWeek) {
      if (workingHours[day]) {
        if (!workingHours[day].start || !workingHours[day].end) {
          return res.status(400).json({ 
            error: `Invalid working hours for ${day}` 
          });
        }
      }
    }
    staff.workingHours = workingHours;
  }

  if (shift) {
    if (!["MORNING", "EVENING", "NIGHT", "ROTATING", "ON_CALL"].includes(shift)) {
      return res.status(400).json({ error: "Invalid shift type" });
    }
    staff.shift = shift;
  }

  if (maxPatientsPerDay !== undefined) {
    if (maxPatientsPerDay < 0) {
      return res.status(400).json({ error: "Invalid max patients per day" });
    }
    staff.maxPatientsPerDay = maxPatientsPerDay;
  }

  await staff.save();

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "UPDATE",
    resource: "STAFF",
    resourceId: staff._id,
    details: { 
      action: "schedule_update",
      staffName: staff.fullName,
      updatedFields: { workingHours: !!workingHours, shift: !!shift, maxPatientsPerDay: !!maxPatientsPerDay }
    },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: staff.hospital,
    status: "SUCCESS"
  });

  res.json({
    message: "Staff schedule updated successfully",
    staff
  });
});

/**
 * Get staff by hospital
 * GET /staff/by-hospital/:hospitalId
 * @access Private (Staff)
 */
export const getStaffByHospital = asyncHandler(async (req, res) => {
  const { hospitalId } = req.params;
  const { role, department, isActive, page = 1, limit = 50 } = req.query;

  const hospital = await Hospital.findById(hospitalId);
  if (!hospital) {
    return res.status(404).json({ error: "Hospital not found" });
  }

  const skip = (page - 1) * limit;
  const query = { hospital: hospitalId };

  if (role) query.role = role;
  if (department) query.department = department;
  if (isActive !== undefined) query.isActive = isActive === "true";

  const [staff, total] = await Promise.all([
    Staff.find(query)
      .populate("department", "name code category")
      .select("-passwordHash")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ fullName: 1 }),
    Staff.countDocuments(query)
  ]);

  res.json({
    hospital: {
      id: hospital._id,
      name: hospital.name,
      hospitalId: hospital.hospitalId
    },
    staff,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  });
});

/**
 * Get staff by department
 * GET /staff/by-department/:departmentId
 * @access Private (Staff)
 */
export const getStaffByDepartment = asyncHandler(async (req, res) => {
  const { departmentId } = req.params;
  const { role, isActive } = req.query;

  const department = await Department.findById(departmentId)
    .populate("hospital", "name hospitalId");

  if (!department) {
    return res.status(404).json({ error: "Department not found" });
  }

  const query = { department: departmentId };
  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive === "true";

  const staff = await Staff.find(query)
    .select("-passwordHash")
    .sort({ role: 1, fullName: 1 });

  // Group by role
  const groupedByRole = staff.reduce((acc, member) => {
    if (!acc[member.role]) {
      acc[member.role] = [];
    }
    acc[member.role].push(member);
    return acc;
  }, {});

  res.json({
    department: {
      id: department._id,
      name: department.name,
      code: department.code,
      hospital: department.hospital
    },
    totalStaff: staff.length,
    staff,
    groupedByRole
  });
});

/**
 * Check staff availability for appointment
 * GET /staff/:id/availability?date=2025-10-20
 * @access Private (Staff, Patient)
 */
export const checkStaffAvailability = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({ error: "Date is required" });
  }

  const staff = await Staff.findById(id)
    .populate("hospital department");

  if (!staff || !staff.isActive) {
    return res.status(404).json({ error: "Staff not found or inactive" });
  }

  // Check if staff works on this day
  const requestedDate = new Date(date);
  const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
  
  const daySchedule = staff.workingHours?.[dayOfWeek];
  
  if (!daySchedule?.isWorking) {
    return res.json({
      available: false,
      reason: "Staff does not work on this day",
      staff: {
        id: staff._id,
        name: staff.fullName,
        role: staff.role,
        specialization: staff.specialization
      }
    });
  }

  // TODO: Check existing appointments for this staff on this date
  // For now, return basic availability

  res.json({
    available: true,
    staff: {
      id: staff._id,
      name: staff.fullName,
      role: staff.role,
      specialization: staff.specialization,
      consultationFee: staff.consultationFee,
      maxPatientsPerDay: staff.maxPatientsPerDay
    },
    schedule: {
      day: dayOfWeek,
      start: daySchedule.start,
      end: daySchedule.end
    }
  });
});