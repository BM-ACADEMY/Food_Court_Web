
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { toast,Bounce   } from "react-toastify";

export default function EditAccountModal({ open, onClose }) {
  const { user, setUser } = useAuth();

  // Initialize state with user data
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phone_number || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    // Validate password and confirmPassword
    if (password && password !== confirmPassword) {
      toast.error("Passwords do not match", {
        position: "top-center",
        autoClose: 5000,
        theme: "colored",
        transition: Bounce,
      });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name,
        email,
        phone_number: phoneNumber,
        ...(password && { password }), // Only include password if provided
      };

      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/users/update-user/${user._id}`,
        payload,
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        }
      );

      
      if (response) {
        // Update user context with new data
        setUser((prev) => ({
          ...prev,
          name,
          email,
          phone_number: phoneNumber,
        }));
        onClose();
        toast.success(`User updated successfully`, {
          position: "top-center",
          autoClose: 5000,
          theme: "colored",
          transition: Bounce,
        });
      }
    } catch (error) {
      console.error("Update failed:", error);
      toast.error(error.response?.data?.message || "Something went wrong", {
        position: "top-center",
        autoClose: 5000,
        theme: "colored",
        transition: Bounce,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-[#00004D] font-bold">Edit Account</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="phone_number">Phone Number</Label>
            <Input
              id="phone_number"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Leave blank to keep current"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="confirm_password">Confirm Password</Label>
            <Input
              id="confirm_password"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            className="bg-[#00004D]"
            disabled={loading || !name || !email}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
