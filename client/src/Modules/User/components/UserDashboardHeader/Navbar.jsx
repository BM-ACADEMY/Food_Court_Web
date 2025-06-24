"use client";

import React, { useState, useEffect } from "react";
import Pegasus from "@/assets/pegasus.png";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronsUpDown, LogOut, User, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

const UserDashboardHeader = () => {
  const { user, setUser, logout } = useAuth();
  const [openAccount, setOpenAccount] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    if (user) {
      setEditData({ ...user });
    }
  }, [user]);

  const handleSave = async () => {
    try {
      const res = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/users/${user._id}`,
        editData,
        { withCredentials: true }
      );
      setUser(res.data.data);
      setOpenAccount(false);
      console.log("User updated:", res.data.data);
    } catch (err) {
      console.error("Failed to update user:", err);
    }
  };

  if (!user) return null;

  return (
    <>
      <header className="w-full bg-[#000052] text-white px-6 py-4 flex items-center justify-between shadow-md">
        {/* Left */}
        <div className="flex items-center gap-3">
          <img src={Pegasus} alt="Pegasus Logo" className="w-10 h-10" />
          <div>
            <h1 className="text-base md:text-base font-bold tracking-wide">
              PEGASUS 2K25
            </h1>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center text-sm md:text-xs font-medium text-white/80 hover:underline">
                  {user.name}
                  <span className="ml-1 text-white/60">
                    ({user.role?.name || "User"})
                  </span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 text-white/50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="mt-1 bg-white text-black shadow-lg"
              >
                <DropdownMenuItem
                  className="gap-2"
                  onClick={() => setOpenAccount(true)}
                >
                  <User className="h-4 w-4" /> Account
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 text-red-600"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Right */}
        <div className="text-right">
          <p className="text-xs sm:text-sm md:text-sm lg:text-base font-medium text-white/70">
            Your Balance
          </p>
          <p className="text-base sm:text-lg md:text-lg lg:text-2xl font-semibold">
            ₹ {user.balance}
          </p>
        </div>
      </header>

      {/* Edit Account Dialog */}
      <Dialog open={openAccount} onOpenChange={setOpenAccount}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Account Information</DialogTitle>
            <DialogDescription>
              You can update your personal details here.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <Input
                value={editData.name || ""}
                onChange={(e) =>
                  setEditData({ ...editData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={editData.email || ""}
                onChange={(e) =>
                  setEditData({ ...editData, email: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input
                value={editData.phone || ""}
                onChange={(e) =>
                  setEditData({ ...editData, phone: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Customer ID
              </label>
              <Input
                value={editData.customerId || ""}
                onChange={(e) =>
                  setEditData({ ...editData, customerId: e.target.value })
                }
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="default" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={logout}
            >
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserDashboardHeader;