import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const MobileOtp = ({ phone, onBack }) => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [error, setError] = useState("");
  const inputRefs = useRef([]);
  const navigate = useNavigate();

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/\D/, "");
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    const key = e.key;
    if (key === "Backspace") {
      if (otp[index]) {
        const newOtp = [...otp];
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else if (key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const fullOtp = otp.join("");
    if (fullOtp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    try {
      const response = await axios.post("/api/verify-login-otp", {
        phone,
        otp: fullOtp,
      });

      if (response.data.success) {
        // Assuming response includes user data and token
        // Save token to localStorage or context for authentication
        localStorage.setItem("token", response.data.token);
        navigate("/"); // Redirect to home page
      } else {
        setError(response.data.message || "Invalid OTP");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    }
  };

  return (
    <div className="z-10 w-full max-w-md mx-auto mt-6 px-4 sm:px-6 lg:px-8">
      <div className="shadow-xl rounded-2xl overflow-hidden border bg-white">
        <div className="bg-[#00004d] py-4 px-6 text-center rounded-t-2xl">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Enter OTP</h2>
        </div>
        <div className="p-6 sm:p-8">
          {error && <p className="text-red-500 text-center mb-4">{error}</p>}
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-6">
            Enter the 6-digit OTP sent to <strong>{phone}</strong>
          </p>
          <div className="flex justify-center gap-1 sm:gap-1 mb-6">
            {otp.map((digit, idx) => (
              <Input
                key={idx}
                ref={(el) => (inputRefs.current[idx] = el)}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(e, idx)}
                onKeyDown={(e) => handleKeyDown(e, idx)}
                className="w-10 h-10 sm:w-12 sm:h-12 text-center text-lg sm:text-xl font-bold tracking-widest border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
              />
            ))}
          </div>
          <Button
            onClick={handleVerify}
            className="w-full bg-[#05025b] hover:bg-[#1a1a7b] text-base sm:text-lg"
          >
            Verify
          </Button>
          <div className="mt-6 text-center">
            <button 
              type="button"
              onClick={onBack}
              className="text-sm sm:text-base text-[#05025b] hover:underline"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileOtp;