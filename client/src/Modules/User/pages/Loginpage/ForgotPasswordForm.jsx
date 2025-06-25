// ForgotPasswordForm.jsx
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const ForgotPasswordForm = ({ onBack }) => {
  return (
    <div className="z-10 w-full max-w-md mt-6 shadow-xl rounded-2xl overflow-hidden border bg-white">
      <div className="bg-[#00004d] py-4 px-6 text-center rounded-t-2xl">
        <h2 className="text-2xl font-bold text-white">Reset Your Password</h2>
      </div>
      <div className="p-8 space-y-6">
        <p className="text-center text-sm text-muted-foreground">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        <div>
          <Label htmlFor="email" className="text-base font-medium">
            Email Address
          </Label>
          <Input id="email" placeholder="Enter your email address" className="mt-1 h-12 text-base" />
        </div>
        <Button className="w-full h-12 text-lg bg-[#05025b] hover:bg-[#1a1a7b]">
          Send Reset Link
        </Button>
        <div className="text-center mt-4">
          <button onClick={onBack} className="text-base text-[#05025b] hover:underline">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordForm;
