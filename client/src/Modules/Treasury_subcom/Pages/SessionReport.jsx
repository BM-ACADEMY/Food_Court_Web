
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const BASE_URL = import.meta.env.VITE_BASE_URL; // Replace with your API base URL

const SessionReport = ({ userId, onLogout }) => {
  const [report, setReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState(null);

  // Fetch session report
  const fetchSessionReport = async () => {
    try {
      if (!userId || typeof userId !== "string") {
        throw new Error("User ID is missing or invalid.");
      }

      const response = await axios.get(`${BASE_URL}/treasurySubcom/fetch-session-report/${userId}`, {
        withCredentials: true,
      });

      if (response?.data?.success) {
        setReport(response.data.data);
        setError(null);
      } else {
        setError("No session report found.");
        setReport(null);
      }
    } catch (err) {
      console.error("Session report fetch error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      setError(err.response?.data?.message || "Failed to fetch session report.");
      setReport(null);
    }
  };

  // Handle logout button click
  const handleLogoutClick = async () => {
    await fetchSessionReport();
    setIsModalOpen(true);
  };

  // Handle confirm logout
  const handleConfirmLogout = async () => {
    try {
      // Update logout_time in LoginLog (optional, depends on your logout logic)
      await axios.post(
        `${BASE_URL}/auth/logout`,
        { userId },
        { withCredentials: true }
      );
      setIsModalOpen(false);
      onLogout(); // Call the parent logout function
    } catch (err) {
      console.error("Logout error:", err);
      setError("Failed to logout. Please try again.");
    }
  };

  return (
    <div>
      <Button onClick={handleLogoutClick} variant="destructive">
        Logout
      </Button>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Session Report</DialogTitle>
          </DialogHeader>
          {error && <p className="text-red-500">{error}</p>}
          {report ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold">Session Details</h3>
                <p><strong>Start Time:</strong> {report.session.start_time}</p>
                <p><strong>End Time:</strong> {report.session.end_time}</p>
                <p><strong>Duration:</strong> {report.session.duration}</p>
                <p><strong>Location:</strong> {report.session.location}</p>
                <p><strong>UPI ID:</strong> {report.session.upi_id}</p>
              </div>
              <div>
                <h3 className="font-semibold">Payment Methods</h3>
                <ul className="list-disc pl-5">
                  {report.payment_methods.map((pm) => (
                    <li key={pm.method}>
                      {pm.method}: {pm.amount}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Transaction Types</h3>
                <ul className="list-disc pl-5">
                  {report.transaction_types.map((tt) => (
                    <li key={tt.type}>
                      {tt.type}: {tt.count}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold">Total Top-Up Amount</h3>
                <p>{report.total_topup_amount}</p>
              </div>
            </div>
          ) : (
            <p>No session data available.</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmLogout}>Confirm Logout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SessionReport;