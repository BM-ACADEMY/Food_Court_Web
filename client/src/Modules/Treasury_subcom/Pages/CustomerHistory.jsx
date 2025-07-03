import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import { QrCode, ScanLine, FileText, FileSpreadsheet, FileSignature, PlusCircle, ArrowRightLeft } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function CustomerHistory() {
  const [showDetails, setShowDetails] = useState(false);
  const [userId, setUserId] = useState('');
  const [scannedData, setScannedData] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, totalPages: 1 });
  const [openDialog, setOpenDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [dateFilter, setDateFilter] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const qrRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [paymentMethod, setPaymentMethod] = useState("all");

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
        { fps: 30, qrbox: { width: 300, height: 400 } },
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
    setLoading(true);
    setError("");

    try {
      const qrCode = encodeURIComponent(qrString);

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

      if (!customerResponse?.data?.success) {
        throw new Error(customerResponse?.data?.message || "Customer not found.");
      }

      const { customer_id, user_id, status, registration_type, created_at } = customerResponse.data.data;

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
        name: customerData.name || user_id.name || "N/A",
        phone: customerData.phone_number || user_id.phone_number || "N/A",
        email: customerData.email || user_id.email || "N/A",
        currentBalance: balanceValue,
        registrationDate: created_at
          ? new Date(created_at).toLocaleDateString()
          : "20 Jan 2024",
        status: status || "Unknown",
        customerType: registration_type || "Unknown",
        userId: user_id._id,
      };

      setShowDetails(true);
      setScannedData(newScannedData);
      setScannerOpen(false);
      await stopScanner();

      if (customer_id) {
        await fetchTransactions(customer_id);
      } else {
        setError("No customer_id found for transactions.");
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

  // Fetch transactions
  const fetchTransactions = async (customerId, page = 1, dateFilterValue = dateFilter, paymentMethodValue = paymentMethod) => {
    try {
      console.log("Fetching transactions for customerId:", customerId, "with dateFilter:", dateFilterValue, "and paymentMethod:", paymentMethodValue);

      if (!customerId || typeof customerId !== "string") {
        throw new Error("Customer ID is missing or invalid.");
      }
      setUserId(customerId);

      let queryParams = `page=${page}&limit=${pagination.limit}`;
      if (dateFilterValue !== "all") {
        queryParams += `&quickFilter=${dateFilterValue}`;
      }
      if (paymentMethodValue !== "all") {
        queryParams += `&payment_method=${encodeURIComponent(paymentMethodValue)}`;
      }

      const response = await axios.get(
        `${BASE_URL}/customers/${customerId}/transactions?${queryParams}`,
        { withCredentials: true }
      );

      console.log("Transaction history response:", response.data);

      if (response?.data?.success && response.data.data) {
        const userTransactions = response.data.data;
        console.log("User transactions:", userTransactions);
        setTransactions(userTransactions);
        setFilteredTransactions(userTransactions);
        setPagination(response.data.pagination || { page: 1, limit: 10, totalPages: 1 });
      } else {
        console.warn("No transactions found or empty response.");
        setTransactions([]);
        setFilteredTransactions([]);
        setError("No transactions found for this customer.");
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
        setError("No transactions found for this customer.");
      } else {
        setError(
          err.response?.data?.message || "Failed to fetch transactions. Please try again."
        );
      }
      setTransactions([]);
      setFilteredTransactions([]);
    }
  };

  // Handle payment method change
  const handlePaymentMethodChange = (value) => {
    setPaymentMethod(value);
    if (scannedData?.customerId) {
      fetchTransactions(scannedData.customerId, 1, dateFilter, value);
    }
  };

  // Handle search by customer_id or phone number
  const handleSearch = async () => {
    if (!searchInput.trim()) {
      setError("Please enter a customer ID or phone number.");
      return;
    }

    setLoading(true);
    setError("");
    setShowDetails(false);
    setTransactions([]);
    setFilteredTransactions([]);

    try {
      let userId;
      let input = searchInput.trim();

      if (input.toLowerCase().startsWith("cust")) {
        input = input.toUpperCase();
        const customerResponse = await axios.get(
          `${BASE_URL}/customers/fetch-by-customer-id?customer_id=${encodeURIComponent(input)}`,
          { withCredentials: true }
        );

        if (!customerResponse?.data?.success) {
          throw new Error(customerResponse?.data?.message || "Customer not found.");
        }

        const { customer_id, user_id, status, registration_type, created_at } = customerResponse.data.data;
        userId = user_id._id;

        const detailsResponse = await axios.get(
          `${BASE_URL}/customers/fetch-customer-details-by-qr?qr_code=${encodeURIComponent(customerResponse.data.data.qr_code)}`,
          { withCredentials: true }
        );

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
          name: customerData.name || user_id.name || "N/A",
          phone: customerData.phone_number || user_id.phone_number || "N/A",
          email: customerData.email || user_id.email || "N/A",
          currentBalance: balanceValue,
          registrationDate: created_at
            ? new Date(created_at).toLocaleDateString()
            : "20 Jan 2024",
          status: status || "Unknown",
          customerType: registration_type || "Unknown",
          userId: user_id._id,
        };

        setShowDetails(true);
        setScannedData(newScannedData);
        await fetchTransactions(customer_id);
      } else {
        const userResponse = await axios.get(
          `${BASE_URL}/users/fetch-by-phone?phone_number=${encodeURIComponent(input)}`,
          { withCredentials: true }
        );

        if (!userResponse?.data?.success) {
          throw new Error(userResponse?.data?.message || "User not found.");
        }

        const { _id, name, email, phone_number } = userResponse.data.data;
        userId = _id;

        const customerResponse = await axios.get(
          `${BASE_URL}/customers/fetch-by-user-id/${userId}`,
          { withCredentials: true }
        );

        if (!customerResponse?.data?.success) {
          throw new Error(customerResponse?.data?.message || "Customer not found for this user.");
        }

        const { customer_id, status, registration_type, created_at, qr_code } = customerResponse.data.data;

        const detailsResponse = await axios.get(
          `${BASE_URL}/customers/fetch-customer-details-by-qr?qr_code=${encodeURIComponent(qr_code)}`,
          { withCredentials: true }
        );

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
          name: customerData.name || name || "N/A",
          phone: customerData.phone_number || phone_number || "N/A",
          email: customerData.email || email || "N/A",
          currentBalance: balanceValue,
          registrationDate: created_at
            ? new Date(created_at).toLocaleDateString()
            : "20 Jan 2024",
          status: status || "Unknown",
          customerType: registration_type || "Unknown",
          userId: _id,
        };

        setShowDetails(true);
        setScannedData(newScannedData);
        await fetchTransactions(customer_id);
      }
    } catch (err) {
      console.error("Search error:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
      });
      if (err.response?.status === 401) {
        setError("Authentication failed. Please log in and try again.");
      } else if (err.response?.status === 404) {
        setError(err.response?.data?.message || "Customer or user not found.");
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

  // Manual CSV generation function
  const generateCSV = (transactions) => {
    const headers = ["ID,Date,Type,Payment Method,Amount,Status,Customer ID"];
    const rows = transactions.map((txn) =>
      [
        `"${txn.id || "N/A"}"`,
        `"${txn.date || "N/A"}"`,
        `"${txn.type || "N/A"}"`,
        `"${txn.payment_method || "N/A"}"`,
        `"${txn.amount || "0.00"}"`,
        `"${txn.status || "N/A"}"`,
        `"${txn.customer_id || "N/A"}"`,
      ].join(",")
    );
    return [...headers, ...rows].join("\n");
  };

  // Export transaction data
  const exportData = async () => {
    if (!scannedData?.userId) {
      setError("No customer data available to export.");
      return;
    }

    try {
      setLoading(true);
      let queryParams = "limit=0";
      if (dateFilter !== "all") {
        queryParams += `&quickFilter=${dateFilter}`;
      }

      const response = await axios.get(
        `${BASE_URL}/customers/${scannedData.customerId}/transactions?${queryParams}`,
        { withCredentials: true }
      );

      if (!response?.data?.success || !response.data.data) {
        throw new Error("No transactions found for export.");
      }

      const transactions = response.data.data;
      const filename = `transactions_${scannedData.customerId}_${new Date().toISOString().split('T')[0]}`;

      if (exportFormat === "csv") {
        const csv = generateCSV(transactions);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, `${filename}.csv`);
      } else if (exportFormat === "excel") {
        const worksheetData = transactions.map(txn => ({
          ID: txn.id || "N/A",
          Date: txn.date || "N/A",
          Type: txn.type || "N/A",
          PaymentMethod: txn.payment_method || "N/A",
          Amount: txn.amount || "0.00",
          Status: txn.status || "N/A",
          CustomerID: txn.customer_id || "N/A",
        }));
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
        XLSX.writeFile(workbook, `${filename}.xlsx`);
      } else if (exportFormat === "pdf") {
        const doc = new jsPDF();
        doc.text(`Transaction History for Customer ${scannedData.customerId}`, 14, 20);
        autoTable(doc, {
          startY: 30,
          head: [['ID', 'Date', 'Type', 'Payment Method', 'Amount', 'Status', 'Customer ID']],
          body: transactions.map(txn => [
            txn.id || "N/A",
            txn.date || "N/A",
            txn.type || "N/A",
            txn.payment_method || "N/A",
            txn.amount || "0.00",
            txn.status || "N/A",
            txn.customer_id || "N/A",
          ]),
          theme: 'striped',
          styles: { fontSize: 10 },
          headStyles: { fillColor: [11, 7, 66] },
        });
        doc.save(`${filename}.pdf`);
      }

      setOpenDialog(false);
    } catch (err) {
      console.error("Export error:", err);
      setError("Failed to export transactions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle date filter change
  const handleDateFilterChange = (value) => {
    setDateFilter(value);
    if (scannedData?.customerId) {
      fetchTransactions(scannedData.customerId, 1, value);
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages && scannedData) {
      setPagination({ ...pagination, page: newPage });
      fetchTransactions(scannedData.customerId, newPage, dateFilter);
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

  // Render transaction icon based on type
  const getTransactionIcon = (type) => {
    switch (type?.toLowerCase()) {
      case "topup":
        return <PlusCircle className="w-5 h-5 text-blue-500" />;
      case "transfer":
        return <ArrowRightLeft className="w-5 h-5 text-green-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4 py-6 sm:py-8">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-[#0B0742] text-white text-center py-4 sm:py-6">
          <h2 className="text-xl sm:text-2xl font-bold">Customer History</h2>
        </div>

        {!showDetails && (
          <div className="p-4 sm:p-6 text-center">
            <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-[#0B0742] text-white px-6 py-3 rounded-lg font-semibold text-sm sm:text-base hover:bg-[#3f3b6d] transition-colors"
                  onClick={() => setScannerOpen(true)}
                >
                  <QrCode className="w-5 h-5 mr-2" />
                  Scan Customer QR Code
                </Button>
              </DialogTrigger>
              <DialogContent className="w-full max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-lg sm:text-xl">Scan QR Code</DialogTitle>
                </DialogHeader>
                <div className="relative w-full h-64 sm:h-80 bg-gray-100 border border-dashed border-[#070149] rounded-lg overflow-hidden">
                  {!html5QrCodeRef.current && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ScanLine className="w-16 h-16 sm:w-20 sm:h-20 text-[#070149] animate-pulse" />
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

            <p className="mt-4 text-gray-600 text-sm sm:text-base">Scan a customer QR code to view their history</p>
            <p className="my-2 text-sm text-gray-500">Or search by ID/Phone</p>
            <div className="flex flex-col sm:flex-row justify-center items-center mt-3 gap-2">
              <input
                type="text"
                placeholder="Enter ID or Phone Number"
                className="px-4 py-2 border border-gray-300 rounded-lg w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-[#0B0742] transition-colors"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleSearch();
                  }
                }}
              />
              <Button
                className="bg-[#0B0742] px-4 py-2 text-white rounded-lg w-full sm:w-auto hover:bg-[#3f3b6d] transition-colors"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? "Searching..." : "🔍 Search"}
              </Button>
            </div>
            {error && (
              <p className="text-red-500 text-sm mt-2">{error}</p>
            )}
          </div>
        )}

        {showDetails && scannedData && (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Customer Details</h3>
              <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-sm text-[#0B0742] border-[#0B0742] hover:bg-[#0B0742] hover:text-white transition-colors"
                  >
                    ⬇️ Export Data
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">Export Transactions</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <RadioGroup value={exportFormat} onValueChange={setExportFormat}>
                      <div className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                        <RadioGroupItem value="csv" id="export-csv" />
                        <Label htmlFor="export-csv" className="flex items-center gap-2">
                          <FileText size={18} /> CSV
                        </Label>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                        <RadioGroupItem value="excel" id="export-excel" />
                        <Label htmlFor="export-excel" className="flex items-center gap-2">
                          <FileSpreadsheet size={18} /> Excel (.xlsx)
                        </Label>
                      </div>
                      <div className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                        <RadioGroupItem value="pdf" id="export-pdf" />
                        <Label htmlFor="export-pdf" className="flex items-center gap-2">
                          <FileSignature size={18} /> PDF
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <DialogFooter className="pt-4">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={exportData} disabled={loading}>
                      {loading ? "Exporting..." : "Export"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-700">
              <p><strong>Name:</strong> {scannedData.name}</p>
              <p><strong>Email:</strong> {scannedData.email}</p>
              <p><strong>Phone:</strong> {scannedData.phone}</p>
              <p><strong>Registration Date:</strong> {scannedData.registrationDate}</p>
              <p><strong>Customer ID:</strong> {scannedData.customerId}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${scannedData.status === "Online" ? "bg-green-100 text-green-600" : "bg-green-100 text-green-600"}`}>
                  {scannedData.status}
                </span>
              </p>
              <p><strong>Current Balance:</strong> ₹{scannedData.currentBalance.toFixed(2)}</p>
              <p><strong>Customer Type:</strong> {scannedData.customerType}</p>
            </div>

            <div className="pt-6 border-t">
              <div className="flex flex-col sm:flex-row justify-end items-center mb-4 gap-2">
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Search transactions"
                    className="border px-3 py-2 text-sm rounded-md w-full sm:w-48 focus:outline-none focus:ring-2 focus:ring-[#0B0742] transition-colors"
                    onChange={(e) => {
                      const searchTerm = e.target.value.toLowerCase();
                      const filtered = transactions.filter((txn) =>
                        (txn.payment_method || "").toLowerCase().includes(searchTerm) ||
                        (txn.id || "").toLowerCase().includes(searchTerm)
                      );
                      setFilteredTransactions(filtered);
                    }}
                  />
                  <Select value={paymentMethod} onValueChange={handlePaymentMethodChange}>
                    <SelectTrigger className="w-full sm:w-[180px]">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payment Methods</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Gpay">Gpay</SelectItem>
                      <SelectItem value="Mess bill">Mess bill</SelectItem>
                      <SelectItem value="Balance Deduction">Balance Deduction</SelectItem>
                    </SelectContent>
                  </Select>
                  <select
                    className="border px-3 py-2 text-sm rounded-md w-full sm:w-36 focus:outline-none focus:ring-2 focus:ring-[#0B0742] transition-colors"
                    value={dateFilter}
                    onChange={(e) => handleDateFilterChange(e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="yesterday">Yesterday</option>
                    <option value="last7days">Last 7 Days</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 text-sm max-h-96 overflow-y-auto" style={{ scrollBehavior: "smooth" }}>
                {filteredTransactions.length > 0 ? (
                  filteredTransactions.map((txn, index) => (
                    <div
                      key={index}
                      className="border p-4 rounded-lg shadow-sm bg-white hover:shadow-md transition-shadow duration-200"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3">
                          {getTransactionIcon(txn.type)}
                          <div>
                            <div className="flex items-center gap-2 font-medium text-gray-800">
                              <span className="capitalize">{txn.type || "N/A"}</span>
                            </div>
                            <p className="text-gray-600 text-sm">
                              {txn.date ? new Date(txn.date).toLocaleString() : "N/A"}
                            </p>
                            <p className="text-gray-500 text-sm">{txn.payment_method || "N/A"}</p>
                            <p className="text-xs text-gray-400">ID: {txn.id || "N/A"}</p>
                            <p className="text-xs text-gray-400">Customer ID: {txn.customer_id || "N/A"}</p>
                            <p className="text-xs text-gray-400">{txn.description || "N/A"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-800">₹{txn.amount?.toFixed(2) || "0.00"}</p>
                          <p className="text-gray-400 text-xs">Balance: ₹{scannedData.currentBalance.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-4">No transactions available.</p>
                )}
              </div>

              {pagination.totalPages > 1 && (
                <div className="flex justify-center items-center mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                          className="hover:bg-[#0B0742] hover:text-white transition-colors"
                        />
                      </PaginationItem>
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            onClick={() => handlePageChange(pageNum)}
                            isActive={pagination.page === pageNum}
                            className="hover:bg-[#0B0742] hover:text-white transition-colors"
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.totalPages}
                          className="hover:bg-[#0B0742] hover:text-white transition-colors"
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}