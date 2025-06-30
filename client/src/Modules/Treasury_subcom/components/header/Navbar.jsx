
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
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const TreasuryDashboardHeader = () => {
  const { user, setUser, logout } = useAuth();
  const [openAccount, setOpenAccount] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showSessionHistoryDialog, setShowSessionHistoryDialog] = useState(false);
  const [report, setReport] = useState(null);
  const [editData, setEditData] = useState({});
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Fetch session report
  const fetchSessionReport = async () => {
    try {
      if (!user?._id || typeof user._id !== "string") {
        throw new Error("User ID is missing or invalid.");
      }

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/treasurySubcom/fetch-session-report/${user._id}`,
        { withCredentials: true }
      );

      console.log("Session report response:", response.data);
      console.log("Transactions in report:", response.data?.data?.transactions?.length);

      if (response?.data?.success) {
        setReport(response.data.data);
        setError(null);
      } else {
        setError("No active session found.");
        setReport(null);
      }
    } catch (err) {
      console.error("Session report fetch error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      const message = err.response?.data?.message || "Failed to fetch session history.";
      setError(message);
      toast.error(message, {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  // Handle report button click
  const handleReport = async () => {
    await fetchSessionReport();
    setShowSessionHistoryDialog(true);
  };

  useEffect(() => {
    if (user) {
      setEditData({
        name: user.name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        treasury_subcom_id: user.treasury_subcom_id || "N/A",
      });
    }
  }, [user]);

  const handleHome = () => {
    navigate("/");
  };

  const handleSave = async () => {
    if (!editData.name || !editData.phone_number) {
      setError("Name and phone number are required");
      toast.error("Name and phone number are required", {
        position: "top-center",
        autoClose: 3000,
      });
      console.error("handleSave: Validation failed - missing required fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (editData.email && !emailRegex.test(editData.email)) {
      setError("Invalid email format");
      toast.error("Invalid email format", {
        position: "top-center",
        autoClose: 3000,
      });
      console.error("handleSave: Validation failed - invalid email format:", editData.email);
      return;
    }

    const phoneRegex = /^\d{10}$/;
    if (!phoneRegex.test(editData.phone_number)) {
      setError("Phone number must be 10 digits");
      toast.error("Phone number must be 10 digits", {
        position: "top-center",
        autoClose: 3000,
      });
      console.error("handleSave: Validation failed - invalid phone number format:", editData.phone_number);
      return;
    }

    try {
      setError(null);
      const res = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/users/update-user/${user._id}`,
        {
          name: editData.name,
          email: editData.email,
          phone_number: editData.phone_number,
        },
        { withCredentials: true }
      );
      setUser(res.data.data);
      setOpenAccount(false);
      toast.success("Account updated successfully!", {
        position: "top-center",
        autoClose: 3000,
      });
    } catch (err) {
      const message = err.response?.data?.message || "Failed to update account";
      console.error("handleSave: Error details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
      });
      setError(message);
      toast.error(message, {
        position: "top-center",
        autoClose: 3000,
      });
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("dropdownSubmitted");
    logout();
    setShowLogoutDialog(false);
  };

  if (!user) {
    console.warn("TreasuryDashboardHeader: No user data available");
    return null;
  }

  return (
    <>
      <header className="w-full bg-[#000052] text-white px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <img src={Pegasus} alt="Pegasus Logo" className="w-10 h-10 cursor-pointer" onClick={handleHome} />
          <div>
            <h1 className="text-base md:text-base font-bold tracking-wide cursor-pointer" onClick={handleHome}>
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
        <div className="text-right flex gap-2 items-center">
          <Button variant="secondary" className="cursor-pointer" onClick={handleReport}>
            Report
          </Button>
          <div className="flex flex-col gap-2">
            <p className="text-xs sm:text-sm md:text-sm lg:text-base font-medium text-white/70">
              Your Balance
            </p>
            <p className="text-base sm:text-lg md:text-lg lg:text-2xl font-semibold">
              ₹ {user.balance}
            </p>
          </div>
        </div>
      </header>

      {/* Account Edit Dialog */}
      <Dialog open={openAccount} onOpenChange={setOpenAccount}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Account Information</DialogTitle>
            <DialogDescription>
              You can update your personal details here.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <p className="text-red-500 text-sm mb-3">{error}</p>
          )}
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
                value={editData.phone_number || ""}
                onChange={(e) =>
                  setEditData({ ...editData, phone_number: e.target.value })
                }
              />
            </div>
            {user.role?.role_id === "role-3" && (
              <div>
                <label className="block text-sm font-medium mb-1">Treasury Subcom ID</label>
                <Input
                  value={editData.treasury_subcom_id || "N/A"}
                  disabled
                />
              </div>
            )}
          </div>
          <DialogFooter className="pt-4">
            <Button variant="default" onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Logout Dialog */}
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
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" /> Logout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Session History Dialog */}
      <Dialog open={showSessionHistoryDialog} onOpenChange={setShowSessionHistoryDialog}>
        <DialogContent className="sm:max-w-[600px] max-w-[90vw] max-h-[80vh] overflow-y-auto p-6">
          <DialogHeader>
            <DialogTitle>Session History</DialogTitle>
            <DialogDescription>
              Summary of your current session activity.
            </DialogDescription>
          </DialogHeader>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          {report ? (
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-lg">Session Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <p><strong>Start Time:</strong> {report.session.start_time}</p>
                  <p><strong>End Time:</strong> {report.session.end_time}</p>
                  <p><strong>Duration:</strong> {report.session.duration}</p>
                  <p><strong>Location:</strong> {report.session.location}</p>
                  <p><strong>UPI ID:</strong> {report.session.upi_id}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Payment Method Totals</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <p><strong>Cash Total:</strong> {report.payment_methods.cash_total}</p>
                  <p><strong>Mess Bill Total:</strong> {report.payment_methods.mess_bill_total}</p>
                  <p><strong>Gpay Total:</strong> {report.payment_methods.gpay_total}</p>
                  <p><strong>Other Total:</strong> {report.payment_methods.other_total}</p>
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-lg">All Payment Methods</h3>
                <ul className="list-disc pl-5 mt-2">
                  {report.payment_methods.all_methods.map((pm) => (
                    <li key={pm.method} className="text-gray-700">
                      {pm.method}: {pm.amount}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Transaction Types</h3>
                <ul className="list-disc pl-5 mt-2">
                  {report.transaction_types.map((tt) => (
                    <li key={tt.type} className="text-gray-700">
                      {tt.type}: {tt.count}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Transaction Summary</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                  <p><strong>Total Outgoing:</strong> {report.total_outgoing}</p>
                  <p><strong>Total Incoming:</strong> {report.total_incoming}</p>
                  <p><strong>Refund Outgoing Count:</strong> {report.refund_outgoing_count}</p>
                  <p><strong>TopUp Outgoing Count:</strong> {report.topup_outgoing_count}</p>
                </div>
              </div>
              {/* <div>
                <h3 className="font-semibold text-lg">Transactions</h3>
                {report.transactions.length > 0 ? (
                  <div className="overflow-x-hidden mt-2">
                    <Table className="w-full table-auto text-sm">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[100px] whitespace-nowrap">Date</TableHead>
                          <TableHead className="min-w-[80px] whitespace-nowrap">ID</TableHead>
                          <TableHead className="min-w-[100px] whitespace-nowrap">Type</TableHead>
                          <TableHead className="min-w-[120px] whitespace-nowrap">Payment Method</TableHead>
                          <TableHead className="min-w-[100px] whitespace-nowrap">Amount</TableHead>
                          <TableHead className="min-w-[150px] whitespace-nowrap">Description</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {report.transactions.map((txn) => (
                          <TableRow key={txn.id}>
                            <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
                              {txn.date}
                            </TableCell>
                            <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
                              {txn.id}
                            </TableCell>
                            <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
                              {txn.type}
                            </TableCell>
                            <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
                              {txn.payment_method}
                            </TableCell>
                            <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
                              {txn.amount}
                            </TableCell>
                            <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                              {txn.description}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-gray-500 mt-2">No transactions found for this session.</p>
                )}
              </div> */}
            </div>
          ) : (
            <p className="text-gray-500">No session data available.</p>
          )}
          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setShowSessionHistoryDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TreasuryDashboardHeader;
