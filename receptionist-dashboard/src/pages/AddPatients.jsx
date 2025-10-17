import React, { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import "./AddPatient.css"; // Normal CSS
import api from "../api/axiosInstance";

const AddPatient = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    healthCardId: "",
    passwordHash: "",
    gender: "MALE",
    bloodGroup: "",
    address: {
      street: "",
      city: "",
      district: "",
      province: "",
      postalCode: "",
      country: "Sri Lanka",
    },
  });

  const [avatar, setAvatar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  // Generate Health Card ID
  const generateHealthCardId = () => {
    const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000);
    return `HC${randomDigits}`;
  };

  // Auto-generate on load
  useEffect(() => {
    setFormData((prev) => ({ ...prev, healthCardId: generateHealthCardId() }));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.startsWith("address.")) {
      const field = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        address: { ...prev.address, [field]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleFileChange = (e) => {
    setAvatar(e.target.files[0]);
  };

  const handleGenerateNewId = () => {
    setFormData((prev) => ({ ...prev, healthCardId: generateHealthCardId() }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const patientData = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (key === "address") {
          patientData.append("address", JSON.stringify(value));
        } else {
          patientData.append(key, value);
        }
      });

      if (avatar) {
        patientData.append("file", avatar);
      }

      // Get token from localStorage
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("You must be logged in!");
        setLoading(false);
        return;
      }

      const res = await api.post("/patients", patientData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      setMessage("Patient added successfully!");
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        healthCardId: generateHealthCardId(),
        passwordHash: "",
        gender: "MALE",
        bloodGroup: "",
        address: {
          street: "",
          city: "",
          district: "",
          province: "",
          postalCode: "",
          country: "Sri Lanka",
        },
      });
      setAvatar(null);
    } catch (error) {
      console.error(error);
      setMessage(error.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <Navbar />
      <div className="content-wrapper">
        <Sidebar />
        <main className="main-content">
          <h2>Add New Patient</h2>
          {message && <p className="message">{message}</p>}

          <form onSubmit={handleSubmit} className="patient-form">
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <input
              type="text"
              name="phone"
              placeholder="Phone"
              value={formData.phone}
              onChange={handleChange}
              required
            />

            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <input
                type="text"
                name="healthCardId"
                placeholder="Health Card ID"
                value={formData.healthCardId}
                readOnly
              />
              <button type="button" onClick={handleGenerateNewId}>
                Generate New ID
              </button>
            </div>

            <input
              type="password"
              name="passwordHash"
              placeholder="Password"
              value={formData.passwordHash}
              onChange={handleChange}
              required
            />

            <select name="gender" value={formData.gender} onChange={handleChange}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
              <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
            </select>

            <select name="bloodGroup" value={formData.bloodGroup} onChange={handleChange}>
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>

            <input
              type="text"
              name="address.street"
              placeholder="Street"
              value={formData.address.street}
              onChange={handleChange}
            />
            <input
              type="text"
              name="address.city"
              placeholder="City"
              value={formData.address.city}
              onChange={handleChange}
            />
            <input
              type="text"
              name="address.district"
              placeholder="District"
              value={formData.address.district}
              onChange={handleChange}
            />
            <input
              type="text"
              name="address.province"
              placeholder="Province"
              value={formData.address.province}
              onChange={handleChange}
            />
            <input
              type="text"
              name="address.postalCode"
              placeholder="Postal Code"
              value={formData.address.postalCode}
              onChange={handleChange}
            />

            <input type="file" name="file" onChange={handleFileChange} />

            <button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Patient"}
            </button>
          </form>
        </main>
      </div>
    </div>
  );
};

export default AddPatient;
