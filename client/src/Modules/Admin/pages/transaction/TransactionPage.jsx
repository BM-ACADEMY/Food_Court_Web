
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ClipboardList,
  DollarSign,
  BarChart2,
  BadgeX,
  Download,
  ChevronDownIcon,
  Pencil,
  Save,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "@/context/AuthContext"; // Assuming you have an AuthContext

const getRandomColor = () => {
  const colors = ["#FF6B6B", "#4ECDC4", "#556270", "#C7F464", "#FFA500"];
  return colors[Math.floor(Math.random() * colors.length)];
};

const Avatar = ({ name = "" }) => {
  const initials = name
    ? name.split(" ").map((word) => word[0]?.toUpperCase()).slice(0, 2).join("")
    : "U";
  const color = getRandomColor();

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
};

export default function TransactionHistory() {
  const { user } = useAuth();
  const [transactionType, setTransactionType] = useState("all");
  const [userType, setUserType] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [locations, setLocations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [fromDate, setFromDate] = useState(undefined);
  const [toDate, setToDate] = useState(undefined);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState("last 7 days");
  const [chartView, setChartView] = useState("daily");
  const [openTo, setOpenTo] = useState(false);
  const [openFrom, setOpenFrom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    avgTransactionValue: 0,
    totalRefunds: 0,
  });
  const [chartData, setChartData] = useState({ hourly: [], daily: [], weekly: [] });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalTransactions: 0,
  });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [sortOrder, setSortOrder] = useState("desc");
  const [editFormData, setEditFormData] = useState({
    amount: "",
    transaction_type: "",
    payment_method: "",
    status: "",
    remarks: "",
    location_id: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const locationResponse = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/locations/fetch-all-locations`
        );
        setLocations(locationResponse.data.data || []);

        const roleResponse = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/roles/fetch-all-roles`
        );
        setRoles(roleResponse.data.data || []);

        const params = {
          transactionType,
          userType,
          location: selectedLocation,
          paymentMethod,
          sortBy,
          sortOrder,
          fromDate: fromDate ? format(fromDate, "yyyy-MM-dd") : undefined,
          toDate: toDate ? format(toDate, "yyyy-MM-dd") : undefined,
          quickFilter: fromDate || toDate ? undefined : quickFilter,
          search,
          page: pagination.page,
          limit: pagination.limit,
        };
        const transactionResponse = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/transactions/history`,
          { params }
        );
        setTransactions(transactionResponse.data.transactions || []);
        setStats(
          transactionResponse.data.stats || {
            totalTransactions: 0,
            totalRevenue: 0,
            avgTransactionValue: 0,
            totalRefunds: 0,
          }
        );
        setChartData(
          transactionResponse.data.chartData || { hourly: [], daily: [], weekly: [] }
        );
        setPagination(
          transactionResponse.data.pagination || {
            page: 1,
            limit: 10,
            totalPages: 1,
            totalTransactions: 0,
          }
        );
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.error || "Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    transactionType,
    userType,
    selectedLocation,
    paymentMethod,
    sortBy,
    sortOrder,
    fromDate,
    toDate,
    quickFilter,
    search,
    pagination.page,
    pagination.limit,
  ]);

  const handleEditClick = (txn) => {
    setEditingTransactionId(txn.id);
    setEditFormData({
      amount: txn.amount.toString(),
      transaction_type: txn.type,
      payment_method: txn.paymentMethod || "",
      status: txn.status || "Success",
      remarks: txn.description || "",
      location_id: txn.location || "",
    });
  };

  const handleSaveEdit = async (transactionId) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/transactions/update-transaction/${transactionId}`,
        {
          ...editFormData,
          edited_by_id: user._id,
        }
      );
      if (response.data.success) {
        setTransactions((prev) =>
          prev.map((txn) =>
            txn.id === transactionId
              ? {
                  ...txn,
                  amount: parseFloat(editFormData.amount),
                  type: editFormData.transaction_type,
                  paymentMethod: editFormData.payment_method,
                  status: editFormData.status,
                  description: editFormData.remarks,
                  location: editFormData.location_id,
                  edited_at: new Date(),
                }
              : txn
          )
        );
        setEditingTransactionId(null);
        setEditFormData({
          amount: "",
          transaction_type: "",
          payment_method: "",
          status: "",
          remarks: "",
          location_id: "",
        });
      }
    } catch (err) {
      console.error("Error updating transaction:", err);
      setError("Failed to update transaction. Please try again.");
    }
  };

  const fetchAllTransactions = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/transactions/history`,
        {
          params: {
            transactionType: "all",
            userType: "all",
            location: "all",
            search: "",
            page: 1,
            limit: 10000,
          },
          withCredentials: true,
        }
      );
      return response.data.transactions || [];
    } catch (err) {
      console.error("Error fetching all transactions for export:", err);
      setError("Failed to fetch transactions for export.");
      return [];
    }
  };

  // Prepare export data
  const prepareExportData = (transactions) => {
    return transactions.map((txn, index) => ({
      "S.No": index + 1,
      "Date & Time": txn.datetime || format(new Date(), "yyyy-MM-dd HH:mm:ss"),
      "Transaction ID": txn.id || "Unknown",
      "Sender Name": txn.sender?.name || "Unknown",
      "Sender Role": txn.sender?.role || "Unknown",
      "Receiver Name": txn.receiver?.name || "Unknown",
      "Receiver Role": txn.receiver?.role || "Unknown",
      Type: txn.type || "Unknown",
      Description: txn.description || txn.remarks || "No description",
      "Payment Method": txn.paymentMethod || "Unknown",
      "Amount (₹)": txn.amount ? parseFloat(txn.amount) : 0,
      "Formatted Amount": txn.amount < 0 ? `-₹${Math.abs(txn.amount).toFixed(2)}` : `₹${txn.amount.toFixed(2)}`,
      Status: txn.status || "Unknown",
    }));
  };

  // Export to Excel with totals
  const exportToExcel = async () => {
    try {
      const allTransactions = await fetchAllTransactions();
      const data = prepareExportData(allTransactions);

      // Calculate total amount
      const totalAmount = data.reduce((sum, item) => sum + item["Amount (₹)"], 0);

      // Add total row
      const dataWithTotal = [
        ...data,
        {
          "S.No": "TOTAL",
          "Date & Time": "",
          "Transaction ID": "",
          "Sender Name": "",
          "Sender Role": "",
          "Receiver Name": "",
          "Receiver Role": "",
          Type: "",
          Description: "",
          "Payment Method": "",
          "Amount (₹)": totalAmount,
          "Formatted Amount": `₹${totalAmount.toFixed(2)}`,
          Status: "",
        },
      ];

      const ws = XLSX.utils.json_to_sheet(dataWithTotal);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Transactions");

      // Style the total row
      const totalRow = data.length + 2; // +2 because header is row 1 and data starts at row 2
      ws[`A${totalRow}`].s = { font: { bold: true } };
      ws[`K${totalRow}`].s = { font: { bold: true } };
      ws[`L${totalRow}`].s = { font: { bold: true } };

      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      const file = new Blob([excelBuffer], { type: "application/octet-stream" });
      saveAs(file, `transactions_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      setError("Failed to export Excel. Please try again.");
    }
  };

  // Export to CSV with totals
  const exportToCSV = async () => {
    try {
      const allTransactions = await fetchAllTransactions();
      const data = prepareExportData(allTransactions);

      // Calculate total amount
      const totalAmount = data.reduce((sum, item) => sum + item["Amount (₹)"], 0);

      // Add total row
      const dataWithTotal = [
        ...data,
        {
          "S.No": "TOTAL",
          "Date & Time": "",
          "Transaction ID": "",
          "Sender Name": "",
          "Sender Role": "",
          "Receiver Name": "",
          "Receiver Role": "",
          Type: "",
          Description: "",
          "Payment Method": "",
          "Amount (₹)": "",
          "Formatted Amount": `₹${totalAmount.toFixed(2)}`,
          Status: "",
        },
      ];

      const ws = XLSX.utils.json_to_sheet(dataWithTotal);
      const csv = XLSX.utils.sheet_to_csv(ws);
      const file = new Blob([csv], { type: "text/csv;charset=utf-8" });
      saveAs(file, `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`);
    } catch (error) {
      console.error("Error exporting to CSV:", error);
      setError("Failed to export CSV. Please try again.");
    }
  };

  // Export to PDF with totals and proper margins
  const exportToPDF = async () => {
    try {
      const allTransactions = await fetchAllTransactions();
      const data = prepareExportData(allTransactions);

      // Calculate total amount
      const totalAmount = data.reduce((sum, item) => sum + item["Amount (₹)"], 0);

      const doc = new jsPDF();

      // Title and metadata
      doc.setFontSize(16);
      doc.text("Transaction History Report", 15, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm")}`, 15, 22);
      doc.text(`Total Transactions: ${data.length}`, 15, 28);
      doc.text(`Total Amount: ₹${totalAmount.toFixed(2)}`, 15, 34);

      // Prepare table data
      const tableData = data.map((item) => [
        item["S.No"],
        item["Date & Time"],
        item["Transaction ID"],
        item["Sender Name"],
        item["Sender Role"],
        item["Receiver Name"],
        item["Receiver Role"],
        item.Type,
        item.Description,
        item["Payment Method"],
        item["Formatted Amount"],
        item.Status,
      ]);

      // Add total row
      const footerData = [
        ["", "", "", "", "", "", "", "", "", "TOTAL", `₹${totalAmount.toFixed(2)}`, ""],
      ];

      // Calculate total table width for debugging
      const columnWidths = [10, 20, 15, 18, 14, 18, 14, 14, 20, 14, 14, 15];
      const totalTableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
      console.log("Total Table Width:", totalTableWidth, "mm (Page Width: 180mm with 15mm margins)");

      autoTable(doc, {
        startY: 40,
        head: [
          [
            "S.No",
            "Date",
            "ID",
            "Sender Name",
            "Sender Role",
            "Receiver Name",
            "Receiver Role",
            "Type",
            "Description",
            "Payment Method",
            "Amount",
            "Status",
          ],
        ],
        body: tableData,
        foot: footerData,
        theme: "grid",
        margin: { left: 15, right: 15 }, // 15mm margins on both sides
        tableWidth: "wrap", // Center table within margins
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "ellipsize", // Truncate long text with ellipsis
        },
        headStyles: {
          fillColor: [0, 0, 77],
          textColor: 255,
          fontStyle: "bold",
        },
        footStyles: {
          fillColor: [220, 220, 220],
          textColor: 0,
          fontStyle: "bold",
        },
        columnStyles: {
          0: { cellWidth: 10 }, // S.No
          1: { cellWidth: 20 }, // Date
          2: { cellWidth: 15 }, // ID
          3: { cellWidth: 18 }, // Sender Name
          4: { cellWidth: 14 }, // Sender Role
          5: { cellWidth: 18 }, // Receiver Name
          6: { cellWidth: 14 }, // Receiver Role
          7: { cellWidth: 14 }, // Type
          8: { cellWidth: 20 }, // Description
          9: { cellWidth: 14 }, // Payment Method
          10: { cellWidth: 14 }, // Amount
          11: { cellWidth: 15 }, // Status
        },
        didParseCell: function (data) {
          // Truncate long text in Description column
          if (data.section === "body" && data.column.index === 8) {
            const text = data.cell.text.join("");
            if (text.length > 30) {
              data.cell.text = [text.substring(0, 27) + "..."];
            }
          }
          // Debug cell content
          if (data.section === "body") {
            console.log(`Row ${data.row.index}, Column ${data.column.index}:`, data.cell.text);
          }
        },
        didDrawPage: function (data) {
          // Add page numbers
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(10);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            15, // Align with left margin
            doc.internal.pageSize.height - 10
          );
        },
      });

      // Log final PDF content
      console.log("PDF Generated with", tableData.length, "rows on", doc.internal.getNumberOfPages(), "pages");

      doc.save(`transactions_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      setError("Failed to export PDF. Please try again.");
    }
  };

  // Handle export
  const handleExport = () => {
    switch (exportFormat) {
      case "xlsx":
        exportToExcel();
        break;
      case "csv":
        exportToCSV();
        break;
      case "pdf":
        exportToPDF();
        break;
      default:
        console.error("Invalid export format");
    }
    setIsExportModalOpen(false);
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-[#00004D]">Transaction History</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Transactions", value: stats.totalTransactions, icon: ClipboardList, color: "#4f46e5" },
          { label: "Total Revenue", value: stats.totalRevenue, icon: DollarSign, color: "#22c55e" },
          { label: "Avg. Transaction Value", value: stats.avgTransactionValue, icon: BarChart2, color: "#a855f7" },
          { label: "Refunds", value: stats.totalRefunds, icon: BadgeX, color: "#eab308" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card
              key={s.label}
              className="border-l-4 p-4"
              style={{ borderLeftColor: s.color }}
            >
              <CardContent className="p-0">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {s.label}
                    </CardTitle>
                    <div className="text-2xl font-bold mt-2">
                      {s.label.includes("Revenue") || s.label.includes("Value") || s.label === "Refunds"
                        ? `₹${s.value.toLocaleString()}`
                        : s.value.toLocaleString()}
                    </div>
                  </div>
                  <Icon
                    className="size-6 p-1 rounded-full"
                    style={{
                      color: s.color,
                      backgroundColor: `${s.color}20`,
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Transaction Overview</h2>
            <ToggleGroup type="single" value={chartView} onValueChange={setChartView}>
              {["hourly", "daily", "weekly"].map((val) => (
                <ToggleGroupItem key={val} value={val} className="capitalize">
                  {val}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          {chartData[chartView]?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData[chartView]}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Legend />
                <Bar
                  dataKey="transactions"
                  fill="#4f46e5"
                  name="Transactions"
                  radius={[10, 10, 0, 0]}
                  barSize={30}
                />
                <Bar
                  dataKey="refunds"
                  fill="#ef4444"
                  name="Refunds"
                  radius={[10, 10, 0, 0]}
                  barSize={30}
                />
                <Bar
                  dataKey="topups"
                  fill="#10b981"
                  name="Top-ups"
                  radius={[10, 10, 0, 0]}
                  barSize={30}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground h-[300px] flex items-center justify-center">
              No data available for {chartView} view
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mx-auto max-w-full">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold">All Transactions</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                className="bg-[#00004D] text-white flex items-center gap-2 text-sm px-3 py-2"
                onClick={() => setIsExportModalOpen(true)}
                aria-label="Export transactions"
              >
                <Download className="size-4" />
                Export
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="transactionType" className="mb-3">Transaction Type</Label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger id="transactionType" className="w-full">
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Credit">Credit</SelectItem>
                  <SelectItem value="Refund">Refund</SelectItem>
                  <SelectItem value="TopUp">TopUp</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="paymentMethod" className="mb-3">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="paymentMethod" className="w-full">
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Gpay">Gpay</SelectItem>
                  <SelectItem value="Mess bill">Mess bill</SelectItem>
                  <SelectItem value="Balance Deduction">Balance Deduction</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="userType" className="mb-3">User Type</Label>
              <Select value={userType} onValueChange={setUserType}>
                <SelectTrigger id="userType" className="w-full">
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role._id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="location" className="mb-3">Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger id="location" className="w-full">
                  <SelectValue placeholder="Select Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc._id} value={loc._id}>
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sort" className="mb-3">Sort</Label>
              <Select
                value={`${sortBy}-${sortOrder}`}
                onValueChange={(value) => {
                  const [newSortBy, newSortOrder] = value.split("-");
                  setSortBy(newSortBy);
                  setSortOrder(newSortOrder);
                }}
              >
                <SelectTrigger id="sort" className="w-full">
                  <SelectValue placeholder="Sort" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date-desc">Date (Newest First)</SelectItem>
                  <SelectItem value="date-asc">Date (Oldest First)</SelectItem>
                  <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
                  <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="search" className="mb-3">Search</Label>
              <Input
                id="search"
                className="w-full"
                placeholder="Search by name, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="from-date" className="text-sm mb-3">
                From Date
              </Label>
              <Popover open={openFrom} onOpenChange={setOpenFrom}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="from-date"
                    className="w-full justify-between font-normal"
                  >
                    {fromDate ? format(fromDate, "dd-MM-yyyy") : "Select date"}
                    <ChevronDownIcon className="ml-2 h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    captionLayout="vertical"
                    selected={fromDate}
                    onSelect={(date) => {
                      setFromDate(date);
                      setOpenFrom(false);
                      setQuickFilter("");
                    }}
                    fromYear={2000}
                    toYear={2030}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="to-date" className="text-sm mb-3">
                To Date
              </Label>
              <Popover open={openTo} onOpenChange={setOpenTo}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="to-date"
                    className="w-full justify-between font-normal"
                  >
                    {toDate ? format(toDate, "dd-MM-yyyy") : "Select date"}
                    <ChevronDownIcon className="ml-2 h-4 w-4 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    captionLayout="vertical"
                    selected={toDate}
                    onSelect={(date) => {
                      setToDate(date);
                      setOpenTo(false);
                      setQuickFilter("");
                    }}
                    fromYear={2000}
                    toYear={2030}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="font-bold">Quick Filter:</span>
            {["Today", "Yesterday", "Last 7 Days"].map((filter) => (
              <Button
                key={filter}
                variant={quickFilter === filter.toLowerCase() ? "default" : "outline"}
                size="sm"
                className={quickFilter === filter.toLowerCase() ? "bg-[#00004D] text-white" : ""}
                onClick={() => {
                  setQuickFilter(filter.toLowerCase());
                  setFromDate(undefined);
                  setToDate(undefined);
                }}
              >
                {filter}
              </Button>
            ))}
          </div>

          <div className="overflow-x-hidden">
            <div className="mx-auto max-w-full">
              <Table className="w-full table-auto text-sm">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[120px] whitespace-nowrap">Date & Time</TableHead>
                    <TableHead className="min-w-[100px] whitespace-nowrap">Transaction ID</TableHead>
                    <TableHead className="min-w-[150px] whitespace-nowrap">Sender Name</TableHead>
                    <TableHead className="min-w-[150px] whitespace-nowrap">Receiver Name</TableHead>
                    <TableHead className="min-w-[100px] whitespace-nowrap">Type</TableHead>
                    <TableHead className="min-w-[150px] whitespace-nowrap">Description</TableHead>
                    <TableHead className="min-w-[120px] whitespace-nowrap">Payment Method</TableHead>
                    <TableHead className="min-w-[100px] text-right whitespace-nowrap">Amount</TableHead>
                    <TableHead className="min-w-[80px] text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((txn) => (
                    <TableRow key={txn.id}>
                      <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
                        {txn.datetime}
                      </TableCell>
                      <TableCell className="font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                        {txn.id}
                      </TableCell>
                      <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
                        <div className="flex items-center gap-2">
                          <Avatar name={txn.sender.name} />
                          <div className="font-medium">{txn.sender.name}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">({txn.sender.role})</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
                        <div className="flex items-center gap-2">
                          <Avatar name={txn.receiver.name} />
                          <div className="font-medium">{txn.receiver.name}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">({txn.receiver.role})</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
                        {editingTransactionId === txn.id ? (
                          <Select
                            value={editFormData.transaction_type}
                            onValueChange={(value) =>
                              setEditFormData((prev) => ({ ...prev, transaction_type: value }))
                            }
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {["Transfer", "TopUp", "Refund", "Credit"].map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span
                            className={`capitalize rounded px-2 py-1 text-xs font-medium
                              ${txn.type === "Transfer"
                                ? "bg-blue-100 text-blue-700"
                                : txn.type === "TopUp"
                                ? "bg-purple-100 text-purple-700"
                                : txn.type === "Refund"
                                ? "bg-yellow-100 text-yellow-800"
                                : txn.type === "Credit"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                              }`}
                          >
                            {txn.type || "N/A"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">
                        {editingTransactionId === txn.id ? (
                          <Input
                            value={editFormData.remarks}
                            onChange={(e) =>
                              setEditFormData((prev) => ({ ...prev, remarks: e.target.value }))
                            }
                            placeholder="Enter remarks"
                          />
                        ) : (
                          txn.description
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap overflow-hidden text-ellipsis">
                        {editingTransactionId === txn.id ? (
                          <Select
                            value={editFormData.payment_method}
                            onValueChange={(value) =>
                              setEditFormData((prev) => ({ ...prev, payment_method: value }))
                            }
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              {["Cash", "Gpay", "Mess bill", "Balance Deduction"].map((method) => (
                                <SelectItem key={method} value={method}>
                                  {method}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span
                            className={`font-medium px-2 py-1 rounded-full
                              ${txn.paymentMethod === "Cash"
                                ? "bg-green-100 text-green-800"
                                : txn.paymentMethod === "Gpay"
                                ? "bg-blue-100 text-blue-800"
                                : txn.paymentMethod === "Mess bill"
                                ? "bg-yellow-100 text-yellow-800"
                                : txn.paymentMethod === "Balance Deduction"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                              }`}
                          >
                            {txn.paymentMethod}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-semibold whitespace-nowrap overflow-hidden text-ellipsis">
                        {editingTransactionId === txn.id ? (
                          <Input
                            type="number"
                            value={editFormData.amount}
                            onChange={(e) =>
                              setEditFormData((prev) => ({ ...prev, amount: e.target.value }))
                            }
                            placeholder="Enter amount"
                          />
                        ) : txn.amount < 0 ? (
                          <span className="text-red-500">- ₹{Math.abs(txn.amount)}</span>
                        ) : (
                          <span className="text-green-600">+ ₹{txn.amount}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                        {editingTransactionId === txn.id ? (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleSaveEdit(txn.id)}
                            aria-label="Save transaction"
                          >
                            <Save className="size-4 mr-2" />
                            Save
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(txn)}
                            aria-label="Edit transaction"
                          >
                            <Pencil className="size-4 mr-2" />
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
          <div className="pt-4 w-full">
            <div className="mx-auto max-w-[300px]">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(prev.page - 1, 1),
                        }))
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: pagination.totalPages || 1 }, (_, i) => i + 1).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={p === pagination.page}
                        onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.min(prev.page + 1, pagination.totalPages),
                        }))
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Transactions</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-sm font-medium">Select Export Format</Label>
            <RadioGroup value={exportFormat} onValueChange={setExportFormat} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="xlsx" id="xlsx" />
                <Label htmlFor="xlsx">Excel (xlsx)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv">CSV</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf">PDF</Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
