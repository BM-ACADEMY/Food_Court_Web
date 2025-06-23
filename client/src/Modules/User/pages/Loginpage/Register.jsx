import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const RegisterForm = ({ onClose, onOtpSent }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    // Add form validation here
    onOtpSent(); // Call OTP handler after form submit
  };

  return (
    <div className="z-10 w-full max-w-md mt-6 shadow-xl rounded-2xl overflow-hidden border bg-white">
      {/* Header */}
      <div className="bg-[#00004d] py-5 px-6 text-center rounded-t-2xl">
        <h2 className="text-3xl font-bold text-white">Create Your Account</h2>
      </div>

      {/* Form Body */}
      <div className="p-8">
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Full Name */}
          <div>
            <Label htmlFor="fullName" className="text-base font-medium">
              Full Name
            </Label>
            <Input
              id="fullName"
              placeholder="Enter your full name"
              className="text-base py-4 h-12"
            />
          </div>

          {/* Email */}
          <div>
            <Label htmlFor="email" className="text-base font-medium">
              Email Address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              className="text-base py-4 h-12"
            />
          </div>

          {/* Phone */}
          <div>
            <Label htmlFor="phone" className="text-base font-medium">
              Phone Number
            </Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter your phone number"
              className="text-base py-4 h-12"
            />
          </div>

          {/* Password */}
          <div>
            <Label htmlFor="password" className="text-base font-medium">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Create a password"
              className="text-base py-4 h-12"
            />
          </div>

          {/* Confirm Password */}
          <div>
            <Label htmlFor="confirmPassword" className="text-base font-medium">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              className="text-base py-4 h-12"
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full text-lg font-semibold py-4 h-14 bg-[#05025b] hover:bg-[#1a1a7b]"
          >
            Send OTP
          </Button>
        </form>

        {/* Back to Home */}
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
