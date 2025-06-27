// import React from "react";
// import { Input } from "@/components/ui/input";
// import { Button } from "@/components/ui/button";
// import { Label } from "@/components/ui/label";

// const RegisterForm = ({ onClose, onOtpSent }) => {
//   const handleSubmit = (e) => {
//     e.preventDefault();
//     // Add form validation here
//     onOtpSent(); // Call OTP handler after form submit
//   };

//   return (
//     <div className="z-10 w-full max-w-md mt-6 shadow-xl rounded-2xl overflow-hidden border bg-white">
//       {/* Header */}
//       <div className="bg-[#00004d] py-5 px-6 text-center rounded-t-2xl">
//         <h2 className="text-3xl font-bold text-white">Create Your Account</h2>
//       </div>

//       {/* Form Body */}
//       <div className="p-8">
//         <form className="space-y-6" onSubmit={handleSubmit}>
//           {/* Full Name */}
//           <div>
//             <Label htmlFor="fullName" className="text-base font-medium">
//               Full Name
//             </Label>
//             <Input
//               id="fullName"
//               placeholder="Enter your full name"
//               className="text-base py-4 h-12"
//             />
//           </div>

//           {/* Email */}
//           <div>
//             <Label htmlFor="email" className="text-base font-medium">
//               Email Address
//             </Label>
//             <Input
//               id="email"
//               type="email"
//               placeholder="Enter your email"
//               className="text-base py-4 h-12"
//             />
//           </div>

//           {/* Phone */}
//           <div>
//             <Label htmlFor="phone" className="text-base font-medium">
//               Phone Number
//             </Label>
//             <Input
//               id="phone"
//               type="tel"
//               placeholder="Enter your phone number"
//               className="text-base py-4 h-12"
//             />
//           </div>

//           {/* Password */}
//           <div>
//             <Label htmlFor="password" className="text-base font-medium">
//               Password
//             </Label>
//             <Input
//               id="password"
//               type="password"
//               placeholder="Create a password"
//               className="text-base py-4 h-12"
//             />
//           </div>

//           {/* Confirm Password */}
//           <div>
//             <Label htmlFor="confirmPassword" className="text-base font-medium">
//               Confirm Password
//             </Label>
//             <Input
//               id="confirmPassword"
//               type="password"
//               placeholder="Confirm your password"
//               className="text-base py-4 h-12"
//             />
//           </div>

//           {/* Submit Button */}
//           <Button
//             type="submit"
//             className="w-full text-lg font-semibold py-4 h-14 bg-[#05025b] hover:bg-[#1a1a7b]"
//           >
//             Send OTP
//           </Button>
//         </form>

//         {/* Back to Home */}
//         <div className="mt-6 text-center">
//           <button
//             onClick={onClose}
//             className="text-base text-[#05025b] hover:underline"
//           >
//             Back to Home
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default RegisterForm;



import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import axios from "axios";

const RegisterForm = ({ onClose, onOtpSent }) => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [roles, setRoles] = useState([]);
  const [customerRoleId, setCustomerRoleId] = useState(null);
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/roles/fetch-all-roles`);
        console.log(res.data.data,"roel");
        
        const customerRole = res.data.data.find((role) => role.role_id === "role-5");
        if (customerRole) setCustomerRoleId(customerRole._id);
      } catch (err) {
        console.error("Failed to fetch roles", err);
      }
    };

    fetchRoles();
  }, []);

const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");

  // Basic validation
  if (formData.password !== formData.confirmPassword) {
    setError("Passwords do not match");
    return;
  }
  if (formData.phone.length !== 10) {
    setError("Phone number must be 10 digits");
    return;
  }

  try {
    // Step 1: Register user
    const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/create-user`, {
      name: formData.fullName,
      email: formData.email,
      phone_number: formData.phone,
      password: formData.password,
      confirm_password: formData.confirmPassword,
      role_id: customerRoleId, // role-5
    });

    if (response.data.success) {
      const userId = response.data.data._id;

      // Step 2: Create customer entry
      await axios.post(`${import.meta.env.VITE_BASE_URL}/customers/create-customer`, {
        user_id: userId,
        registration_type: "online",
      });

      // Step 3: Go to OTP screen
      onOtpSent(formData.phone);
    } else {
      setError(response.data.message || "Registration failed");
    }
  } catch (err) {
    setError(err.response?.data?.message || "An error occurred");
  }
};


  return (
    <div className="z-10 w-full max-w-md mt-6 shadow-xl rounded-2xl overflow-hidden border bg-white">
      <div className="bg-[#00004d] py-5 px-6 text-center rounded-t-2xl">
        <h2 className="text-3xl font-bold text-white">Create Your Account</h2>
      </div>
      <div className="p-8">
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="fullName" className="text-base font-medium">
              Full Name
            </Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              className="text-base py-4 h-12"
              value={formData.fullName}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="email" className="text-base font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="text-base py-4 h-12"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="phone" className="text-base font-medium">
              Phone Number
            </Label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2 bg-gray-200 rounded text-base text-gray-700">+91</span>
              <Input
                id="phone"
                type="tel"
                maxLength={10}
                placeholder="Enter 10-digit phone number"
                className="text-base py-4 h-12"
                value={formData.phone}
                onChange={(e) => handleChange({ target: { id: "phone", value: e.target.value.replace(/\D/g, "") } })}
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="password" className="text-base font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              className="text-base py-4 h-12"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword" className="text-base font-medium">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              className="text-base py-4 h-12"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full text-lg font-semibold py-4 h-14 bg-[#05025b] hover:bg-[#1a1a7b]"
          >
            Send OTP
          </Button>
        </form>
        <div className="mt-6 text-center">
          <button
            onClick={onClose}
            className="text-base text-[#05025b] hover:underline"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterForm;