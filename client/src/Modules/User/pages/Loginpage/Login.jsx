// LoginForm.jsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const LoginForm = ({ onBack, onForgotPassword, onLoginWithOtp }) => {
  return (
    <div className="z-10 w-full max-w-md mt-6 shadow-xl rounded-2xl overflow-hidden border bg-white">
      {/* Header */}
      <div className="bg-[#00004d] py-5 px-6 text-center rounded-t-2xl">
        <h2 className="text-3xl font-bold text-white">Welcome Back</h2>
      </div>

      {/* Form Fields */}
      <div className="p-8 space-y-6">
        <div>
          <Label htmlFor="email" className="text-base font-medium">
            Email or Phone Number
          </Label>
          <Input
            id="email"
            type="text"
            placeholder="Enter your email or phone"
            className="mt-1 h-12 text-base"
          />
        </div>

        <div>
          <Label htmlFor="password" className="text-base font-medium">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            className="mt-1 h-12 text-base"
          />
        </div>

        <div className="flex items-center justify-between text-sm sm:text-base">
          <label className="flex items-center space-x-2">
            <input type="checkbox" className="w-4 h-4" />
            <span>Remember me</span>
          </label>
          <button
            onClick={onForgotPassword}
            className="text-[#05025b] hover:underline"
          >
            Forgot password?
          </button>
        </div>

        {/* Login Button */}
        <Button className="w-full h-12 text-lg bg-[#05025b] hover:bg-[#1a1a7b]">
          Login with Password
        </Button>

        {/* Divider */}
        <div className="flex items-center my-4">
          <hr className="flex-grow border-gray-300" />
          <span className="px-2 text-sm sm:text-base text-gray-500">or</span>
          <hr className="flex-grow border-gray-300" />
        </div>

        {/* OTP Button */}
        <Button
          variant="outline"
          className="w-full h-12 text-lg border-[#05025b] text-[#05025b] hover:bg-[#f0f0ff]"
          onClick={onLoginWithOtp}
        >
          Login with OTP
        </Button>

        {/* Back Button */}
        <div className="text-center mt-4">
          <button
            onClick={onBack}
            className="text-sm sm:text-base text-[#05025b] hover:underline"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
