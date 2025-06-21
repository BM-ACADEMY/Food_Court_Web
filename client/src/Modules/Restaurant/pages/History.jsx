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
  FileSignature
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

const PER_PAGE = 15;

export default function TransactionDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [openDialog, setOpenDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [dateFilter, setDateFilter] = useState("All Time");

  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get("/data/transactions.json");
        setTransactions(res.data);
      } catch (error) {
        console.error("Failed to load transactions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTransactions();
  }, []);

  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split("/").map(Number);
    return new Date(year, month - 1, day);
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const dateFiltered = transactions.filter((txn) => {
    const txnDate = parseDate(txn.date);
    if (dateFilter === "Today") return txnDate.getTime() === today.getTime();
    if (dateFilter === "Yesterday") return txnDate.getTime() === yesterday.getTime();
    if (dateFilter === "This Week") return txnDate >= startOfWeek && txnDate <= today;
    if (dateFilter === "This Month") return txnDate >= startOfMonth && txnDate <= today;
    return true; // All Time
  });

  const filtered = dateFiltered.filter((txn) =>
    txn.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    txn.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    txn.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    txn.amount.toLowerCase().includes(searchQuery.toLowerCase()) ||
    txn.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  const exportData = () => {
    const data = filtered.map(({ id, customer, customerId, amount, date, time, status }) => ({
      "Transaction ID": id,
      Customer: customer,
      "Customer ID": customerId,
      Amount: amount,
      Date: date,
      Time: time,
      Status: status,
    }));

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
        head: [["Transaction ID", "Customer", "Customer ID", "Amount", "Date", "Time", "Status"]],
        body: data.map((txn) => Object.values(txn)),
      });
      doc.save("transactions.pdf");
    }

    setOpenDialog(false);
  };

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white border-l-4 border-blue-700 shadow-sm">
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Current Balance</p>
              <p className="text-2xl font-semibold text-blue-900">₹10,000</p>
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
              <p className="text-2xl font-semibold text-purple-900">
                {transactions.filter(txn => parseDate(txn.date).getTime() === today.getTime()).length}
              </p>
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
              <DropdownMenuItem onClick={() => setDateFilter("This Week")}>This Week</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter("This Month")}>This Month</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDateFilter("All Time")}>All Time</DropdownMenuItem>
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
              placeholder="Search by name, ID, amount..."
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
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} className="p-4 text-center">Loading...</td></tr>
            ) : paginated.length > 0 ? (
              paginated.map((txn, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="p-4">{txn.id}</td>
                  <td className="p-4">
                    <div className="font-medium">{txn.customer}</div>
                    <div className="text-xs text-gray-500">{txn.customerId}</div>
                  </td>
                  <td className={`p-4 font-semibold ${txn.amount.startsWith("+") ? "text-green-600" : "text-red-600"}`}>
                    ₹{txn.amount.replace("+", "")}
                  </td>
                  <td className="p-4">{txn.date} {txn.time}</td>
                  <td className="p-4 text-green-600 font-medium">Completed</td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={5} className="p-4 text-center text-gray-400">No results found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex justify-end gap-2 text-sm">
        <Button variant="outline" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>Prev</Button>
        {Array.from({ length: totalPages }).map((_, i) => (
          <Button key={i} variant={currentPage === i + 1 ? "default" : "outline"} onClick={() => setCurrentPage(i + 1)}>
            {i + 1}
          </Button>
        ))}
        <Button variant="outline" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>Next</Button>
      </div>

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
