import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import axios from "axios";
import QRCode from "qrcode"; // For generating QR code

// Configure axios with base URL from .env
axios.defaults.baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:4000/api";

const GenerateQr=()=> {
  const [formData, setFormData] = useState({
    role: "Customer",
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState({});
  const [roleId, setRoleId] = useState(null);
  const [qrCodeUrl, setQrCodeUrl] = useState(null); // Store QR code as data URL
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Fetch the Customer role_id on component mount
  useEffect(() => {
    const fetchCustomerRole = async () => {
      try {
        const response = await axios.get("/roles/fetch-all-roles");
        const roles = response.data.data;
        const customerRole = roles.find((role) => role.name === "Customer");
        if (customerRole) {
          setRoleId(customerRole._id);
        } else {
          setErrors((prev) => ({
            ...prev,
            role: "Customer role not found",
          }));
        }
      } catch (err) {
        console.error("Error fetching roles:", err);
        setErrors((prev) => ({
          ...prev,
          role: "Failed to fetch Customer role",
        }));
      }
    };
    fetchCustomerRole();
  }, []);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Invalid email format";
    if (!formData.phone.trim()) newErrors.phone = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = "Phone number must be 10 digits";
    if (!formData.password) newErrors.password = "Password is required";
    if (!formData.confirmPassword) newErrors.confirmPassword = "Confirm password is required";
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    if (!roleId) {
      setErrors((prev) => ({ ...prev, role: "Customer role ID not available" }));
      return;
    }

    setIsLoading(true);
    setSuccessMessage("");
    setQrCodeUrl(null);

    try {
      // Step 1: Create user
      const userResponse = await axios.post("/users/create-user", {
        role_id: roleId,
        name: formData.name,
        email: formData.email,
        phone_number: formData.phone,
        password: formData.password,
        confirm_password: formData.confirmPassword,
      });

      if (!userResponse.data.success) {
        throw new Error(userResponse.data.message);
      }

      const userId = userResponse.data.data._id;

      // Step 2: Create customer with offline registration
      const customerResponse = await axios.post("/customers/create-customer", {
        user_id: userId,
        registration_type: "offline",
        registration_fee_paid: false,
      });

      if (!customerResponse.data.success) {
        throw new Error(customerResponse.data.message);
      }

      const qrCodeValue = customerResponse.data.data.qr_code;

      // Step 3: Generate QR code using qrcode library
      const qrDataUrl = await QRCode.toDataURL(qrCodeValue, {
        width: 200,
        margin: 2,
      });
      setQrCodeUrl(qrDataUrl);
      setSuccessMessage("Customer created successfully! QR code generated.");

      // Reset form
      setFormData({
        role: "Customer",
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error("Error creating customer:", err);
      setErrors((prev) => ({
        ...prev,
        submit: err.response?.data?.message || "Failed to create customer",
      }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-xl shadow-md">
        <CardHeader className="bg-[#070149] rounded-t-md px-6 py-4">
          <CardTitle className="text-xl font-semibold text-white text-center">
            Create QR for Offline Customer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form autoComplete="off" className="space-y-4 mt-4">
            <div>
              <Label className="mb-4">Role</Label>
              <Input
                type="text"
                value="Customer"
                disabled
                className="bg-gray-200 text-gray-700 cursor-not-allowed"
              />
              {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
            </div>

            <div>
              <Label className="mb-4">Name</Label>
              <Input
                type="text"
                autoComplete="off"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Enter name"
              />
              {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
            </div>

            <div>
              <Label className="mb-4">Email</Label>
              <Input
                type="email"
                autoComplete="off"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                placeholder="Enter email"
              />
              {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
            </div>

            <div>
              <Label className="mb-4">Phone Number</Label>
              <Input
                type="text"
                autoComplete="off"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="Enter 10-digit phone number"
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            </div>

            <div>
              <Label className="mb-4">Password</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
                placeholder="Enter password"
              />
              {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
            </div>

            <div>
              <Label className="mb-4">Confirm Password</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                placeholder="Confirm password"
              />
              {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
            </div>

            <Button
              type="button"
              className="w-full mt-4 bg-[#070149] text-white hover:bg-[#1a165c]"
              onClick={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? "Creating..." : "Create QR for Offline Customer"}
            </Button>

            {errors.submit && <p className="text-sm text-red-500">{errors.submit}</p>}
            {successMessage && <p className="text-sm text-green-500">{successMessage}</p>}
          </form>

          {/* Display QR Code */}
          {qrCodeUrl && (
            <div className="mt-6 text-center">
              <h3 className="text-lg font-semibold">Generated QR Code</h3>
              <div className="flex justify-center mt-4">
                <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
              </div>
              <Button
                className="mt-4 bg-[#070149] text-white hover:bg-[#1a165c]"
                onClick={() => {
                  const link = document.createElement("a");
                  link.href = qrCodeUrl;
                  link.download = `qr_code_${formData.name || "customer"}.png`;
                  link.click();
                }}
              >
                Download QR Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
export default GenerateQr;