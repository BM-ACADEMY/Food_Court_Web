"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  CalendarDays,
  Search,
  Download,
  Wallet,
  ListOrdered,
  Clock,
  FileText,
  FileSpreadsheet,
  FileSignature,
  Filter,
} from "lucide-react";
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
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useAuth } from "@/context/AuthContext";

const PER_PAGE = 15;

export default function TransactionDashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [currentBalance, setCurrentBalance] = useState("0.00");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [typeFilter, setTypeFilter] = useState("All");

  // Fetch balance and transactions
  const loadData = async () => {
    if (!user) return;

    setIsLoading(true);
    setError(null);
    try {
      // Fetch balance
      const balanceRes = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/user-balance/fetch-balance-by-id/${user._id}`,
        { withCredentials: true }
      );
      setCurrentBalance(balanceRes.data.data.balance || "0.00");

      // Fetch transactions
      const txRes = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/transactions/fetch-all-transaction`,
        { withCredentials: true }
      );
      const allTransactions = txRes.data.data;

      // Filter transactions where user is sender or receiver
      const userTransactions = allTransactions.filter(
        (tx) => tx.sender_id?._id === user._id || tx.receiver_id?._id === user._id
      );
      console.log("User Transactions:", userTransactions);

      setTransactions(userTransactions);
    } catch (error) {
      console.error("Failed to load data:", error);
      setError(error.response?.data?.message || "Failed to load transactions or balance.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Date filtering logic
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const dateFiltered = transactions.filter((txn) => {
    const txnDate = new Date(txn.created_at);
    const txnDateOnly = new Date(txnDate.getFullYear(), txnDate.getMonth(), txnDate.getDate());
    if (dateFilter === "Today") return txnDateOnly.getTime() === today.getTime();
    if (dateFilter === "Yesterday") return txnDateOnly.getTime() === yesterday.getTime();
    return true; // All Time
  });

  // Type filtering logic
  const typeFiltered = dateFiltered.filter((txn) => {
    if (typeFilter === "All") return true;
    return txn.transaction_type === typeFilter;
  });

  // Search filtering logic
  const filtered = typeFiltered.filter((txn) => {
    const customerName =
      txn.sender_id?._id === user._id ? txn.receiver_id?.name : txn.sender_id?.name;
    const customerId = txn.customer_id || "";
    return (
      (customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (txn.transaction_id || txn._id).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (txn.amount || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (txn.status || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (txn.transaction_type || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  // Export data
  const exportData = () => {
    const data = filtered.map((txn) => {
      const customerName =
        txn.sender_id?._id === user._id ? txn.receiver_id?.name : txn.sender_id?.name;
      const customerId = txn.customer_id || "N/A";
      const amountPrefix = txn.sender_id?._id === user._id ? "-" : "+";
      const dateTime = new Date(txn.created_at).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      return {
        "Transaction ID": txn.transaction_id || txn._id,
        Customer: customerName || "Unknown",
        "Customer ID": customerId,
        Amount: `${amountPrefix}${txn.amount}`,
        "Date & Time": dateTime,
        Status: txn.status,
        Type: txn.transaction_type,
      };
    });

    if (exportFormat === "csv" || exportFormat === "excel") {
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
      const fileType = exportFormat === "csv" ? "csv" : "xlsx";
      const fileBuffer = XLSX.write(workbook, { bookType: fileType, type: "array" });
      const blob = new Blob([fileBuffer], {
        type:
          exportFormat === "csv"
            ? "text/csv;charset=utf-8;"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `transactions.${fileType}`);
    } else if (exportFormat === "pdf") {
      const doc = new jsPDF();
      doc.text("Transaction Report", 14, 10);
      autoTable(doc, {
        startY: 20,
        head: [
          ["Transaction ID", "Customer", "Customer ID", "Amount", "Date & Time", "Status", "Type"],
        ],
        body: data.map((txn) => Object.values(txn)),
      });
      doc.save("transactions.pdf");
    }

    setOpenDialog(false);
  };

  // Calculate today's transactions
  const todaysTransactions = transactions.filter((txn) => {
    const txnDate = new Date(txn.created_at);
    const txnDateOnly = new Date(txnDate.getFullYear(), txnDate.getMonth(), txnDate.getDate());
    return txnDateOnly.getTime() === today.getTime();
  }).length;

  if (!user) {
    return <div className="text-center py-8">Please log in to view your transaction dashboard.</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        {error}{" "}
        <Button onClick={loadData} className="ml-2">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white border-l-4 border-blue-700 shadow-sm">
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Current Balance</p>
              <p className="text-2xl font-semibold text-blue-900">₹{parseFloat(currentBalance).toFixed(2)}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <Wallet className="text-blue-700" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-green-700 shadow-sm">
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Transactions</p>
              <p className="text-2xl font-semibold text-green-900">{transactions.length}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <ListOrdered className="text-green-700" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-l-4 border-purple-700 shadow-sm">
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Today's Transactions</p>
              <p className="text-2xl font-semibold text-purple-900">{todaysTransactions}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <Clock className="text-purple-700" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarDays size={16} /> {dateFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setDateFilter("Today")}>Today</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter("Yesterday")}>Yesterday</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter("All Time")}>All Time</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter size={16} /> Type: {typeFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTypeFilter("All")}>All</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter("Transfer")}>Transfer</DropdownMenuItem>
              {/* <DropdownMenuItem onClick={() => setTypeFilter("TopUp")}>TopUp</DropdownMenuItem> */}
              <DropdownMenuItem onClick={() => setTypeFilter("Refund")}>Refund</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <Input
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by name, ID, amount, type..."
              className="pl-8 text-sm"
            />
          </div>
        </div>

        <Button onClick={() => setOpenDialog(true)} className="bg-[#000052] text-white hover:bg-[#000052d2] gap-2">
          <Download size={16} /> Export
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left border-t">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="p-4 font-medium">Transaction ID</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Date & Time</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Type</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={6} className="p-4 text-center">Loading...</td></tr>
            ) : paginated.length > 0 ? (
              paginated.map((txn) => {
                const customerName =
                  txn.sender_id?._id === user._id ? txn.receiver_id?.name : txn.sender_id?.name;
                const customerId = txn.customer_id || "N/A";
                const amountPrefix = txn.sender_id?._id === user._id ? "-" : "+";
                return (
                  <tr key={txn._id} className="border-t hover:bg-gray-50">
                    <td className="p-4">{txn.transaction_id || txn._id}</td>
                    <td className="p-4">
                      <div className="font-medium">{customerName || "Unknown"}</div>
                      <div className="text-xs text-gray-500">{customerId}</div>
                    </td>
                    <td className={`p-4 font-semibold ${amountPrefix === "+" ? "text-green-600" : "text-red-600"}`}>
                      ₹{parseFloat(txn.amount || "0.00").toFixed(2)}
                    </td>
                    <td className="p-4">
                      {new Date(txn.created_at).toLocaleString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                      })}
                    </td>
                    <td className="p-4 text-green-600 font-medium">{txn.status || "Unknown"}</td>
                    <td className="p-4">{txn.transaction_type || "Unknown"}</td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={6} className="p-4 text-center text-gray-400">No results found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination className="mt-6 justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage((p) => Math.max(1, p - 1));
              }}
            />
          </PaginationItem>

          {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
            const page = i + 1;
            return (
              <PaginationItem key={i}>
                <PaginationLink
                  href="#"
                  isActive={currentPage === page}
                  onClick={(e) => {
                    e.preventDefault();
                    setCurrentPage(page);
                  }}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          {totalPages > 5 && (
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
          )}

          <PaginationItem>
            <PaginationNext
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage((p) => Math.min(totalPages, p + 1));
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>

      {/* Export Dialog */}
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
}