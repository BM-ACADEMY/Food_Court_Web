import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import axios from "axios";

const MobileLogin = ({ onOtpSent, onBack }) => {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      // Check if user exists and send OTP
      const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/users/send-otp-number`, {
        phone_number: `${phone}`,
      });

      if (response.data.success) {
        onOtpSent(`${phone}`);
      } else {
        setError(response.data.message || "Failed to send OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "An error occurred");
    }
  };

  return (
    <div className="z-10 w-full max-w-md mt-6 shadow-xl rounded-2xl overflow-hidden border bg-white">
      <div className="bg-[#00004d] py-4 px-6 text-center rounded-t-2xl">
        <h2 className="text-2xl font-bold text-white">Login with Mobile</h2>
      </div>
      <div className="p-8 space-y-6">
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <div>
          <Label htmlFor="phone" className="text-base font-medium">
            Mobile Number
          </Label>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-3 py-2 bg-gray-200 rounded text-base text-gray-700">+91</span>
            <Input
              id="phone"
              type="tel"
              maxLength={10}
              placeholder="Enter 10-digit mobile number"
              className="h-12 text-base"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
            />
          </div>
        </div>
        <Button
          onClick={handleSendOtp}
          className="w-full h-12 text-lg bg-[#05025b] hover:bg-[#1a1a7b]"
        >
          Send OTP
        </Button>
        <div className="text-center mt-4">
          <button onClick={onBack} className="text-sm sm:text-base text-[#05025b] hover:underline">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileLogin;