// ResetPasswordForm.jsx
import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const ResetPasswordForm = ({ onBack }) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleReset = () => {
    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    // API call to reset password here
    alert("Password successfully reset!");
    // You can redirect to login or show success message
  };

  return (
    <div className="z-10 w-full max-w-md mt-6 shadow-xl rounded-2xl overflow-hidden border bg-white">
      {/* Header */}
      <div className="bg-[#00004d] py-5 px-6 text-center rounded-t-2xl">
        <h2 className="text-2xl font-bold text-white">Reset Password</h2>
      </div>

      {/* Body */}
      <div className="p-8 space-y-6">
        <div>
          <Label htmlFor="new-password" className="text-base font-medium">
            New Password
          </Label>
          <Input
            id="new-password"
            type="password"
            placeholder="Enter new password"
            className="mt-1 h-12 text-base"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="confirm-password" className="text-base font-medium">
            Confirm Password
          </Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="Re-enter new password"
            className="mt-1 h-12 text-base"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>

        <Button
          onClick={handleReset}
          className="w-full h-12 text-lg bg-[#05025b] hover:bg-[#1a1a7b]"
        >
          Reset Password
        </Button>

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

export default ResetPasswordForm;
