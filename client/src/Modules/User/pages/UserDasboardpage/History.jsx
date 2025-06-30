"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Download,
  FileText,
  FileSpreadsheet,
  FileSignature,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  DialogClose,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

const TransactionHistory = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState("All");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");

  // Fetch transactions from the backend
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/transactions/fetch-all-transaction`,
        { withCredentials: true }
      );
      const allTransactions = res.data.data;
      console.log("Fetched Transactions:", allTransactions); // Debug log

      // Filter transactions where the user is either sender or receiver
      const userTransactions = allTransactions.filter(
        (tx) =>
          tx.sender_id?._id === user?._id || tx.receiver_id?._id === user?._id
      );
      console.log("User Transactions:", userTransactions); // Debug log

      // Group transactions by date
      const grouped = groupTransactionsByDate(userTransactions);
      setTransactions(grouped);
    } catch (err) {
      console.error("Fetch transactions failed:", err);
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  // Group transactions by date
  const groupTransactionsByDate = (txs) => {
    const groups = {};
    txs.forEach((tx) => {
      const date = new Date(tx.created_at);
      const dateKey = getDateKey(date);

      // Determine description based on transaction type and user role
      let description = "";
      if (tx.transaction_type === "Transfer") {
        description =
          tx.sender_id._id === user?._id
            ? `Paid to ${tx.receiver_id.name}`
            : `Received from ${tx.sender_id.name}`;
      } else if (tx.transaction_type === "TopUp") {
        description = "Added to Wallet";
      } else if (tx.transaction_type === "Refund") {
        description =
          tx.sender_id._id === user?._id
            ? `Refunded to ${tx.receiver_id.name}`
            : `Refunded from ${tx.sender_id.name}`;
      }

      const amount =
        tx.sender_id._id === user?._id
          ? -parseFloat(tx.amount)
          : parseFloat(tx.amount);

      if (!groups[dateKey]) {
        groups[dateKey] = { date: dateKey, items: [] };
      }
      groups[dateKey].items.push({
        name: description,
        time: formatDateTime(date),
        amount,
        _id: tx._id,
        transaction_type: tx.transaction_type,
        transaction_id: tx.transaction_id || tx._id, // Include transaction_id for export
        customer_id: tx.customer_id || "N/A", // Include customer_id for export
      });
    });

    return Object.values(groups).sort((a, b) => {
      const dateA = new Date(a.items[0].time.split("•")[0]);
      const dateB = new Date(b.items[0].time.split("•")[0]);
      return dateB - dateA;
    });
  };

  // Get date key (e.g., "Today", "Yesterday", or formatted date)
  const getDateKey = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return "Today";
    } else if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  // Format date and time for display
  const formatDateTime = (date) => {
    return `${date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })} • ${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })}`;
  };

  // Parse time for sorting
  const parseTime = (str) => {
    const [datePart, timePart] = str.split("•").map((s) => s.trim());
    return new Date(`${datePart} ${timePart}`);
  };

  // Apply filter
  const filteredTransactions =
    filter === "All"
      ? transactions
      : transactions.filter((group) => group.date === filter);

  // Export data function
  const exportData = () => {
    // Flatten grouped transactions and add serial numbers
    const data = filteredTransactions
      .flatMap((group, groupIndex) =>
        group.items.map((item, itemIndex) => ({
          "S.No": groupIndex * group.items.length + itemIndex + 1,
          "Transaction ID": item.transaction_id,
          Description: item.name,
          "Customer ID": item.customer_id,
          Amount: item.amount,
          "Formatted Amount": `${item.amount > 0 ? "+" : "-"}${Math.abs(item.amount).toFixed(2)}`,
          "Date & Time": item.time,
          Type: item.transaction_type,
        }))
      );

    // Calculate total amount
    const totalAmount = data.reduce((sum, item) => sum + item.Amount, 0);

    if (exportFormat === "csv" || exportFormat === "excel") {
      // Add total row to the data
      const dataWithTotal = [
        ...data,
        {
          "S.No": "",
          "Transaction ID": "TOTAL",
          Description: "",
          "Customer ID": "",
          Amount: totalAmount,
          "Formatted Amount": totalAmount.toFixed(2),
          "Date & Time": "",
          Type: "",
        },
      ];

      const worksheet = XLSX.utils.json_to_sheet(dataWithTotal);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");

      // Style the total row for Excel
      if (exportFormat === "excel") {
        const ws = workbook.Sheets["Transactions"];
        const totalRow = data.length + 2; // +2 because header is row 1 and data starts at row 2
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

      // Title
      doc.setFontSize(16);
      doc.text("Transaction History Report", 14, 10);

      // Date range info
      doc.setFontSize(10);
      doc.text(`Date Range: ${filter}`, 14, 18);

      // Prepare data for PDF table
      const tableData = data.map((item) => [
        item["S.No"],
        item["Transaction ID"],
        item.Description,
        item["Customer ID"],
        item["Formatted Amount"],
        item["Date & Time"],
        item.Type,
      ]);

      // PDF table
      autoTable(doc, {
        startY: 25,
        head: [
          ["S.No", "Transaction ID", "Description", "Customer ID", "Amount", "Date & Time", "Type"],
        ],
        body: tableData,
        foot: [
          ["", "", "", "", totalAmount.toFixed(2), "", ""],
        ],
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
          fillColor: [0, 0, 82], // Dark blue header
          textColor: 255, // White text
          fontStyle: "bold",
        },
        footStyles: {
          fillColor: [220, 220, 220], // Gray footer
          textColor: 0, // Black text
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: "auto" }, // S.No
          1: { cellWidth: "auto" }, // Transaction ID
          2: { cellWidth: "auto" }, // Description
          3: { cellWidth: "auto" }, // Customer ID
          4: { cellWidth: "auto" }, // Amount
          5: { cellWidth: "auto" }, // Date & Time
          6: { cellWidth: "auto" }, // Type
        },
      });

      doc.save("transaction_history.pdf");
    }

    setOpenDialog(false);
  };

  useEffect(() => {
    if (user) {
      fetchTransactions();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return <div>Loading transactions...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!user) {
    return <div>Please log in to view your transaction history.</div>;
  }

  return (
    <Card className="mt-10 w-full max-w-6xl p-6 rounded-2xl shadow-md bg-white mx-auto">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl md:text-2xl font-bold text-[#00004d]">
          Transaction History
        </CardTitle>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-500">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {["All", "Today", "Yesterday"].map((option) => (
                <DropdownMenuItem
                  key={option}
                  onClick={() => setFilter(option)}
                  className={filter === option ? "font-semibold text-blue-600" : ""}
                >
                  {option}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            onClick={() => setOpenDialog(true)}
            className="bg-[#000052] text-white hover:bg-[#000052d2] gap-2"
            size="sm"
          >
            <Download size={16} /> Export
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-[600px] md:max-h-[400px] overflow-y-auto pr-2">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-4">No transactions found.</div>
          ) : (
            filteredTransactions.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-4">
                <div className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-50 sticky top-0 z-10">
                  {group.date}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.items
                      .slice()
                      .sort((a, b) => parseTime(b.time) - parseTime(a.time))
                      .map((item, index) => (
                        <TableRow key={item._id} className="items-center">
                          <TableCell className="align-middle">
                            <div
                              className={`w-8 h-8 flex items-center justify-center rounded-full ${
                                item.amount > 0
                                  ? "bg-green-100 text-green-600"
                                  : "bg-red-100 text-red-600"
                              }`}
                            >
                              {item.amount > 0 ? (
                                <ArrowDownRight className="w-4 h-4" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="align-middle text-left">
                            <p className="font-medium">{item.name}</p>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Clock className="w-3 h-3 mr-1" />
                              {item.time}
                            </div>
                          </TableCell>
                          <TableCell className="align-middle text-right font-medium">
                            <span
                              className={
                                item.amount > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {item.amount > 0 ? "+" : "-"}₹
                              {Math.abs(item.amount).toFixed(2)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            ))
          )}
        </div>
      </CardContent>

      {/* Export Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">Export Transaction History</DialogTitle>
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
    </Card>
  );
};

export default TransactionHistory;