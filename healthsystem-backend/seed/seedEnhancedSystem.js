// Seed script for the enhanced healthcare system
// Path: seed/seedEnhancedSystem.js

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { 
  Hospital, 
  Department, 
  Staff, 
  Patient, 
  Permission, 
  Role 
} from "../src/models/index.js";

const MONGO_URI = process.env.MONGO_URI;

async function seedSystem() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: "healthsystem" });
    console.log("✅ Connected to MongoDB");

    // Clear existing data (optional - comment out if you want to keep existing data)
    await Promise.all([
      Hospital.deleteMany({}),
      Department.deleteMany({}),
      Staff.deleteMany({}),
      Permission.deleteMany({}),
      Role.deleteMany({})
    ]);
    console.log("🗑️  Cleared existing data");

    // === 1. CREATE PERMISSIONS ===
    console.log("\n📋 Creating permissions...");
    const permissions = await Permission.insertMany([
      // Patient permissions
      { name: "READ_OWN_PATIENT", resource: "PATIENT", action: "READ", description: "View own profile" },
      { name: "UPDATE_OWN_PATIENT", resource: "PATIENT", action: "UPDATE", description: "Update own profile" },
      { name: "READ_OWN_APPOINTMENT", resource: "APPOINTMENT", action: "READ", description: "View own appointments" },
      { name: "CREATE_APPOINTMENT", resource: "APPOINTMENT", action: "CREATE", description: "Book appointments" },
      { name: "CANCEL_OWN_APPOINTMENT", resource: "APPOINTMENT", action: "DELETE", description: "Cancel own appointments" },
      { name: "READ_OWN_RECORD", resource: "RECORD", action: "READ", description: "View own medical records" },
      { name: "READ_OWN_PAYMENT", resource: "PAYMENT", action: "READ", description: "View own payments" },
      
      // Receptionist permissions
      { name: "READ_PATIENT", resource: "PATIENT", action: "READ", description: "View patient profiles" },
      { name: "CREATE_PATIENT", resource: "PATIENT", action: "CREATE", description: "Register new patients" },
      { name: "UPDATE_PATIENT", resource: "PATIENT", action: "UPDATE", description: "Update patient information" },
      { name: "MANAGE_APPOINTMENT", resource: "APPOINTMENT", action: "MANAGE", description: "Manage appointments" },
      { name: "CREATE_PAYMENT", resource: "PAYMENT", action: "CREATE", description: "Process payments" },
      
      // Doctor/Nurse permissions
      { name: "READ_RECORD", resource: "RECORD", action: "READ", description: "View medical records" },
      { name: "CREATE_RECORD", resource: "RECORD", action: "CREATE", description: "Create medical records" },
      { name: "UPDATE_RECORD", resource: "RECORD", action: "UPDATE", description: "Update medical records" },
      { name: "CREATE_PRESCRIPTION", resource: "PRESCRIPTION", action: "CREATE", description: "Write prescriptions" },
      { name: "UPDATE_APPOINTMENT", resource: "APPOINTMENT", action: "UPDATE", description: "Update appointment status" },
      
      // Manager permissions
      { name: "READ_REPORT", resource: "REPORT", action: "READ", description: "View analytics reports" },
      { name: "MANAGE_STAFF", resource: "STAFF", action: "MANAGE", description: "Manage staff members" },
      { name: "MANAGE_DEPARTMENT", resource: "DEPARTMENT", action: "MANAGE", description: "Manage departments" },
      
      // Admin permissions
      { name: "MANAGE_HOSPITAL", resource: "HOSPITAL", action: "MANAGE", description: "Manage hospital settings" },
      { name: "MANAGE_SYSTEM", resource: "SYSTEM", action: "MANAGE", description: "System administration" }
    ]);
    console.log(`✅ Created ${permissions.length} permissions`);

    // === 2. CREATE ROLES ===
    console.log("\n👥 Creating roles...");
    const patientRole = await Role.create({
      name: "PATIENT",
      displayName: "Patient",
      description: "Standard patient account",
      level: 1,
      isSystemRole: true,
      permissions: permissions.filter(p => 
        p.name.includes("OWN") || p.name === "CREATE_APPOINTMENT"
      ).map(p => p._id)
    });

    const receptionistRole = await Role.create({
      name: "RECEPTIONIST",
      displayName: "Receptionist",
      description: "Front desk staff",
      level: 2,
      isSystemRole: true,
      permissions: permissions.filter(p => 
        ["READ_PATIENT", "CREATE_PATIENT", "UPDATE_PATIENT", "MANAGE_APPOINTMENT", "CREATE_PAYMENT"].includes(p.name)
      ).map(p => p._id)
    });

    const nurseRole = await Role.create({
      name: "NURSE",
      displayName: "Nurse",
      description: "Nursing staff",
      level: 3,
      isSystemRole: true,
      permissions: permissions.filter(p => 
        ["READ_PATIENT", "READ_RECORD", "UPDATE_RECORD", "UPDATE_APPOINTMENT"].includes(p.name)
      ).map(p => p._id)
    });

    const doctorRole = await Role.create({
      name: "DOCTOR",
      displayName: "Doctor",
      description: "Medical doctor",
      level: 4,
      isSystemRole: true,
      permissions: permissions.filter(p => 
        ["READ_PATIENT", "READ_RECORD", "CREATE_RECORD", "UPDATE_RECORD", 
         "CREATE_PRESCRIPTION", "UPDATE_APPOINTMENT"].includes(p.name)
      ).map(p => p._id)
    });

    const managerRole = await Role.create({
      name: "MANAGER",
      displayName: "Healthcare Manager",
      description: "Hospital management",
      level: 6,
      isSystemRole: true,
      permissions: permissions.filter(p => 
        ["READ_REPORT", "MANAGE_STAFF", "MANAGE_DEPARTMENT", "READ_PATIENT"].includes(p.name)
      ).map(p => p._id)
    });

    const adminRole = await Role.create({
      name: "ADMIN",
      displayName: "System Administrator",
      description: "Full system access",
      level: 8,
      isSystemRole: true,
      permissions: permissions.map(p => p._id)
    });

    console.log("✅ Created 6 roles");

    // === 3. CREATE HOSPITALS ===
    console.log("\n🏥 Creating hospitals...");
    const hospitals = await Hospital.insertMany([
      {
        name: "National Hospital of Sri Lanka",
        hospitalId: "NHSL",
        type: "GOVERNMENT",
        address: {
          street: "Regent Street",
          city: "Colombo",
          district: "Colombo",
          province: "Western",
          postalCode: "00700"
        },
        contact: {
          phone: "+94112691111",
          email: "info@nhsl.health.gov.lk",
          emergencyHotline: "+94112695711"
        },
        facilities: ["ICU", "EMERGENCY", "SURGERY", "LABORATORY", "PHARMACY", "RADIOLOGY", "MATERNITY"],
        operatingHours: { is24x7: true },
        totalBeds: 3500,
        availableBeds: 450,
        coordinates: { latitude: 6.9271, longitude: 79.8612 }
      },
      {
        name: "Asiri Central Hospital",
        hospitalId: "ACH",
        type: "PRIVATE",
        address: {
          street: "114, Norris Canal Road",
          city: "Colombo",
          district: "Colombo",
          province: "Western",
          postalCode: "01000"
        },
        contact: {
          phone: "+94114665500",
          email: "info@asiricentral.com",
          emergencyHotline: "+94114665544"
        },
        facilities: ["ICU", "EMERGENCY", "SURGERY", "LABORATORY", "PHARMACY", "RADIOLOGY"],
        operatingHours: { is24x7: true },
        totalBeds: 300,
        availableBeds: 45,
        coordinates: { latitude: 6.9147, longitude: 79.8781 }
      },
      {
        name: "Colombo South Teaching Hospital",
        hospitalId: "CSTH",
        type: "GOVERNMENT",
        address: {
          street: "Kalubowila",
          city: "Dehiwala-Mount Lavinia",
          district: "Colombo",
          province: "Western",
          postalCode: "10350"
        },
        contact: {
          phone: "+94112777777",
          email: "info@csth.health.gov.lk",
          emergencyHotline: "+94112777888"
        },
        facilities: ["ICU", "EMERGENCY", "SURGERY", "LABORATORY", "PHARMACY", "BLOOD_BANK"],
        operatingHours: { is24x7: true },
        totalBeds: 1200,
        availableBeds: 180,
        coordinates: { latitude: 6.8540, longitude: 79.8850 }
      }
    ]);
    console.log(`✅ Created ${hospitals.length} hospitals`);

    // === 4. CREATE DEPARTMENTS ===
    console.log("\n🏢 Creating departments...");
    const departments = [];
    
    for (const hospital of hospitals) {
      const depts = await Department.insertMany([
        {
          hospital: hospital._id,
          name: "General Medicine",
          code: `${hospital.hospitalId}-GEN`,
          category: "GENERAL",
          description: "General medical consultations",
          operatingHours: { is24x7: true },
          bedsAllocated: hospital.type === "GOVERNMENT" ? 150 : 50
        },
        {
          hospital: hospital._id,
          name: "Cardiology",
          code: `${hospital.hospitalId}-CARD`,
          category: "CARDIOLOGY",
          description: "Heart and cardiovascular care",
          operatingHours: { 
            weekdays: { open: "08:00", close: "18:00" },
            weekends: { open: "08:00", close: "14:00" }
          },
          bedsAllocated: 30
        },
        {
          hospital: hospital._id,
          name: "Pediatrics",
          code: `${hospital.hospitalId}-PED`,
          category: "PEDIATRICS",
          description: "Child healthcare",
          operatingHours: { is24x7: true },
          bedsAllocated: 40
        },
        {
          hospital: hospital._id,
          name: "Emergency",
          code: `${hospital.hospitalId}-ER`,
          category: "EMERGENCY",
          description: "Emergency and trauma care",
          operatingHours: { is24x7: true },
          bedsAllocated: 20
        }
      ]);
      departments.push(...depts);
    }
    console.log(`✅ Created ${departments.length} departments`);

    // === 5. CREATE STAFF ===
    console.log("\n👨‍⚕️ Creating staff members...");
    const passwordHash = await bcrypt.hash("staff123", 10);
    const staffMembers = [];

    // Doctors for each hospital
    for (const hospital of hospitals) {
      const hospitalDepts = departments.filter(d => d.hospital.toString() === hospital._id.toString());
      
      // Cardiologist
      const cardDept = hospitalDepts.find(d => d.category === "CARDIOLOGY");
      if (cardDept) {
        staffMembers.push({
          email: `dr.${hospital.hospitalId.toLowerCase()}.cardio@hospital.lk`,
          passwordHash,
          staffId: `${hospital.hospitalId}-DOC-001`,
          fullName: `Dr. ${hospital.hospitalId} Cardiologist`,
          role: "DOCTOR",
          specialization: "CARDIOLOGIST",
          hospital: hospital._id,
          department: cardDept._id,
          phone: "+94771234567",
          consultationFee: hospital.type === "PRIVATE" ? 3000 : 0,
          licenseNumber: `SLMC-${hospital.hospitalId}-001`
        });
      }

      // Pediatrician
      const pedDept = hospitalDepts.find(d => d.category === "PEDIATRICS");
      if (pedDept) {
        staffMembers.push({
          email: `dr.${hospital.hospitalId.toLowerCase()}.pedia@hospital.lk`,
          passwordHash,
          staffId: `${hospital.hospitalId}-DOC-002`,
          fullName: `Dr. ${hospital.hospitalId} Pediatrician`,
          role: "DOCTOR",
          specialization: "PEDIATRICIAN",
          hospital: hospital._id,
          department: pedDept._id,
          phone: "+94771234568",
          consultationFee: hospital.type === "PRIVATE" ? 2500 : 0,
          licenseNumber: `SLMC-${hospital.hospitalId}-002`
        });
      }

      // Receptionist
      staffMembers.push({
        email: `reception.${hospital.hospitalId.toLowerCase()}@hospital.lk`,
        passwordHash,
        staffId: `${hospital.hospitalId}-REC-001`,
        fullName: `${hospital.hospitalId} Receptionist`,
        role: "RECEPTIONIST",
        hospital: hospital._id,
        department: hospitalDepts[0]._id,
        phone: "+94771234569"
      });

      // Manager
      staffMembers.push({
        email: `manager.${hospital.hospitalId.toLowerCase()}@hospital.lk`,
        passwordHash,
        staffId: `${hospital.hospitalId}-MGR-001`,
        fullName: `${hospital.hospitalId} Manager`,
        role: "MANAGER",
        hospital: hospital._id,
        department: hospitalDepts[0]._id,
        phone: "+94771234570"
      });
    }

    await Staff.insertMany(staffMembers);
    console.log(`✅ Created ${staffMembers.length} staff members`);

    // === 6. UPDATE EXISTING PATIENTS (Keep existing test patient) ===
    console.log("\n👤 Checking existing patients...");
    const existingPatient = await Patient.findOne({ email: "patient1@example.com" });
    if (existingPatient) {
      console.log("✅ Existing test patient found");
    } else {
      const patientHash = await bcrypt.hash("pass1234", 10);
      await Patient.create({
        email: "patient1@example.com",
        passwordHash: patientHash,
        fullName: "Test Patient",
        phone: "+94771234567",
        healthCardId: "HC-2025-00001",
        address: {
          street: "123 Test Street",
          city: "Colombo",
          district: "Colombo",
          province: "Western"
        },
        emergencyContact: {
          name: "Emergency Contact",
          phone: "+94771234568"
        }
      });
      console.log("✅ Created test patient");
    }

    console.log("\n🎉 Seed completed successfully!");
    console.log("\n📝 Test Credentials:");
    console.log("=====================================");
    console.log("Patient:");
    console.log("  Email: patient1@example.com");
    console.log("  Password: pass1234");
    console.log("\nStaff (format: [role].[hospitalId]@hospital.lk):");
    console.log("  Email: dr.nhsl.cardio@hospital.lk");
    console.log("  Email: reception.nhsl@hospital.lk");
    console.log("  Email: manager.nhsl@hospital.lk");
    console.log("  Password: staff123");
    console.log("=====================================\n");

  } catch (error) {
    console.error("❌ Seed error:", error);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Disconnected from MongoDB");
    process.exit(0);
  }
}

seedSystem();