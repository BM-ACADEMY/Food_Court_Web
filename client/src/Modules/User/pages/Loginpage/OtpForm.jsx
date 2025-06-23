import React, { useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const OtpForm = ({ onBack }) => {
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const inputRefs = useRef([]);

  const handleChange = (e, index) => {
    const value = e.target.value.replace(/[^0-9]/g, "");
    if (!value && e.nativeEvent.inputType !== "deleteContentBackward") return;

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

  const handleVerify = () => {
    const fullOtp = otp.join("");
    console.log("Verifying OTP:", fullOtp);
    // Add OTP verification logic here
  };

  return (
    <div className="z-10 w-full max-w-md mx-auto mt-6 px-4 sm:px-6 lg:px-8">
      <div className="shadow-xl rounded-2xl overflow-hidden border bg-white">
        {/* Header */}
        <div className="bg-[#00004d] py-4 px-6 text-center rounded-t-2xl">
          <h2 className="text-xl sm:text-2xl font-bold text-white">Verify OTP</h2>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8">
          <p className="text-center text-sm sm:text-base text-muted-foreground mb-6">
            Enter the 6-digit code sent to your email/phone
          </p>

          {/* OTP Inputs */}
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

export default OtpForm;
