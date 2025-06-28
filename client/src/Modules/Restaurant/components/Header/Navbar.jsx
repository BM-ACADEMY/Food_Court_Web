import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_BASE_URL,{
   withCredentials: true,
});

const RestaurantNavbar = () => {
  const { user, logout, setUser, fetchUser } = useAuth();
  const navigate = useNavigate();

  const [openAccount, setOpenAccount] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [editData, setEditData] = useState({
    name: "",
    email: "",
    phone: "",
    restaurantId: "",
  });

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone_number || "",
        restaurantId: user.restaurant_id || "N/A",
      });
    }
  }, [user]);

  useEffect(() => {
    if (user?._id) {
      socket.emit("joinRestaurantRoom", user._id.toString());
      socket.on("connect", () => console.log("WebSocket connected"));
      socket.on("newTransaction", async (data) => {
        console.log("🔔 New transaction in RestaurantNavbar:", data);
        try {
          const balanceRes = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/user-balance/fetch-balance-by-id/${user._id}`,
            { withCredentials: true }
          );
          setUser({ ...user, balance: balanceRes.data.data.balance || "0.00" });
        } catch (error) {
          console.error("Failed to fetch balance:", error);
        }
      });

      return () => {
        socket.off("newTransaction");
        socket.off("connect");
      };
    }
  }, [user?._id, setUser]);

  const handleSave = async () => {
    try {
      if (!editData.name || !editData.email || !editData.phone) {
        toast.error("All fields are required");
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editData.email)) {
        toast.error("Invalid email format");
        return;
      }

      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(editData.phone)) {
        toast.error("Phone number must be 10 digits");
        return;
      }

      const restaurantResponse = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/restaurants/update-restaurant/${user.r_id}`,
        { restaurant_name: editData.name },
        { withCredentials: true }
      );

      const userResponse = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/users/update-user/${user._id}`,
        {
          name: editData.name,
          email: editData.email,
          phone_number: editData.phone,
        },
        { withCredentials: true }
      );

      setUser({
        ...user,
        name: userResponse.data.data.name,
        email: userResponse.data.data.email,
        phone_number: userResponse.data.data.phone_number,
        restaurant_id: restaurantResponse.data.data.restaurant_id,
      });
      await fetchUser();
      setOpenAccount(false);
      toast.success("Details updated successfully!");
    } catch (err) {
      console.error("Update failed:", err.response?.data || err);
      toast.error("Update failed. Please try again.");
    }
  };

  if (!user) {
    return <div className="text-white bg-[#000052] p-4">Loading...</div>;
  }

  return (
    <>
      <header className="w-full bg-[#000052] text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/restaurant")} className="focus:outline-none">
            <img src={Pegasus} alt="Pegasus Logo" className="w-10 h-10" />
          </button>
          <div>
            <h1 className="text-base md:text-base font-bold tracking-wide">
              PEGASUS 2K25
            </h1>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center text-sm md:text-xs font-medium text-white/80 hover:underline">
                  {user.name}
                  <span className="ml-1 text-white/60">
                    ({user.role?.name || "Restaurant"})
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
        <div className="text-right">
          <p className="text-xs sm:text-sm md:text-sm lg:text-base font-medium text-white/70">
            Your Balance
          </p>
          <p className="text-base sm:text-lg md:text-lg lg:text-2xl font-semibold">
            ₹ {user.balance}
          </p>
        </div>
      </header>

      <Dialog open={openAccount} onOpenChange={setOpenAccount}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Account Information</DialogTitle>
            <DialogDescription>
              You can update your restaurant details here.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Restaurant Name</label>
              <Input
                value={editData.name}
                onChange={(e) =>
                  setEditData({ ...editData, name: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <Input
                type="email"
                value={editData.email}
                onChange={(e) =>
                  setEditData({ ...editData, email: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <Input
                value={editData.phone}
                onChange={(e) =>
                  setEditData({ ...editData, phone: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Restaurant ID</label>
              <Input value={editData.restaurantId} disabled />
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

      <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of your account?
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
              onClick={async () => {
                await logout();
                setShowLogoutDialog(false);
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default RestaurantNavbar;