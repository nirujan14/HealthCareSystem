// Hospital Management Controller
// Path: src/controllers/hospitalController.js

import { Hospital, Department, Staff, AuditLog } from "../models/index.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

/**
 * Create new hospital
 * POST /hospitals
 * @access Private (Admin only)
 */
export const createHospital = asyncHandler(async (req, res) => {
  const {
    name,
    hospitalId,
    type,
    address,
    contact,
    facilities,
    operatingHours,
    totalBeds,
    availableBeds,
    services,
    accreditation,
    coordinates
  } = req.body;

  // Validation
  if (!name || !hospitalId || !type) {
    return res.status(400).json({ 
      error: "Name, hospital ID, and type are required" 
    });
  }

  // Check if hospital ID already exists
  const existing = await Hospital.findOne({ 
    hospitalId: hospitalId.toUpperCase() 
  });
  
  if (existing) {
    return res.status(400).json({ 
      error: "Hospital ID already exists" 
    });
  }

  // Create hospital
  const hospital = await Hospital.create({
    name,
    hospitalId: hospitalId.toUpperCase(),
    type,
    address,
    contact,
    facilities: facilities || [],
    operatingHours,
    totalBeds: totalBeds || 0,
    availableBeds: availableBeds || totalBeds || 0,
    services: services || [],
    accreditation,
    coordinates
  });

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "CREATE",
    resource: "HOSPITAL",
    resourceId: hospital._id,
    details: { hospitalId: hospital.hospitalId, name: hospital.name },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    status: "SUCCESS"
  });

  res.status(201).json({
    message: "Hospital created successfully",
    hospital
  });
});

/**
 * Get all hospitals
 * GET /hospitals?type=GOVERNMENT&city=Colombo&page=1&limit=20
 * @access Public
 */
export const listHospitals = asyncHandler(async (req, res) => {
  const { 
    type, 
    city, 
    district, 
    province,
    isActive,
    facilities,
    page = 1, 
    limit = 20 
  } = req.query;

  const skip = (page - 1) * limit;
  const query = {};

  // Filters
  if (type) query.type = type;
  if (city) query["address.city"] = new RegExp(city, "i");
  if (district) query["address.district"] = new RegExp(district, "i");
  if (province) query["address.province"] = new RegExp(province, "i");
  if (isActive !== undefined) query.isActive = isActive === "true";
  if (facilities) {
    const facilityArray = facilities.split(",");
    query.facilities = { $all: facilityArray };
  }

  const [hospitals, total] = await Promise.all([
    Hospital.find(query)
      .select("-__v")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ name: 1 }),
    Hospital.countDocuments(query)
  ]);

  res.json({
    hospitals,
    pagination: {
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      limit: parseInt(limit)
    }
  });
});

/**
 * Get hospital by ID
 * GET /hospitals/:id
 * @access Public
 */
export const getHospitalById = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    return res.status(404).json({ error: "Hospital not found" });
  }

  // Get department count
  const departmentCount = await Department.countDocuments({ 
    hospital: hospital._id,
    isActive: true 
  });

  // Get staff count
  const staffCount = await Staff.countDocuments({ 
    hospital: hospital._id,
    isActive: true 
  });

  res.json({
    ...hospital.toObject(),
    stats: {
      departments: departmentCount,
      staff: staffCount,
      bedOccupancy: hospital.totalBeds > 0 
        ? ((hospital.totalBeds - hospital.availableBeds) / hospital.totalBeds * 100).toFixed(1)
        : 0
    }
  });
});

/**
 * Update hospital
 * PATCH /hospitals/:id
 * @access Private (Admin, Manager)
 */
export const updateHospital = asyncHandler(async (req, res) => {
  const updatable = [
    "name",
    "type",
    "address",
    "contact",
    "facilities",
    "operatingHours",
    "totalBeds",
    "availableBeds",
    "services",
    "accreditation",
    "coordinates",
    "isActive"
  ];

  const patch = {};
  updatable.forEach((key) => {
    if (req.body[key] !== undefined) {
      patch[key] = req.body[key];
    }
  });

  const hospital = await Hospital.findByIdAndUpdate(
    req.params.id,
    patch,
    { new: true, runValidators: true }
  );

  if (!hospital) {
    return res.status(404).json({ error: "Hospital not found" });
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
    resource: "HOSPITAL",
    resourceId: hospital._id,
    details: { fields: Object.keys(patch) },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: hospital._id,
    status: "SUCCESS"
  });

  res.json({
    message: "Hospital updated successfully",
    hospital
  });
});

/**
 * Delete/Deactivate hospital
 * DELETE /hospitals/:id
 * @access Private (Admin only)
 */
export const deleteHospital = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    return res.status(404).json({ error: "Hospital not found" });
  }

  // Soft delete - just deactivate
  hospital.isActive = false;
  await hospital.save();

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "DELETE",
    resource: "HOSPITAL",
    resourceId: hospital._id,
    details: { action: "deactivate", hospitalId: hospital.hospitalId },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    status: "SUCCESS"
  });

  res.json({ 
    message: "Hospital deactivated successfully",
    hospital 
  });
});

/**
 * Search hospitals
 * GET /hospitals/search?q=national&near=6.9271,79.8612&radius=10
 * @access Public
 */
export const searchHospitals = asyncHandler(async (req, res) => {
  const { q, near, radius = 10, type, facilities } = req.query;

  if (!q && !near) {
    return res.status(400).json({ 
      error: "Search query or location required" 
    });
  }

  const query = { isActive: true };

  // Text search
  if (q) {
    query.$or = [
      { name: { $regex: q, $options: "i" } },
      { hospitalId: { $regex: q, $options: "i" } },
      { "address.city": { $regex: q, $options: "i" } },
      { "address.district": { $regex: q, $options: "i" } }
    ];
  }

  // Location-based search (simplified - in production use geospatial queries)
  if (near) {
    const [lat, lng] = near.split(",").map(Number);
    if (lat && lng) {
      // For now, just filter by coordinates existence
      // In production, use $geoNear or $near with 2dsphere index
      query["coordinates.latitude"] = { $exists: true };
      query["coordinates.longitude"] = { $exists: true };
    }
  }

  // Additional filters
  if (type) query.type = type;
  if (facilities) {
    const facilityArray = facilities.split(",");
    query.facilities = { $all: facilityArray };
  }

  const hospitals = await Hospital.find(query)
    .select("name hospitalId type address contact facilities totalBeds availableBeds coordinates")
    .limit(20)
    .sort({ name: 1 });

  // If location search, calculate distances (simplified)
  if (near) {
    const [lat, lng] = near.split(",").map(Number);
    hospitals.forEach(h => {
      if (h.coordinates?.latitude && h.coordinates?.longitude) {
        const distance = calculateDistance(
          lat, lng,
          h.coordinates.latitude,
          h.coordinates.longitude
        );
        h._doc.distance = distance;
      }
    });
    
    // Sort by distance and filter by radius
    hospitals.sort((a, b) => (a._doc.distance || Infinity) - (b._doc.distance || Infinity));
    const filtered = hospitals.filter(h => !h._doc.distance || h._doc.distance <= radius);
    
    return res.json({ hospitals: filtered });
  }

  res.json({ hospitals });
});

/**
 * Get hospital statistics
 * GET /hospitals/:id/stats
 * @access Private (Manager, Admin)
 */
export const getHospitalStats = asyncHandler(async (req, res) => {
  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    return res.status(404).json({ error: "Hospital not found" });
  }

  // Get various statistics
  const [
    totalDepartments,
    activeDepartments,
    totalStaff,
    staffByRole,
    totalBeds,
    occupancyRate
  ] = await Promise.all([
    Department.countDocuments({ hospital: hospital._id }),
    Department.countDocuments({ hospital: hospital._id, isActive: true }),
    Staff.countDocuments({ hospital: hospital._id, isActive: true }),
    Staff.aggregate([
      { $match: { hospital: hospital._id, isActive: true } },
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]),
    hospital.totalBeds,
    hospital.totalBeds > 0
      ? ((hospital.totalBeds - hospital.availableBeds) / hospital.totalBeds * 100)
      : 0
  ]);

  res.json({
    hospital: {
      id: hospital._id,
      name: hospital.name,
      hospitalId: hospital.hospitalId,
      type: hospital.type
    },
    statistics: {
      departments: {
        total: totalDepartments,
        active: activeDepartments
      },
      staff: {
        total: totalStaff,
        byRole: staffByRole.reduce((acc, { _id, count }) => {
          acc[_id] = count;
          return acc;
        }, {})
      },
      beds: {
        total: totalBeds,
        occupied: totalBeds - hospital.availableBeds,
        available: hospital.availableBeds,
        occupancyRate: occupancyRate.toFixed(1) + "%"
      }
    }
  });
});

/**
 * Update bed availability
 * PATCH /hospitals/:id/beds
 * @access Private (Staff only)
 */
export const updateBedAvailability = asyncHandler(async (req, res) => {
  const { availableBeds } = req.body;

  if (availableBeds === undefined || availableBeds < 0) {
    return res.status(400).json({ 
      error: "Valid available beds count required" 
    });
  }

  const hospital = await Hospital.findById(req.params.id);

  if (!hospital) {
    return res.status(404).json({ error: "Hospital not found" });
  }

  if (availableBeds > hospital.totalBeds) {
    return res.status(400).json({ 
      error: "Available beds cannot exceed total beds" 
    });
  }

  hospital.availableBeds = availableBeds;
  await hospital.save();

  // Log audit
  await AuditLog.create({
    user: {
      userId: req.user.id,
      userType: "STAFF",
      userName: req.user.fullName,
      userEmail: req.user.email
    },
    action: "UPDATE",
    resource: "HOSPITAL",
    resourceId: hospital._id,
    details: { action: "bed_update", availableBeds },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"],
    hospital: hospital._id,
    status: "SUCCESS"
  });

  res.json({
    message: "Bed availability updated",
    hospital: {
      id: hospital._id,
      totalBeds: hospital.totalBeds,
      availableBeds: hospital.availableBeds,
      occupancyRate: ((hospital.totalBeds - hospital.availableBeds) / hospital.totalBeds * 100).toFixed(1) + "%"
    }
  });
});

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
}