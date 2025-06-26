import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QrCode, ScanLine } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";

export default function CustomerHistory() {
  const [showDetails, setShowDetails] = useState(false);
  const [scannedData, setScannedData] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:4000/api";

  // Start QR scanner
  const startScanner = async () => {
    setCameraError("");
    setError("");
    try {
      if (html5QrCodeRef.current) {
        await stopScanner();
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 300, height: 350 } },
        handleScanSuccess,
        (error) => console.warn("QR scan error:", error)
      );
    } catch (err) {
      console.error("Camera start failed:", err);
      setCameraError("Failed to access camera. Please check permissions or try another device.");
      html5QrCodeRef.current = null;
    }
  };

  // Stop QR scanner
  const stopScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.error("Stop scanner failed:", err);
      } finally {
        html5QrCodeRef.current = null;
      }
    }
  };

  // Handle successful QR scan
  const handleScanSuccess = async (decodedText) => {
    if (typeof decodedText !== "string" || decodedText.trim() === "") {
      setError("Invalid QR code. Please scan a valid QR code.");
      await stopScanner();
      return;
    }

    const qrString = decodedText.trim();
    console.log("Scanned QR string:", qrString);
    setLoading(true);
    setError("");

    try {
      const qrCode = encodeURIComponent(qrString);

      // Fetch customer data
      let customerResponse;
      let retries = 3;
      while (retries > 0) {
        try {
          customerResponse = await axios.get(
            `${BASE_URL}/customers/fetch-by-qr?qr_code=${qrCode}`,
            { withCredentials: true }
          );
          break;
        } catch (err) {
          if (err.response?.status === 500 && retries > 1) {
            retries--;
            console.warn(`Retrying /fetch-by-qr (attempt ${4 - retries})`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }
          throw err;
        }
      }

      console.log("Customer response:", customerResponse.data);

      if (!customerResponse?.data?.success) {
        throw new Error(customerResponse?.data?.message || "Customer not found.");
      }

      const { customer_id, user_id, status, registration_type, created_at } = customerResponse.data.data;

      // Log user_id for debugging
      console.log("User ID from QR scan:", user_id);

      // Fetch customer details
      let detailsResponse;
      retries = 3;
      while (retries > 0) {
        try {
          detailsResponse = await axios.get(
            `${BASE_URL}/customers/fetch-customer-details-by-qr?qr_code=${qrCode}`,
            { withCredentials: true }
          );
          break;
        } catch (err) {
          if (err.response?.status === 500 && retries > 1) {
            retries--;
            console.warn(`Retrying /fetch-customer-details-by-qr (attempt ${4 - retries})`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }
          throw err;
        }
      }

      console.log("Customer details response:", detailsResponse.data);

      if (!detailsResponse?.data?.success) {
        throw new Error(detailsResponse?.data?.message || "Customer details not found.");
      }

      const customerData = detailsResponse.data.data;

      const balanceValue =
        customerData.balance && customerData.balance !== "Payment not done yet"
          ? parseFloat(customerData.balance.toString())
          : 0;

      const newScannedData = {
        customerId: customer_id || "N/A",
        userId: user_id || "N/A",
        name: customerData.name || "N/A",
        phone: customerData.phone_number || "N/A",
        email: customerData.email || "N/A",
        currentBalance: balanceValue,
        registrationDate: created_at
          ? new Date(created_at).toLocaleDateString()
          : "20 Jan 2024",
        status: status || "Unknown",
        customerType: registration_type || "Unknown",
      };

      console.log("Scanned customer data:", newScannedData);
      setScannedData(newScannedData);
      setShowDetails(true);
      setScannerOpen(false);
      await stopScanner();

      // Fetch transactions using the user_id
      if (user_id) {
        await fetchTransactions(user_id);
      } else {
        setError("No user_id found for transactions.");
        setTransactions([]);
        setFilteredTransactions([]);
      }
    } catch (err) {
      console.error("API error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      if (err.response?.status === 401) {
        setError("Authentication failed. Please log in and try again.");
      } else if (err.response?.status === 404) {
        setError(err.response?.data?.message || "Customer not found for this QR code.");
      } else {
        setError(
          err.response?.data?.message ||
            "Failed to fetch customer details. Please try again or contact support."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch transaction history for the user
  const fetchTransactions = async (userId) => {
    try {
      // Log userId for debugging
      console.log("Fetching transactions for userId:", userId);

      // Basic validation to ensure userId is a non-empty string
      if (!userId || typeof userId !== "string") {
        throw new Error("User ID is missing or invalid.");
      }

      let response;
      let retries = 3;
      while (retries > 0) {
        try {
          response = await axios.get(
            `${BASE_URL}/transactions/history?userType=all&transactionType=all`,
            { withCredentials: true }
          );
          break;
        } catch (err) {
          if (err.response?.status === 500 && retries > 1) {
            retries--;
            console.warn(`Retrying /transactions/history (attempt ${4 - retries})`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
            continue;
          }
          throw err;
        }
      }

      console.log("Transaction history response:", response.data);

      if (response?.data?.transactions) {
        // Filter transactions where user is sender or receiver
        const userTransactions = response.data.transactions.filter(
          (txn) =>
            (txn.sender_id && String(txn.sender_id._id) === String(userId)) ||
            (txn.receiver_id && String(txn.receiver_id._id) === String(userId))
        );

        console.log("Filtered user transactions:", userTransactions);

        const formattedTransactions = userTransactions.map((txn) => {
          const isSender = txn.sender_id && String(txn.sender_id._id) === String(userId);
          const amountValue = parseFloat(txn.amount);
          const isPositive = !isSender || txn.type === "Refund" || txn.type === "TopUp";

          return {
            type: txn.type,
            date: txn.datetime,
            method: `${txn.payment_method || "N/A"} • ${txn.description || txn.type}`,
            id: txn.id,
            amount: isPositive ? `+₹${amountValue.toFixed(2)}` : `-₹${amountValue.toFixed(2)}`,
            balance: scannedData?.currentBalance
              ? `₹${scannedData.currentBalance.toFixed(2)}`
              : "N/A",
            color: isPositive ? "text-green-600" : "text-red-500",
            icon: txn.type === "TopUp" ? "➕" : txn.type === "Refund" ? "↩️" : "🔒",
          };
        });

        setTransactions(formattedTransactions);
        setFilteredTransactions(formattedTransactions);
      } else {
        console.warn("No transactions found or empty response.");
        setTransactions([]);
        setFilteredTransactions([]);
        setError("No transactions found for this user.");
      }
    } catch (err) {
      console.error("Transaction fetch error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      if (err.response?.status === 401) {
        setError("Authentication failed. Please log in to view transactions.");
      } else if (err.response?.status === 404) {
        setError("No transactions found for this user.");
      } else {
        setError(
          err.message || "Failed to fetch transactions. Please try again."
        );
      }
      setTransactions([]);
      setFilteredTransactions([]);
    }
  };

  // Filter transactions by type
  const filterTransactions = (type) => {
    setActiveFilter(type);
    if (type === "all") {
      setFilteredTransactions(transactions);
    } else {
      const filtered = transactions.filter((txn) => txn.type.toLowerCase() === type.toLowerCase());
      setFilteredTransactions(filtered);
    }
  };

  // Handle scanner lifecycle
  useEffect(() => {
    if (scannerOpen) {
      const delayStart = setTimeout(() => startScanner(), 300);
      return () => {
        clearTimeout(delayStart);
        stopScanner();
      };
    }
    return () => stopScanner();
  }, [scannerOpen]);

  // Close details view
  const handleClose = () => {
    setShowDetails(false);
    setScannedData(null);
    setError("");
    setTransactions([]);
    setFilteredTransactions([]);
    setActiveFilter("all");
    window.history.back();
  };

  // Scroll transaction list
  const handleScroll = (direction) => {
    const container = document.querySelector(".space-y-4");
    if (container) {
      const scrollAmount = 200;
      container.scrollTop += direction === "up" ? -scrollAmount : scrollAmount;
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 px-4 py-10">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-lg">
        {/* Header */}
        <div className="bg-[#0B0742] text-white text-center py-4 rounded-t-2xl">
          <h2 className="text-xl font-semibold">Customer History</h2>
        </div>

        {/* Scan UI */}
        {!showDetails && (
          <div className="p-6 text-center">
            <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-[#0B0742] text-white px-6 py-3 rounded-lg font-semibold text-sm"
                  onClick={() => setScannerOpen(true)}
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  Scan Customer QR Code
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Scan QR Code</DialogTitle>
                </DialogHeader>
                <div className="relative w-full h-64 bg-gray-100 border border-dashed border-[#070149] rounded-lg overflow-hidden">
                  {!html5QrCodeRef.current && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ScanLine className="w-20 h-20 text-[#070149]" />
                    </div>
                  )}
                  <div id="qr-reader" ref={qrRef} className="w-full h-full" />
                </div>
                {cameraError && (
                  <p className="text-red-500 text-sm mt-2">{cameraError}</p>
                )}
                {loading && (
                  <p className="text-blue-500 text-sm mt-2">Fetching customer details...</p>
                )}
                {error && (
                  <p className="text-red-500 text-sm mt-2">{error}</p>
                )}
                <Button
                  onClick={() => setScannerOpen(false)}
                  className="mt-4 bg-[#070149] hover:bg-[#3f3b6d] text-white"
                >
                  Close
                </Button>
              </DialogContent>
            </Dialog>

            <p className="mt-4 text-gray-500">Scan customer QR code to view their history</p>
            <p className="my-2 text-sm text-gray-500">Or search by ID/Phone</p>
            <div className="flex justify-center mt-3">
              <input
                type="text"
                placeholder="Enter ID or Phone Number"
                className="px-4 py-2 border border-gray-300 rounded-l-lg w-64"
              />
              <button className="bg-[#0B0742] px-4 text-white rounded-r-lg">🔍</button>
            </div>
          </div>
        )}

        {/* Customer Info */}
        {showDetails && scannedData && (
          <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Customer Details</h3>
              <button className="text-sm text-[# Pondicherry University0B0742] hover:underline">⬇️ Export Data</button>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <p><strong>Name:</strong> {scannedData.name}</p>
              <p><strong>Email:</strong> {scannedData.email}</p>
              <p><strong>Phone:</strong> {scannedData.phone}</p>
              <p><strong>Registration Date:</strong> {scannedData.registrationDate}</p>
              <p><strong>Customer ID:</strong> {scannedData.customerId}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className="text-red-600 bg-red-100 px-2 py-0.5 rounded">{scannedData.status}</span>
              </p>
              <p><strong>Current Balance:</strong> ₹{scannedData.currentBalance.toFixed(2)}</p>
              <p><strong>Customer Type:</strong> {scannedData.customerType}</p>
            </div>

            {/* Transaction History */}
            <div className="pt-6 border-t">
              <div className="flex justify-between items-center mb-4">
                <div className="flex space-x-4">
                  <button
                    className={`border-b-2 ${activeFilter === "all" ? "border-blue-600 text-blue-600" : "border-transparent"}`}
                    onClick={() => filterTransactions("all")}
                  >
                    All Transactions
                  </button>
                  <button
                    className={`border-b-2 ${activeFilter === "topup" ? "border-blue-600 text-blue-600" : "border-transparent"}`}
                    onClick={() => filterTransactions("topup")}
                  >
                    Top Ups
                  </button>
                  <button
                    className={`border-b-2 ${activeFilter === "transfer" ? "border-blue-600 text-blue-600" : "border-transparent"}`}
                    onClick={() => filterTransactions("transfer")}
                  >
                    Purchases
                  </button>
                  <button
                    className={`border-b-2 ${activeFilter === "refund" ? "border-blue-600 text-blue-600" : "border-transparent"}`}
                    onClick={() => filterTransactions("refund")}
                  >
                    Refunds
                  </button>
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Search transactions"
                    className="border px-3 py-1 text-sm rounded-md"
                    onChange={(e) => {
                      const searchTerm = e.target.value.toLowerCase();
                      const filtered = transactions.filter((txn) =>
                        txn.method.toLowerCase().includes(searchTerm) || txn.id.toLowerCase().includes(searchTerm)
                      );
                      setFilteredTransactions(filtered);
                    }}
                  />
                  <select className="border px-3 py-1 text-sm rounded-md">
                    <option>All Time</option>
                    <option>Today</option>
                    <option>Yesterday</option>
                    <option>Last 7 Days</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 text-sm max-h-96 overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((txn, index) => (
                    <div key={index} className="border p-4 rounded-md shadow-sm bg-gray-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="flex items-center gap-2 font-medium">
                            <span>{txn.icon}</span>
                            <span>{txn.type}</span>
                          </div>
                          <p className="text-gray-600">{txn.date}</p>
                          <p className="text-gray-500">{txn.method}</p>
                          <p className="text-xs text-gray-400">ID: {txn.id}</p>
                        </div>
                        <div className="text-right">
                          <p className={`${txn.color} font-semibold`}>{txn.amount}</p>
                          <p className="text-gray-400 text-xs">Balance: {txn.balance}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center">No transactions available.</p>
                )}
              </div>

              <div className="text-center mt-4">
                <button
                  onClick={handleClose}
                  className="bg-[#0B0742] text-white px-6 py-2 rounded-lg font-semibold text-sm"
                >
                  Close
                </button>
              </div>

              <div className="flex justify-center space-x-4 mt-2">
                <button
                  onClick={() => handleScroll("up")}
                  className="bg-[#0B0742] text-white px-3 py-1 rounded-lg"
                >
                  ↑
                </button>
                <button
                  onClick={() => handleScroll("down")}
                  className="bg-[#0B0742] text-white px-3 py-1 rounded-lg"
                >
                  ↓
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}