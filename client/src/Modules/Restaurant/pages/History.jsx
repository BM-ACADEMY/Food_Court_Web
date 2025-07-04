"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { debounce } from "lodash";
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
import getSocket from "@/socketConfig/Socket";
const PER_PAGE = 10;
const socket = getSocket();


export default function History() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [todayBalance, setTodayBalance] = useState("0.00");
  const [transactionCount, setTransactionCount] = useState(0); // Today's transactions
  const [totalTransactionCount, setTotalTransactionCount] = useState(0); // Total transactions
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [dateFilter, setDateFilter] = useState("All Time");
  const [typeFilter, setTypeFilter] = useState("All");

  const loadData = async () => {
    if (!user) {
      setError("Please log in to view transaction history.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      // Fetch today's balance and transaction count
      const balanceRes = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/transactions/today-balance/${user._id}`,
        { withCredentials: true }
      );
      setTodayBalance(balanceRes.data.data.todayBalance || "0.00");
      setTransactionCount(balanceRes.data.data.transactionCount || 0);

      // Fetch transactions and total transaction count
      const txRes = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/transactions/fetch-all-transaction`,
        {
          params: {
            userId: user._id,
            dateFilter,
            typeFilter,
            page: currentPage,
            limit: PER_PAGE,
          },
          withCredentials: true,
        }
      );
      setTransactions(txRes.data.data);
      setTotalPages(txRes.data.pagination.totalPages);
      // Set totalTransactionCount only when dateFilter is "All Time" and typeFilter is "All"
      if (dateFilter === "All Time" && typeFilter === "All") {
        setTotalTransactionCount(txRes.data.pagination.totalTransactions || 0);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
      let errorMessage = "Failed to load transactions or today's balance.";
      if (error.code === "ERR_NETWORK") {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (error.response?.status === 401) {
        errorMessage = "Unauthorized. Please log in again.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDataDebounced = debounce(loadData, 1000);

  useEffect(() => {
    if (user?._id) {
      socket.emit("joinRestaurantRoom", user._id.toString());

      socket.on("newTransaction", (data) => {
        console.log("🔔 New transaction received via socket:", data);
        loadDataDebounced();
      });

      return () => {
        socket.off("newTransaction");
        loadDataDebounced.cancel();
      };
    }
  }, [user?._id]);

  useEffect(() => {
    loadData();
  }, [user, dateFilter, typeFilter, currentPage]);

  const filtered = transactions.filter((txn) => {
    const customerName =
      txn.sender_id?._id.toString() === user._id.toString()
        ? txn.receiver_id?.name
        : txn.sender_id?.name;
    const customerId = txn.customer_id || "N/A";
    return (
      (customerName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (txn.transaction_id || txn._id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (txn.amount || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (txn.status || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (txn.transaction_type || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const paginated = filtered;

  const exportData = () => {
    const data = filtered.map((txn, index) => {
      const customerName =
        txn.sender_id?._id.toString() === user._id.toString()
          ? txn.receiver_id?.name
          : txn.sender_id?.name;
      const customerId = txn.customer_id || "N/A";
      const amountPrefix =
        txn.sender_id?._id.toString() === user._id.toString() ? "-" : "+";
      const numericAmount = parseFloat(txn.amount || "0");
      const dateTime = new Date(txn.created_at).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
      });
      return {
        "S.No": index + 1,
        "Transaction ID": txn.transaction_id || txn._id,
        Customer: customerName || "Unknown",
        "Customer ID": customerId,
        Amount: numericAmount,
        "Formatted Amount": `${amountPrefix}${numericAmount.toFixed(2)}`,
        "Date & Time": dateTime,
        Status: txn.status,
        Type: txn.transaction_type,
      };
    });

    const totalAmount = data.reduce((sum, txn) => {
      const amount = txn.Amount;
      const isOutgoing = txn["Formatted Amount"].startsWith("-");
      return isOutgoing ? sum - amount : sum + amount;
    }, 0);

    if (exportFormat === "csv" || exportFormat === "excel") {
      const dataWithTotal = [
        ...data,
        {
          "S.No": "",
          "Transaction ID": "TOTAL",
          Customer: "",
          "Customer ID": "",
          Amount: totalAmount,
          "Formatted Amount": totalAmount.toFixed(2),
          "Date & Time": "",
          Status: "",
          Type: "",
        },
      ];

      const worksheet = XLSX.utils.json_to_sheet(dataWithTotal);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

      if (exportFormat === "excel") {
        const ws = workbook.Sheets["Transactions"];
        const totalRow = data.length + 2;
        ws[`A${totalRow}`].s = { font: { bold: true } };
        ws[`E${totalRow}`].s = { font: { bold: true } };
        ws[`F${totalRow}`].s = { font: { bold: true } };
      }

      const fileType = exportFormat === "csv" ? "csv" : "xlsx";
      const fileBuffer = XLSX.write(workbook, { bookType: fileType, type: "array" });
      const blob = new Blob([fileBuffer], {
        type:
          exportFormat === "csv"
            ? "text/csv;charset=utf-8;"
            : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      saveAs(blob, `transaction_history.${fileType}`);
    } else if (exportFormat === "pdf") {
      const doc = new jsPDF();

      doc.setFontSize(16);
      doc.text("Transaction History Report", 14, 10);

      doc.setFontSize(10);
      doc.text(`Date Range: ${dateFilter}`, 14, 18);

      const tableData = data.map((txn) => [
        txn["S.No"],
        txn["Transaction ID"],
        txn.Customer,
        txn["Formatted Amount"],
        txn["Date & Time"],
        txn.Status,
        txn.Type,
      ]);

      autoTable(doc, {
        startY: 25,
        head: [
          [
            "S.No",
            "Transaction ID",
            "Customer",
            "Amount",
            "Date & Time",
            "Status",
            "Type",
          ],
        ],
        body: tableData,
        foot: [["", "", "TOTAL", totalAmount.toFixed(2), "", "", ""]],
        didDrawPage: function (data) {
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(10);
          for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.text(
              `Page ${i} of ${pageCount}`,
              data.settings.margin.left,
              doc.internal.pageSize.height - 10
            );
          }
        },
        headStyles: {
          fillColor: [0, 0, 82],
          textColor: 255,
          fontStyle: "bold",
        },
        footStyles: {
          fillColor: [220, 220, 220],
          textColor: 0,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: "auto" },
          1: { cellWidth: "auto" },
          2: { cellWidth: "auto" },
          3: { cellWidth: "auto" },
          4: { cellWidth: "auto" },
          5: { cellWidth: "auto" },
          6: { cellWidth: "auto" },
        },
      });

      doc.save("transaction_history.pdf");
    }

    setOpenDialog(false);
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        Please log in to view your transaction history.
      </div>
    );
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white border-l-4 border-blue-700 shadow-sm">
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Today's Balance</p>
              <p className="text-2xl font-semibold text-blue-900">
                ₹{parseFloat(todayBalance).toFixed(2)}
              </p>
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
              <p className="text-2xl font-semibold text-green-900">
                {totalTransactionCount}
              </p>
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
              <p className="text-2xl font-semibold text-purple-900">{transactionCount}</p>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <Clock className="text-purple-700" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarDays size={16} /> {dateFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setDateFilter("Today")}>
                Today
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter("Yesterday")}>
                Yesterday
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter("All Time")}>
                All Time
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter size={16} /> Type: {typeFilter}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setTypeFilter("All")}>
                All
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter("Transfer")}>
                Transfer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTypeFilter("Refund")}>
                Refund
              </DropdownMenuItem>
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
              placeholder="Search by name, customer ID, amount, type..."
              className="pl-8 text-sm"
            />
          </div>
        </div>

        <Button
          onClick={() => setOpenDialog(true)}
          className="bg-[#000052] text-white hover:bg-[#000052d2] gap-2"
        >
          <Download size={16} /> Export
        </Button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <table className="w-full text-sm text-left border-t">
          <thead className="bg-gray-100 text-gray-700 uppercase text-xs">
            <tr>
              <th className="p-4 font-medium w-12"></th>
              <th className="p-4 font-medium">Transaction ID</th>
              <th className="p-4 font-medium">Customer</th>
              <th className="p-4 font-medium">Customer ID</th>
              <th className="p-4 font-medium">Amount</th>
              <th className="p-4 font-medium">Date & Time</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Type</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-4 text-center">
                  Loading...
                </td>
              </tr>
            ) : paginated.length > 0 ? (
              paginated.map((txn) => {
                const customerName =
                  txn.sender_id?._id.toString() === user._id.toString()
                    ? txn.receiver_id?.name || "Unknown"
                    : txn.sender_id?.name || "Unknown";
                const customerId = txn.customer_id || "N/A";
                const amountPrefix =
                  txn.sender_id?._id.toString() === user._id.toString()
                    ? "-"
                    : "+";
                return (
                  <tr key={txn._id} className="border-t hover:bg-gray-50">
                    <td className="p-4 w-12 text-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </td>
                    <td className="p-4">{txn.transaction_id || txn._id}</td>
                    <td className="p-4">{customerName}</td>
                    <td className="p-4 text-gray-500">{customerId}</td>
                    <td
                      className={`p-4 font-semibold ${
                        amountPrefix === "+" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {amountPrefix}₹{parseFloat(txn.amount || "0.00").toFixed(2)}
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
                    <td className="p-4 text-green-600 font-medium">
                      {txn.status || "Unknown"}
                    </td>
                    <td className="p-4">{txn.transaction_type || "Unknown"}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="p-4 text-center text-gray-400">
                  No results found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Export Transaction History
            </DialogTitle>
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