import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useNavigate } from "react-router-dom";
import { DollarSign, CheckCircle, Calendar, Download, FileText, FileSpreadsheet, FileSignature } from "lucide-react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import moment from "moment";

const UserHistory = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [todaysTransactions, setTodaysTransactions] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [search, setSearch] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userId, setUserId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");

  const API_URL = import.meta.env.VITE_BASE_URL || "http://localhost:4000/api";

  // Fetch user data (including userId and balance)
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/users/me`, {
          withCredentials: true,
        });
        const userData = response.data.user;
        setUserId(userData._id);
        setCurrentBalance(userData.balance || 0);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data.");
        if (err.response?.status === 401) {
          setTimeout(() => navigate("/login"), 2000);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUserData();
  }, [navigate]);

  // Fetch transactions for the logged-in user
  useEffect(() => {
    if (!userId) {
      console.log("userId is not set, skipping fetchTransactions");
      return;
    }

    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get(`${API_URL}/transactions/history/user/${userId}`, {
          params: {
            page,
            limit,
            search: search || undefined,
            quickFilter: timeFilter === "all" ? undefined : timeFilter,
          },
          withCredentials: true,
        });

        if (!response.data?.success || !response.data?.transactions) {
          throw new Error("Invalid response: transactions data missing");
        }

        const { transactions: transactionsData, pagination } = response.data;
        if (!Array.isArray(transactionsData)) {
          throw new Error("Transactions data is not an array");
        }

        const formattedTransactions = transactionsData.map((txn) => {
          return {
            id: txn.id,
            customer: `${txn.user.name} (CUST${txn.customer_id || String(txn.id).slice(-3)})`,
            amount: `₹${Math.abs(txn.amount).toFixed(2)} ${txn.amount < 0 ? "(Out)" : "(In)"}`,
            date: new Date(txn.datetime).toLocaleString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            }),
            status: txn.status,
            datetime: new Date(txn.datetime), // Keep raw datetime for filtering
          };
        });

        // Calculate today's transactions
        const todayStart = moment().startOf("day").toDate();
        const todayEnd = moment().endOf("day").toDate();
        const todayCount = formattedTransactions.filter((txn) => 
          txn.datetime >= todayStart && txn.datetime <= todayEnd
        ).length;
        setTodaysTransactions(todayCount);

        setTransactions(formattedTransactions);
        setTotalTransactions(pagination?.totalTransactions || 0);
      } catch (err) {
        console.error("Error fetching transactions:", err);
        if (err.response?.status === 401) {
          setError("Session expired. Please log in again.");
          setTimeout(() => navigate("/login"), 2000);
        } else {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load transactions. Please try again."
          );
        }
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [userId, page, search, timeFilter, navigate]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleTimeFilterChange = (value) => {
    setTimeFilter(value);
    setPage(1);
  };

  const totalPages = Math.ceil(totalTransactions / limit);
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const getPaginationLinks = () => {
    const links = [];
    const maxLinks = 5;
    let startPage = Math.max(1, page - 2);
    let endPage = Math.min(totalPages, startPage + maxLinks - 1);

    if (endPage - startPage + 1 < maxLinks) {
      startPage = Math.max(1, endPage - maxLinks + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      links.push(i);
    }
    return links;
  };

  const exportData = async () => {
    try {
      // Fetch all transactions without pagination
      const response = await axios.get(`${API_URL}/transactions/history/user/${userId}/export`, {
        params: {
          search: search || undefined,
          quickFilter: timeFilter === "all" ? undefined : timeFilter,
        },
        withCredentials: true,
      });

      const transactionsData = response.data.transactions;
      if (!Array.isArray(transactionsData)) {
        throw new Error("Transactions data is not an array");
      }

      const formattedData = transactionsData.map((txn) => ({
        "Transaction ID": txn.id,
        Customer: `${txn.user.name} (CUST${txn.customer_id || String(txn.id).slice(-3)})`,
        Amount: `₹${Math.abs(txn.amount).toFixed(2)} ${txn.amount < 0 ? "(Out)" : "(In)"}`,
        "Date & Time": new Date(txn.datetime).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        Status: txn.status,
      }));

      if (exportFormat === "csv") {
        // Generate CSV
        const headers = ["Transaction ID,Customer,Amount,Date & Time,Status"];
        const csvRows = formattedData.map((row) =>
          `"${row["Transaction ID"]}","${row.Customer}","${row.Amount}","${row["Date & Time"]}","${row.Status}"`
        );
        const csvContent = headers.concat(csvRows).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "transactions.csv");
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
      } else if (exportFormat === "excel") {
        // Generate Excel
        const ws = XLSX.utils.json_to_sheet(formattedData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Transactions");
        XLSX.writeFile(wb, "transactions.xlsx");
      } else if (exportFormat === "pdf") {
        // Generate PDF
        const doc = new jsPDF();
        doc.text("Transaction History", 14, 20);
        autoTable(doc, {
          startY: 30,
          head: [["Transaction ID", "Customer", "Amount", "Date & Time", "Status"]],
          body: formattedData.map((row) => [
            row["Transaction ID"],
            row.Customer,
            row.Amount,
            row["Date & Time"],
            row.Status,
          ]),
          theme: "grid",
          headStyles: { fillColor: [0, 0, 0] },
          styles: { fontSize: 8 },
        });
        doc.save("transactions.pdf");
      }

      setOpenDialog(false);
    } catch (err) {
      console.error("Error exporting transactions:", err);
      setError(
        err.response?.status === 404
          ? "Export feature is not available. Please contact support."
          : "Failed to export transactions. Please try again."
      );
      setOpenDialog(false);
    }
  };

  const handleExport = () => {
    setOpenDialog(true);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <Card className="w-full max-w-5xl mx-auto border-l-4 border-l-gray-800 border-r-4 border-r-gray-200">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 pb-2">
          <CardTitle className="text-lg sm:text-xl font-semibold">
            Transaction Overview
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded">
              <p>{error}</p>
              {error.includes("Session expired") && (
                <Button
                  className="mt-2 bg-blue-600 text-white hover:bg-blue-700"
                  onClick={() => navigate("/login")}
                >
                  Log In
                </Button>
              )}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <Card className="border-l-4 border-l-blue-600 border-r-4 border-r-blue-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium">
                  Current Balance
                </CardTitle>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-base sm:text-lg font-bold">
                  ₹{currentBalance.toLocaleString("en-IN")}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-600 border-r-4 border-r-green-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium">
                  Total Transactions
                </CardTitle>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-base sm:text-lg font-bold">
                  {totalTransactions}
                </p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-purple-600 border-r-4 border-r-purple-200">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
                <CardTitle className="text-sm font-medium">
                  Today's Transactions
                </CardTitle>
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-base sm:text-lg font-bold">
                  {todaysTransactions}
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <Select onValueChange={handleTimeFilterChange} value={timeFilter}>
              <SelectTrigger className="w-full sm:w-[180px] text-xs sm:text-sm">
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="today">Today</SelectItem>
              </SelectContent>
            </Select>
            <Input
              className="w-full sm:w-[300px] text-xs sm:text-sm"
              placeholder="Search by name, ID, or dc"
              value={search}
              onChange={handleSearchChange}
            />
            <Button
              className="w-full sm:w-[120px] bg-[#070149] text-white hover:bg-[#05012e] text-xs sm:text-sm flex items-center gap-1"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>

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

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left text-gray-500 min-w-[600px]">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                <tr>
                  <th className="px-2 sm:px-4 py-2">Transaction ID</th>
                  <th className="px-2 sm:px-4 py-2">Customer</th>
                  <th className="px-2 sm:px-4 py-2">Amount</th>
                  <th className="px-2 sm:px-4 py-2">Date & Time</th>
                  <th className="px-2 sm:px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      Loading...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-4">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction, index) => (
                    <tr key={index} className="bg-white border-b">
                      <td className="px-2 sm:px-4 py-2">{transaction.id}</td>
                      <td className="px-2 sm:px-4 py-2">{transaction.customer}</td>
                      <td className="px-2 sm:px-4 py-2">{transaction.amount}</td>
                      <td className="px-2 sm:px-4 py-2">{transaction.date}</td>
                      <td className="px-2 sm:px-4 py-2">
                        <Badge
                          className={`text-xs ${
                            transaction.status === "Success"
                              ? "bg-green-100 text-green-800"
                              : transaction.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {transaction.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4">
            <span className="text-xs sm:text-sm">
              Showing {(page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, totalTransactions)} of {totalTransactions}{" "}
              transactions
            </span>
            <div className="flex items-center gap-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(page - 1);
                      }}
                    />
                  </PaginationItem>
                  {getPaginationLinks().map((pageNum) => (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        isActive={page === pageNum}
                        onClick={(e) => {
                          e.preventDefault();
                          handlePageChange(pageNum);
                        }}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(page + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserHistory;