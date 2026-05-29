import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, ArrowRightLeft, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function MergeBalance() {
  const { user } = useAuth();
  const [sourceSearch, setSourceSearch] = useState("");
  const [targetSearch, setTargetSearch] = useState("");

  const [sourceUser, setSourceUser] = useState(null);
  const [targetUser, setTargetUser] = useState(null);

  const [isLoadingSource, setIsLoadingSource] = useState(false);
  const [isLoadingTarget, setIsLoadingTarget] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  // Verification Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Helper to fetch user and balance
  const fetchUserAndBalance = async (rawQuery, setLoader, setUser) => {
    if (!rawQuery) return;
    const query = rawQuery.replace(/\s+/g, ""); // Remove all whitespace (handles spaces in phone numbers)
    
    setLoader(true);
    setUser(null);
    try {
      // First, find the user
      // Assuming a generic search endpoint exists or fetching all and filtering
      const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/users/fetch-all-users`, {
        withCredentials: true,
      });

      const users = res.data.data || [];
      const foundUser = users.find(
        (u) =>
          u.phone_number === query ||
          u.email === query ||
          u._id === query ||
          u.customer_id === query // In case customer_id is what they mean by UserID
      );

      if (!foundUser) {
        toast.error(`No user found for query: ${query}`);
        setLoader(false);
        return;
      }

      // Fetch balance for the found user
      const balRes = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/user-balance/fetch-balance-by-id/${foundUser._id}`,
        { withCredentials: true }
      );

      const balance = balRes.data.data?.balance || "0.00";

      setUser({
        _id: foundUser._id,
        name: foundUser.name,
        phone_number: foundUser.phone_number,
        email: foundUser.email,
        role: foundUser.role_id?.name,
        balance,
      });
    } catch (err) {
      console.error("Error fetching user data:", err);
      toast.error("Failed to fetch user or balance.");
    } finally {
      setLoader(false);
    }
  };

  const handleMerge = async () => {
    if (!sourceUser || !targetUser) {
      toast.error("Please select both source and target accounts.");
      return;
    }

    if (sourceUser._id === targetUser._id) {
      toast.error("Cannot merge an account into itself.");
      return;
    }

    if (parseFloat(sourceUser.balance) <= 0) {
      toast.error("Source account has zero balance.");
      return;
    }

    // Open verification modal instead of window.confirm
    setIsModalOpen(true);
  };

  const handleVerifyAndMerge = async () => {
    if (!adminEmail || !adminPassword) {
      toast.error("Please enter your email and password.");
      return;
    }

    setIsVerifying(true);
    try {
      // 1. Verify credentials using the verify-credentials endpoint
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/users/verify-credentials`,
        { 
          emailOrPhone: adminEmail, 
          password: adminPassword,
          user_id: user?._id
        },
        { withCredentials: true }
      );

      if (!response.data.isValid) {
        toast.error("Invalid credentials. Verification failed.");
        setIsVerifying(false);
        return;
      }

      // 2. If verification passes, execute the merge
      setIsModalOpen(false);
      setIsMerging(true);

      const res = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/user-balance/merge-balance`,
        {
          source_user_id: sourceUser._id,
          target_user_id: targetUser._id,
        },
        { withCredentials: true }
      );

      toast.success(res.data.message || "Balance merged successfully!");
      
      // Reset everything
      setSourceUser(null);
      setTargetUser(null);
      setSourceSearch("");
      setTargetSearch("");
      setAdminEmail("");
      setAdminPassword("");
    } catch (err) {
      console.error("Verification/Merge error:", err);
      // Determine if error came from login or merge
      if (err.response?.status === 401 || err.response?.status === 404) {
         toast.error("Invalid credentials. Verification failed.");
      } else {
         toast.error(err.response?.data?.message || "Failed to merge balance.");
      }
    } finally {
      setIsVerifying(false);
      setIsMerging(false);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[#000052]">Universal Balance Merge</h1>
        <p className="text-gray-500 mt-2">
          Transfer the full balance from any source account (offline or online) to any target account.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Source Account */}
        <Card className="border-t-4 border-t-red-500 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-red-600 flex items-center gap-2">
              <Wallet size={20} /> Source Account (Sender)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by Phone, Email or UserID..."
                value={sourceSearch}
                onChange={(e) => setSourceSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchUserAndBalance(sourceSearch, setIsLoadingSource, setSourceUser);
                }}
              />
              <Button
                variant="outline"
                onClick={() => fetchUserAndBalance(sourceSearch, setIsLoadingSource, setSourceUser)}
                disabled={isLoadingSource}
              >
                {isLoadingSource ? "..." : <Search size={16} />}
              </Button>
            </div>

            {sourceUser && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                <h3 className="font-bold text-gray-800 text-lg">{sourceUser.name}</h3>
                <p className="text-sm text-gray-500">{sourceUser.phone_number} | {sourceUser.email || "No Email"}</p>
                <div className="mt-4 flex justify-between items-center bg-white p-3 rounded border shadow-sm">
                  <span className="text-gray-600 font-medium">Available Balance</span>
                  <span className="text-xl font-bold text-red-600">₹{sourceUser.balance}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Target Account */}
        <Card className="border-t-4 border-t-green-500 shadow-md">
          <CardHeader>
            <CardTitle className="text-xl text-green-600 flex items-center gap-2">
              <Wallet size={20} /> Target Account (Receiver)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Search by Phone, Email or UserID..."
                value={targetSearch}
                onChange={(e) => setTargetSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") fetchUserAndBalance(targetSearch, setIsLoadingTarget, setTargetUser);
                }}
              />
              <Button
                variant="outline"
                onClick={() => fetchUserAndBalance(targetSearch, setIsLoadingTarget, setTargetUser)}
                disabled={isLoadingTarget}
              >
                {isLoadingTarget ? "..." : <Search size={16} />}
              </Button>
            </div>

            {targetUser && (
              <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                <h3 className="font-bold text-gray-800 text-lg">{targetUser.name}</h3>
                <p className="text-sm text-gray-500">{targetUser.phone_number} | {targetUser.email || "No Email"}</p>
                <div className="mt-4 flex justify-between items-center bg-white p-3 rounded border shadow-sm">
                  <span className="text-gray-600 font-medium">Current Balance</span>
                  <span className="text-xl font-bold text-green-600">₹{targetUser.balance}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Merge Action */}
      <div className="flex justify-center pt-6">
        <Button
          size="lg"
          className="bg-[#000052] hover:bg-[#000052]/90 text-white gap-2 px-10 h-14 text-lg w-full md:w-auto shadow-xl"
          onClick={handleMerge}
          disabled={!sourceUser || !targetUser || isMerging || parseFloat(sourceUser.balance) <= 0}
        >
          {isMerging ? (
            "Merging Balances..."
          ) : (
            <>
              Merge ₹{sourceUser ? sourceUser.balance : "0.00"} <ArrowRightLeft />
            </>
          )}
        </Button>
      </div>

      {/* Security Verification Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl border-0">
            <CardHeader className="bg-[#000052] text-white rounded-t-lg">
              <CardTitle className="text-xl">Security Verification</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded text-sm text-yellow-800">
                You are about to transfer <strong>₹{sourceUser?.balance}</strong> from <strong>{sourceUser?.name}</strong> to <strong>{targetUser?.name}</strong>.
                <br />Please enter your admin credentials to authorize this action.
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="adminEmail">Email / Phone</Label>
                <Input
                  id="adminEmail"
                  placeholder="admin@example.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPassword">Password</Label>
                <Input
                  id="adminPassword"
                  type="password"
                  placeholder="Enter your password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleVerifyAndMerge();
                  }}
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsModalOpen(false);
                    setAdminEmail("");
                    setAdminPassword("");
                  }}
                  disabled={isVerifying}
                >
                  Cancel
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white" 
                  onClick={handleVerifyAndMerge}
                  disabled={isVerifying || !adminEmail || !adminPassword}
                >
                  {isVerifying ? "Verifying..." : "Verify & Merge"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
