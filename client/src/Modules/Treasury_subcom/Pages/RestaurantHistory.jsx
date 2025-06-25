import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FileText, FileSpreadsheet, FileSignature } from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const RestaurantHistory = () => {
  const [date, setDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");

  const restaurants = ["Olive Garden", "The Capital Grille", "Red Lobster", "Ruth's Chris"];
  const transactionTypes = ["Purchase", "Refund"];

  const transactions = [
    { id: "TXN00087", customer: "Rahul Sharma (CUST001)", amount: -250, dateTime: "15/3/2023 03:32 pm", status: "Completed" },
    { id: "TXN00086", customer: "Priya Patel (CUST002)", amount: -180, dateTime: "15/3/2023 01:45 pm", status: "Completed" },
    { id: "TXN00085", customer: "Amit Kumar (CUST003)", amount: -320, dateTime: "15/3/2023 12:20 pm", status: "Completed" },
    { id: "TXN00084", customer: "Sneha Gupta (CUST004)", amount: -150, dateTime: "15/3/2023 11:15 am", status: "Completed" },
    { id: "TXN00083", customer: "Vikram Singh (CUST005)", amount: -200, dateTime: "15/3/2023 10:30 am", status: "Completed" },
    { id: "TXN00082", customer: "Neha Kapoor (CUST006)", amount: -300, dateTime: "14/3/2023 04:15 pm", status: "Completed" },
    { id: "TXN00081", customer: "Rohan Mehta (CUST007)", amount: -175, dateTime: "14/3/2023 02:30 pm", status: "Completed" },
    { id: "TXN00080", customer: "Anita Desai (CUST008)", amount: -220, dateTime: "14/3/2023 11:00 am", status: "Completed" },
    { id: "TXN00079", customer: "Suresh Patel (CUST009)", amount: -190, dateTime: "13/3/2023 03:45 pm", status: "Completed" },
    { id: "TXN00078", customer: "Kavita Sharma (CUST010)", amount: -260, dateTime: "13/3/2023 01:20 pm", status: "Completed" },
  ];

  const exportData = () => {
    if (exportFormat === "csv") {
      const csv = [
        ["Transaction ID, Customer, Amount, Date & Time, Status"],
        ...transactions.map(row => `${row.id}, "${row.customer}", ₹${row.amount}, ${row.dateTime}, ${row.status}`),
      ].join("\n");
      const blob = new Blob([csv], { type: "text/csv" });
      saveAs(blob, "transaction_history.csv");
    } else if (exportFormat === "excel") {
      const ws = XLSX.utils.json_to_sheet(transactions);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transactions");
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(blob, "transaction_history.xlsx");
    } else if (exportFormat === "pdf") {
      const doc = new jsPDF();
      autoTable(doc, {
        head: [["Transaction ID", "Customer", "Amount", "Date & Time", "Status"]],
        body: transactions.map(row => [
          row.id,
          row.customer,
          `₹${row.amount}`,
          row.dateTime,
          row.status,
        ]),
      });
      doc.save("transaction_history.pdf");
    }
    setOpenDialog(false);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6">
      <Card className="w-full max-w-5xl mx-auto">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0 pb-2">
          <CardTitle className="text-xl sm:text-2xl font-bold" style={{ color: '#070149' }}>Restaurant History</CardTitle>
          <Button onClick={() => setOpenDialog(true)} className="bg-[#070149] text-white text-sm sm:text-base">
            Export Data
          </Button>
        </CardHeader>

        <CardContent className="p-4 sm:p-6">
          {/* Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Restaurant Name</label>
              <Select>
                <SelectTrigger className="mt-1 w-full text-sm sm:text-base">
                  <SelectValue placeholder="All Restaurants" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Restaurants</SelectItem>
                  {restaurants.map((restaurant) => (
                    <SelectItem key={restaurant} value={restaurant}>
                      {restaurant}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Transaction Date</label>
              <div className="relative mt-1">
                <Button
                  variant="outline"
                  className="w-full justify-between text-sm sm:text-base"
                  onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                >
                  {date.toLocaleDateString()}
                  <span className="ml-2">📅</span>
                </Button>
                {isCalendarOpen && (
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(selectedDate) => {
                      setDate(selectedDate || date);
                      setIsCalendarOpen(false);
                    }}
                    className="mt-2 rounded-md border absolute z-10 bg-white w-max"
                    onClickOutside={() => setIsCalendarOpen(false)}
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Transaction Type</label>
              <Select>
                <SelectTrigger className="mt-1 w-full text-sm sm:text-base">
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
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sort By</label>
              <Select>
                <SelectTrigger className="mt-1 w-full text-sm sm:text-base">
                  <SelectValue placeholder="A to Z" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="a-z">A to Z</SelectItem>
                  <SelectItem value="z-a">Z to A</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <h2 className="text-lg sm:text-xl font-semibold mb-2" style={{ color: '#070149' }}>Transaction History</h2>
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
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="bg-white border-b">
                    <td className="px-2 sm:px-4 py-2">{transaction.id}</td>
                    <td className="px-2 sm:px-4 py-2">{transaction.customer}</td>
                    <td className="px-2 sm:px-4 py-2 text-red-600">₹{transaction.amount}</td>
                    <td className="px-2 sm:px-4 py-2">{transaction.dateTime}</td>
                    <td className="px-2 sm:px-4 py-2">
                      <Badge className="bg-green-100 text-green-800 text-xs"> {transaction.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-2">
              <span className="text-gray-600 text-xs sm:text-sm">Showing 1 to 10 of 10 transactions</span>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled>←</Button>
                  <Button variant="outline" size="sm">1</Button>
                  <Button variant="outline" size="sm">→</Button>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.history.back()}>×</Button>
              </div>
            </div>
          </div>

          {/* Export Dialog */}
          <Dialog open={openDialog} onOpenChange={setOpenDialog}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-semibold">
                  Export Transactions
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <RadioGroup
                  value={exportFormat}
                  onValueChange={setExportFormat}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded">
                    <RadioGroupItem value="csv" id="csv" />
                    <Label htmlFor="csv" className="flex items-center gap-2">
                      <FileText size={18} /> CSV
                    </Label>
                  </div>
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded">
                    <RadioGroupItem value="excel" id="excel" />
                    <Label htmlFor="excel" className="flex items-center gap-2">
                      <FileSpreadsheet size={18} /> Excel (.xlsx)
                    </Label>
                  </div>
                  <div className="flex items-center gap-2 cursor-pointer hover:bg-muted p-2 rounded">
                    <RadioGroupItem value="pdf" id="pdf" />
                    <Label htmlFor="pdf" className="flex items-center gap-2">
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

        </CardContent>
      </Card>
    </div>
  );
};

export default RestaurantHistory;
