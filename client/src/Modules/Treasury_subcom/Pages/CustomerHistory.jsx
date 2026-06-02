import BackButton from "@/components/BackButton";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  FileText,
  FileSpreadsheet,
  FileSignature,
  Download,
  Search,
} from "lucide-react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Formats a date string into a readable format like: "29 May 2026, 6:18 pm"
 */
const formatReadableDate = (dateStr) => {
  if (!dateStr) return "N/A";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "N/A";
    return format(date, "d MMM yyyy, h:mm a")
      .replace(" AM", " am")
      .replace(" PM", " pm");
  } catch {
    return "N/A";
  }
};

const CustomerHistory = () => {
  const { user } = useAuth();

  // Customer search
  const [phoneSearch, setPhoneSearch] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerInfo, setCustomerInfo] = useState(null);
  const [customerSearched, setCustomerSearched] = useState(false);

  // Transactions
  const [transactions, setTransactions] = useState([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [todaysTransactions, setTodaysTransactions] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;

  // Filters
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [noMoreData, setNoMoreData] = useState(false);

  // Export dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [loading, setLoading] = useState(false);

  const BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:4000/api";

  // ── Fetch transaction types ──────────────────────────────────────────────
  const fetchTransactionTypes = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/transactions/types`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setTransactionTypes(response.data.data);
      }
    } catch {
      setTransactionTypes(["Transfer", "TopUp", "Refund", "Credit", "Registration Fee"]);
    }
  };

  // ── Look up customer by phone number ────────────────────────────────────
  const handleCustomerSearch = async () => {
    if (!phoneSearch.trim()) {
      toast.error("Please enter a phone number", { position: "top-center", autoClose: 3000 });
      return;
    }
    try {
      setLoading(true);
      const response = await axios.get(
        `${BASE_URL}/customers/fetch-customer-details-by-phone?phone_number=${encodeURIComponent(phoneSearch.trim())}`,
        { withCredentials: true }
      );
      if (!response.data.success) throw new Error(response.data.message || "Customer not found");
      const data = response.data.data;
      setCustomerInfo(data);
      setCustomerId(data.customer_id);
      setCustomerSearched(true);
      setPage(1);
    } catch (err) {
      toast.error(err.message || "Customer not found", { position: "top-center", autoClose: 3000 });
      setCustomerInfo(null);
      setTransactions([]);
      setCustomerSearched(false);
    } finally {
      setLoading(false);
    }
  };

  // ── Fetch transactions for found customer ────────────────────────────────
  const fetchTransactions = async () => {
    if (!customerId) return;
    try {
      setLoading(true);
      const response = await axios.get(
        `${BASE_URL}/transactions/history/customer/${customerId}`,
        {
          params: { page, limit, search, quickFilter: timeFilter, type: typeFilter },
          withCredentials: true,
        }
      );
      if (!response.data.success) throw new Error(response.data.message || "Failed to fetch");

      const { transactions: fetched, pagination, todaysTransactions: todays } = response.data;
      setTransactions(fetched || []);
      setTotalTransactions(pagination?.totalTransactions || 0);
      setTodaysTransactions(todays || 0);
      setNoMoreData(!fetched || fetched.length === 0);
    } catch (err) {
      console.error("Fetch transactions error:", err);
      setTransactions([]);
      setNoMoreData(true);
      toast.error(`Failed to fetch transactions: ${err.response?.data?.message || err.message}`, {
        position: "top-center",
        autoClose: 3000,
        toastId: "fetch-error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactionTypes();
  }, []);

  useEffect(() => {
    if (customerId) {
      setPage(1);
      fetchTransactions();
    }
  }, [customerId, search, timeFilter, typeFilter]);

  useEffect(() => {
    if (customerId) fetchTransactions();
  }, [page]);

  // ── Export ───────────────────────────────────────────────────────────────
  const exportData = async () => {
    if (!customerId) {
      toast.error("No customer selected", { position: "top-center", autoClose: 3000 });
      return;
    }
    try {
      toast.info("Exporting transactions...", {
        position: "top-center",
        autoClose: false,
        toastId: "export-loading",
      });

      const response = await axios.get(
        `${BASE_URL}/transactions/history/customer/${customerId}/export`,
        {
          params: { search, quickFilter: timeFilter, type: typeFilter },
          withCredentials: true,
          timeout: 30000,
        }
      );

      toast.dismiss("export-loading");

      if (!response.data.success) throw new Error(response.data.message || "Export failed");

      const exportTransactions = response.data.transactions;

      if (!exportTransactions || exportTransactions.length === 0) {
        toast.info("No transactions available for export", { position: "top-center", autoClose: 3000 });
        return;
      }

      const totalCount = exportTransactions.length;
      const customerName = customerInfo?.name || customerId;

      if (exportFormat === "csv" || exportFormat === "excel") {
        const rows = exportTransactions.map((txn, index) => ({
          "S.No": index + 1,
          "Transaction ID": txn.id || "N/A",
          "Customer ID": txn.customer_id || "N/A",
          "Customer Name": txn.user?.name || customerName || "N/A",
          Amount:
            txn.amount !== undefined
              ? txn.amount > 0
                ? `₹${txn.amount.toFixed(2)}`
                : `-₹${Math.abs(txn.amount).toFixed(2)}`
              : "N/A",
          "Transaction Type": txn.type || "N/A",
          // ── Readable date format ─────────────────────────────────────
          "Date & Time": formatReadableDate(txn.datetime),
          Status: txn.status || "N/A",
        }));

        // Summary row
        rows.push({
          "S.No": "",
          "Transaction ID": "",
          "Customer ID": "",
          "Customer Name": "",
          Amount: "",
          "Transaction Type": "",
          "Date & Time": "Total Transactions",
          Status: totalCount.toString(),
        });

        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Customer Transactions");
        XLSX.writeFile(
          workbook,
          `customer_history_${customerId}.${exportFormat === "csv" ? "csv" : "xlsx"}`
        );
      } else if (exportFormat === "pdf") {
        const doc = new jsPDF();
        doc.setFontSize(14);
        doc.text("Customer Transaction History", 14, 15);
        doc.setFontSize(10);
        doc.text(`Customer: ${customerName}  |  ID: ${customerId}`, 14, 23);
        doc.text(`Phone: ${customerInfo?.phone_number || "N/A"}`, 14, 29);

        const tableBody = exportTransactions.map((txn, index) => [
          index + 1,
          txn.id || "N/A",
          txn.customer_id || "N/A",
          txn.user?.name || customerName || "N/A",
          txn.amount !== undefined
            ? txn.amount > 0
              ? `Rs.${txn.amount.toFixed(2)}`
              : `-Rs.${Math.abs(txn.amount).toFixed(2)}`
            : "N/A",
          txn.type || "N/A",
          // ── Readable date format ─────────────────────────────────────
          formatReadableDate(txn.datetime),
          txn.status || "N/A",
        ]);

        tableBody.push(["", "", "", "", "", "", "Total", totalCount.toString()]);

        autoTable(doc, {
          startY: 35,
          head: [["#", "Txn ID", "Cust ID", "Name", "Amount", "Type", "Date & Time", "Status"]],
          body: tableBody,
          styles: { fontSize: 7, cellPadding: 2 },
          headStyles: { fillColor: [0, 0, 82] }, // #000052
        });

        doc.save(`customer_history_${customerId}.pdf`);
      }

      toast.success("Exported successfully!", { position: "top-center", autoClose: 3000 });
      setOpenDialog(false);
    } catch (err) {
      toast.dismiss("export-loading");
      toast.error(`Export failed: ${err.response?.data?.message || err.message}`, {
        position: "top-center",
        autoClose: 5000,
      });
    }
  };

  const totalPages = Math.ceil(totalTransactions / limit);

  const handleTypeFilterChange = (value) => {
    const cap = value === "all" ? "all" : value.charAt(0).toUpperCase() + value.slice(1);
    setTypeFilter(cap);
    setPage(1);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages && !noMoreData) setPage(newPage);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 relative">
      <BackButton />

      {/* ── Customer Search ── */}
      <Card className="w-full max-w-5xl mx-auto mb-6 border-t-4 border-t-[#000052]">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-[#000052]">
            Customer Transaction History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              className="w-full sm:flex-1 text-sm"
              placeholder="Enter customer phone number..."
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCustomerSearch()}
            />
            <Button
              className="bg-[#000052] hover:bg-[#070090] text-white flex items-center gap-2"
              onClick={handleCustomerSearch}
              disabled={loading}
            >
              <Search className="h-4 w-4" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </div>

          {/* Customer info banner */}
          {customerInfo && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-gray-500 font-medium">Name:</span>{" "}
                <span className="font-semibold text-gray-800">{customerInfo.name || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Phone:</span>{" "}
                <span className="font-semibold text-gray-800">{customerInfo.phone_number || "N/A"}</span>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Customer ID:</span>{" "}
                <span className="font-semibold text-[#000052]">{customerId}</span>
              </div>
              <div>
                <span className="text-gray-500 font-medium">Balance:</span>{" "}
                <span className="font-bold text-green-700">
                  ₹{parseFloat(customerInfo.balance || 0).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Transactions table (shown only after search) ── */}
      {customerSearched && (
        <Card className="w-full max-w-5xl mx-auto border-l-4 border-l-[#000052] border-r-4 border-r-gray-200">
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2">
            <CardTitle className="text-base sm:text-lg font-semibold">
              Transaction Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            {/* ── Summary cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <Card className="border-l-4 border-l-green-600 border-r-4 border-r-green-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-base sm:text-lg font-bold">{totalTransactions}</p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-purple-600 border-r-4 border-r-purple-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                  <CardTitle className="text-sm font-medium">Today's Transactions</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <p className="text-base sm:text-lg font-bold">{todaysTransactions}</p>
                </CardContent>
              </Card>
            </div>

            {/* ── Filters & Export ── */}
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <Select value={timeFilter} onValueChange={setTimeFilter}>
                <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="yesterday">Yesterday</SelectItem>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={handleTypeFilterChange}>
                <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {transactionTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                className="w-full sm:flex-1 text-xs sm:text-sm"
                placeholder="Search transactions..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />

              <Button
                className="w-full sm:w-auto bg-[#000052] text-white hover:bg-[#070090] text-xs sm:text-sm flex items-center gap-1"
                onClick={() => setOpenDialog(true)}
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>

            {/* ── Table ── */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left text-gray-500 min-w-[700px]">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                  <tr>
                    <th className="px-2 sm:px-4 py-2">S.No</th>
                    <th className="px-2 sm:px-4 py-2">Transaction ID</th>
                    <th className="px-2 sm:px-4 py-2">Customer ID</th>
                    <th className="px-2 sm:px-4 py-2">Amount</th>
                    <th className="px-2 sm:px-4 py-2">Type</th>
                    {/* ── Readable date column ── */}
                    <th className="px-2 sm:px-4 py-2">Date & Time</th>
                    <th className="px-2 sm:px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-6 text-center text-gray-400">
                        Loading transactions...
                      </td>
                    </tr>
                  ) : transactions.length > 0 ? (
                    transactions.map((txn, index) => (
                      <tr key={txn.id} className="bg-white border-b hover:bg-gray-50">
                        <td className="px-2 sm:px-4 py-2">{(page - 1) * limit + index + 1}</td>
                        <td className="px-2 sm:px-4 py-2">{txn.id || "N/A"}</td>
                        <td className="px-2 sm:px-4 py-2">{txn.customer_id || "N/A"}</td>
                        <td
                          className="px-2 sm:px-4 py-2 font-medium"
                          style={{ color: txn.amount > 0 ? "green" : "red" }}
                        >
                          {txn.amount !== undefined
                            ? txn.amount > 0
                              ? `₹${txn.amount.toFixed(2)}`
                              : `-₹${Math.abs(txn.amount).toFixed(2)}`
                            : "N/A"}
                        </td>
                        <td className="px-2 sm:px-4 py-2">{txn.type || "N/A"}</td>
                        {/* ── Readable date in table ── */}
                        <td className="px-2 sm:px-4 py-2 whitespace-nowrap">
                          {formatReadableDate(txn.datetime)}
                        </td>
                        <td className="px-2 sm:px-4 py-2">
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            {txn.status || "N/A"}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                        No transactions found
                        {typeFilter !== "all" ? ` for type "${typeFilter}"` : ""}
                        {search ? ` matching "${search}"` : ""}
                        {timeFilter !== "all" ? ` for selected time period` : ""}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            <div className="flex justify-between items-center mt-4">
              <span className="text-xs sm:text-sm text-gray-500">
                Showing {Math.min((page - 1) * limit + 1, totalTransactions)} to{" "}
                {Math.min(page * limit, totalTransactions)} of {totalTransactions} transactions
              </span>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page === 1 || noMoreData}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, idx) => (
                    <PaginationItem key={idx}>
                      <PaginationLink
                        href="#"
                        isActive={page === idx + 1}
                        onClick={() => handlePageChange(idx + 1)}
                        className={
                          page === idx + 1
                            ? "bg-[#000052] text-white hover:bg-[#070090] cursor-pointer"
                            : "cursor-pointer"
                        }
                      >
                        {idx + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={noMoreData || page === totalPages}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Export Dialog ── */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="bg-[#000052] text-white p-4 rounded-t-lg -mx-6 -mt-6 mb-4">
            <DialogTitle className="text-white">Export Customer Transactions</DialogTitle>
          </DialogHeader>

          <div className="space-y-3 px-1">
            <RadioGroup value={exportFormat} onValueChange={setExportFormat}>
              <div className="flex items-center gap-3 p-3 rounded-md hover:bg-muted cursor-pointer border border-transparent hover:border-gray-200">
                <RadioGroupItem value="csv" id="export-csv" />
                <Label htmlFor="export-csv" className="flex items-center gap-2 cursor-pointer">
                  <FileText size={18} className="text-green-600" />
                  <span className="font-medium">CSV</span>
                </Label>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-md hover:bg-muted cursor-pointer border border-transparent hover:border-gray-200">
                <RadioGroupItem value="excel" id="export-excel" />
                <Label htmlFor="export-excel" className="flex items-center gap-2 cursor-pointer">
                  <FileSpreadsheet size={18} className="text-emerald-600" />
                  <span className="font-medium">Excel (.xlsx)</span>
                </Label>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-md hover:bg-muted cursor-pointer border border-transparent hover:border-gray-200">
                <RadioGroupItem value="pdf" id="export-pdf" />
                <Label htmlFor="export-pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileSignature size={18} className="text-red-500" />
                  <span className="font-medium">PDF</span>
                </Label>
              </div>
            </RadioGroup>

            <p className="text-xs text-gray-400 mt-1">
              Dates will be formatted as: <span className="font-mono">29 May 2026, 6:18 pm</span>
            </p>
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              className="bg-[#000052] hover:bg-[#070090] text-white"
              onClick={exportData}
            >
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomerHistory;
