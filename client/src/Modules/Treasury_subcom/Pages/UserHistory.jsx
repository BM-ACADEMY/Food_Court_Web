import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FileText, FileSpreadsheet, FileSignature, Download } from "lucide-react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable"; // Import as a side-effect

const UserHistory = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [todaysTransactions, setTodaysTransactions] = useState(0);
  const [initialTotalTransactions, setInitialTotalTransactions] = useState(0);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [transactionTypes, setTransactionTypes] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [noMoreData, setNoMoreData] = useState(false);
  const [isFirstFetch, setIsFirstFetch] = useState(true);

  // Fetch transaction types
  const fetchTransactionTypes = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/transactions/types`, {
        withCredentials: true,
      });
      if (response.data.success) {
        setTransactionTypes(response.data.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch transaction types");
      }
    } catch (err) {
      console.error("Fetch transaction types error:", err.message);
      toast.error("Failed to fetch transaction types", {
        position: "top-center",
        autoClose: 3000,
      });
      setTransactionTypes(["Transfer", "TopUp", "Refund", "Credit", "Registration Fee"]);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    if (!user?._id) {
      console.error("No user ID available");
      toast.error("User not authenticated. Please log in again.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    try {
      console.log("Fetching transactions with params:", {
        userId: user._id,
        page,
        limit,
        search,
        quickFilter: timeFilter,
        type: typeFilter,
      });
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/transactions/history/user/${user._id}`,
        {
          params: { page, limit, search, quickFilter: timeFilter, type: typeFilter },
          withCredentials: true,
        }
      );

      console.log("API response:", {
        transactions: response.data.transactions,
        pagination: response.data.pagination,
      });

      if (!response.data.success) {
        throw new Error(response.data.message || "Failed to fetch transactions");
      }

      const { transactions: fetchedTransactions, pagination, todaysTransactions } = response.data;

      setTransactions(fetchedTransactions);
      setTotalTransactions(pagination.totalTransactions || 0);
      setTodaysTransactions(todaysTransactions || 0);
      if (isFirstFetch) {
        setInitialTotalTransactions(pagination.totalTransactions || 0);
        setIsFirstFetch(false);
      }

      if (fetchedTransactions.length === 0) {
        setNoMoreData(true);
        if (page > 1) {
          toast.info("No more transactions available", {
            position: "top-center",
            autoClose: 3000,
          });
        }
      } else {
        setNoMoreData(false);
      }
    } catch (err) {
      console.error("Fetch transactions error:", err.response?.data || err.message);
      setTransactions([]);
      setNoMoreData(true);
      toast.error(`Failed to fetch transactions: ${err.response?.data?.message || err.message}`, {
        position: "top-center",
        autoClose: 3000,
        toastId: "fetch-error",
      });
    }
  };

  // Fetch transaction types on mount
  useEffect(() => {
    fetchTransactionTypes();
  }, []);

  // Fetch transactions when dependencies change
  useEffect(() => {
    setPage(1);
    fetchTransactions();
  }, [user, search, timeFilter, typeFilter]);

  // Fetch transactions when page changes
  useEffect(() => {
    fetchTransactions();
  }, [page]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= Math.ceil(totalTransactions / limit) && !noMoreData) {
      setPage(newPage);
    }
  };

  const handleTypeFilterChange = (value) => {
    const capitalizedValue = value === "all" ? "all" : value.charAt(0).toUpperCase() + value.slice(1);
    setTypeFilter(capitalizedValue);
    setPage(1);
  };

  const exportData = async () => {
    if (!user?._id || typeof user._id !== "string" || user._id.trim() === "") {
      toast.error("Invalid user ID. Please log in again.", {
        position: "top-center",
        autoClose: 3000,
      });
      return;
    }

    try {
      toast.info("Exporting transactions...", {
        position: "top-center",
        autoClose: false,
        toastId: "export-loading",
      });

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/transactions/history/user/${user._id}/export`,
        {
          params: { search, quickFilter: timeFilter, type: typeFilter },
          withCredentials: true,
          timeout: 30000,
        }
      );

      toast.dismiss("export-loading");

      if (!response.data.success) {
        throw new Error(response.data.message || "Export failed");
      }

      const exportTransactions = response.data.transactions;

      if (!exportTransactions || exportTransactions.length === 0) {
        toast.info("No transactions available for export", {
          position: "top-center",
          autoClose: 3000,
        });
        return;
      }

      const totalCount = exportTransactions.length;

      if (exportFormat === "csv" || exportFormat === "excel") {
        const exportData = exportTransactions.map((txn, index) => ({
          "S.No": index + 1,
          "Transaction ID": txn.id || "N/A",
          Customer: txn.customer_id || "N/A",
          Amount: txn.amount ? (txn.amount > 0 ? `₹${txn.amount.toFixed(2)}` : `-₹${Math.abs(txn.amount).toFixed(2)}`) : "N/A",
          "Transaction Type": txn.type || "N/A",
          "Date & Time": txn.datetime ? format(new Date(txn.datetime), "dd/MM/yyyy hh:mm a") : "N/A",
          Status: txn.status || "N/A",
        }));

        exportData.push({
          "S.No": "",
          "Transaction ID": "",
          Customer: "",
          Amount: "",
          "Transaction Type": "",
          "Date & Time": "Total Transactions",
          Status: totalCount.toString(),
        });

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
        XLSX.writeFile(workbook, `transactions_${user._id}.${exportFormat === "csv" ? "csv" : "xlsx"}`);
      } else if (exportFormat === "pdf") {
        const doc = new jsPDF();
        doc.text("Transaction History", 14, 20);

        const tableData = exportTransactions.map((txn, index) => [
          index + 1,
          txn.id || "N/A",
          txn.customer_id || "N/A",
          txn.amount ? (txn.amount > 0 ? `₹${txn.amount.toFixed(2)}` : `-₹${Math.abs(txn.amount).toFixed(2)}`) : "N/A",
          txn.type || "N/A",
          txn.datetime ? format(new Date(txn.datetime), "dd/MM/yyyy hh:mm a") : "N/A",
          txn.status || "N/A",
        ]);

        tableData.push(["", "", "", "", "", "Total Transactions", totalCount.toString()]);

        doc.autoTable({
          startY: 40,
          head: [["S.No", "Transaction ID", "Customer", "Amount", "Transaction Type", "Date & Time", "Status"]],
          body: tableData,
        });

        doc.save(`transactions_${user._id}.pdf`);
      }

      toast.success("Transactions exported successfully!", {
        position: "top-center",
        autoClose: 3000,
      });
      setOpenDialog(false);
    } catch (err) {
      toast.dismiss("export-loading");
      toast.error(`Failed to export transactions: ${err.response?.data?.message || err.message}`, {
        position: "top-center",
        autoClose: 5000,
      });
    }
  };

  const totalPages = Math.ceil(totalTransactions / limit);

  const handleClose = () => {
    navigate(-1);
  };

  if (!user) return null;

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <Card className="w-full max-w-5xl mx-auto border-l-4 border-l-gray-800 border-r-4 border-r-gray-200">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 pb-2">
          <CardTitle className="text-lg sm:text-xl font-semibold">Transaction Overview</CardTitle>
          <Button
            variant="outline"
            onClick={handleClose}
            className="text-xs sm:text-sm"
          >
            Close
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <Card className="border-l-4 border-l-blue-600 border-r-4 border-r-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-base sm:text-lg font-bold">₹{user.balance?.toFixed(2) || "0.00"}</p>
              </CardContent>
            </Card>
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
              className="w-full sm:w-[300px] text-xs sm:text-sm"
              placeholder="Search by name, ID, or customer ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Button
              className="w-full sm:w-[120px] bg-[#070149] text-white hover:bg-[#05012e] text-xs sm:text-sm flex items-center gap-1"
              onClick={() => setOpenDialog(true)}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left text-gray-500 min-w-[600px]">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-4 py-2">S.No</th>
                  <th className="px-2 sm:px-4 py-2">Transaction ID</th>
                  <th className="px-2 sm:px-4 py-2">Customer ID</th>
                  <th className="px-2 sm:px-4 py-2">Customer Name</th>
                  <th className="px-2 sm:px-4 py-2">Amount</th>
                  <th className="px-2 sm:px-4 py-2">Transaction Type</th>
                  <th className="px-2 sm:px-4 py-2">Date & Time</th>
                  <th className="px-2 sm:px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length > 0 ? (
                  transactions.map((transaction, index) => (
                    <tr key={transaction.id} className="bg-white border-b">
                      <td className="px-2 sm:px-4 py-2">{(page - 1) * limit + index + 1}</td>
                      <td className="px-2 sm:px-4 py-2">{transaction.id || "N/A"}</td>
                      <td className="px-2 sm:px-4 py-2">{transaction.customer_id || "N/A"}</td>
                      <td className="px-2 sm:px-4 py-2">
                        <div className="flex flex-col gap-1">
                          {transaction.user.name || "N/A"} <span>({transaction.user.type})</span>
                        </div>
                      </td>
                      <td className="px-2 sm:px-4 py-2" style={{ color: transaction.amount > 0 ? 'green' : 'red' }}>
                        {transaction.amount !== undefined
                          ? (transaction.amount > 0
                              ? `₹${transaction.amount.toFixed(2)}`
                              : `-₹${Math.abs(transaction.amount).toFixed(2)}`)
                          : "N/A"}
                      </td>
                      <td className="px-2 sm:px-4 py-2">{transaction.type || "N/A"}</td>
                      <td className="px-2 sm:px-4 py-2">
                        {transaction.datetime
                          ? format(new Date(transaction.datetime), "dd/MM/yyyy hh:mm a")
                          : "N/A"}
                      </td>
                      <td className="px-2 sm:px-4 py-2">
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          {transaction.status || "N/A"}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-2 sm:px-4 py-2 text-center">
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

          <div className="flex justify-between items-center mt-4">
            <span className="text-xs sm:text-sm">
              Showing {(page - 1) * limit + 1} to{" "}
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
                {[...Array(totalPages)].map((_, index) => (
                  <PaginationItem key={index}>
                    <PaginationLink
                      href="#"
                      isActive={page === index + 1}
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
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

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Export Transactions</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <RadioGroup value={exportFormat} onValueChange={setExportFormat}>
              <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer">
                <RadioGroupItem value="csv" id="export-csv" />
                <Label htmlFor="export-csv" className="flex items-center gap-2">
                  <FileText size={18} /> CSV
                </Label>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer">
                <RadioGroupItem value="excel" id="export-excel" />
                <Label htmlFor="export-excel" className="flex items-center gap-2">
                  <FileSpreadsheet size={18} /> Excel (.xlsx)
                </Label>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer">
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
            <Button onClick={exportData}>Export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserHistory;