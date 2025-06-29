import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Download,
  Users,
  CreditCard,
  ClipboardList,
  Utensils,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar as DatePicker } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_BASE_URL = import.meta.env.VITE_BASE_URL || "http://localhost:3000/api";
const getRandomColor = () => {
  const colors = ["#FF6B6B", "#4ECDC4", "#556270", "#C7F464", "#FFA500"];
  return colors[Math.floor(Math.random() * colors.length)];
};

const Avatar = ({ name = "" }) => {
  const initials =
    name?.split(" ")[0]?.[0]?.toUpperCase() +
    (name?.split(" ")[1]?.[0]?.toUpperCase() || "");
  const color = getRandomColor();

  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
};
export default function Dashboard() {
  const [stats, setStats] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [exportData, setExportData] = useState([]);
  const [transactionType, setTransactionType] = useState("all");
  const [userType, setUserType] = useState("all");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("xlsx");
  const itemsPerPage = 20; // Last 20 transactions
  const [paymentMethod, setPaymentMethod] = useState("all");

  const totalPages = Math.ceil(totalRecords / itemsPerPage);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    // Reset filters to default
    setTransactionType("all");
    setUserType("all");
    setFromDate(null);
    setToDate(null);
    setCurrentPage(1);

    try {
      // Fetch dashboard stats
      const statsResponse = await axios.get(`${API_BASE_URL}/dashboards/dashboard/stats`);
      setStats([
        {
          title: "Customers Logged In",
          value: statsResponse.data.loginsToday,
          diff: statsResponse.data.loginDiff,
          icon: <Users className="text-blue-600 size-6" />,
          color: "border-l-4 border-blue-600",
        },
        {
          title: "Registrations Today",
          value: statsResponse.data.registrationsToday,
          diff: statsResponse.data.registrationDiff,
          icon: <CreditCard className="text-purple-600 size-6" />,
          color: "border-l-4 border-purple-600",
        },
        {
          title: "Transactions Today",
          value: statsResponse.data.transactionsToday,
          diff: statsResponse.data.transactionDiff,
          icon: <ClipboardList className="text-green-600 size-6" />,
          color: "border-l-4 border-green-600",
        },
        {
          title: "Restaurants Active",
          value: statsResponse.data.activeRestaurants,
          diff: statsResponse.data.activeRestaurantsDiff,
          icon: <Utensils className="text-yellow-600 size-6" />,
          color: "border-l-4 border-yellow-600",
        },
      ]);

      // Fetch last 20 transactions
      const transactionsResponse = await axios.get(`${API_BASE_URL}/dashboards/transactions`, {
        params: {
          page: 1,
          limit: itemsPerPage,
        },
      });
      setTransactions(transactionsResponse.data.transactions || []);
      setTotalRecords(transactionsResponse.data.total || 0);

      // Fetch roles
      const rolesResponse = await axios.get(`${API_BASE_URL}/dashboards/roles/fetch-all-roles`);
      setRoles(rolesResponse.data.roles || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFilteredTransactions = async () => {
    setIsLoading(true);
    try {
      const transactionsResponse = await axios.get(`${API_BASE_URL}/dashboards/transactions`, {
        params: {
          transactionType: transactionType === "all" ? undefined : transactionType,
          userType: userType === "all" ? undefined : userType,
           paymentMethod: paymentMethod === "all" ? undefined : paymentMethod,
          fromDate: fromDate ? format(fromDate, "yyyy-MM-dd") : undefined,
          toDate: toDate ? format(toDate, "yyyy-MM-dd") : undefined,
          page: currentPage,
          limit: itemsPerPage,
        },
      });
      setTransactions(transactionsResponse.data.transactions || []);
      setTotalRecords(transactionsResponse.data.total || 0);
    } catch (error) {
      console.error("Error fetching filtered transactions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchExportData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboards/transactions`, {
        params: {
          transactionType: transactionType === "all" ? undefined : transactionType,
          userType: userType === "all" ? undefined : userType,
          fromDate: fromDate ? format(fromDate, "yyyy-MM-dd") : undefined,
          toDate: toDate ? format(toDate, "yyyy-MM-dd") : undefined,
          limit: 10000, // Large limit for exports
          page: 1
        }
      });
      return response.data.transactions || [];
    } catch (error) {
      console.error("Error fetching export data:", error);
      throw error;
    }
  };


  useEffect(() => {
    fetchFilteredTransactions();
  }, [transactionType, userType, fromDate, toDate, currentPage]);

  useEffect(() => {
    // Initial fetch for roles and stats
    const initialFetch = async () => {
      try {
        const statsResponse = await axios.get(`${API_BASE_URL}/dashboards/dashboard/stats`);
        setStats([
          {
            title: "Customers Logged In",
            value: statsResponse.data.loginsToday,
            diff: statsResponse.data.loginDiff,
            icon: <Users className="text-blue-600 size-6" />,
            color: "border-l-4 border-blue-600",
          },
          {
            title: "Registrations Today",
            value: statsResponse.data.registrationsToday,
            diff: statsResponse.data.registrationDiff,
            icon: <CreditCard className="text-purple-600 size-6" />,
            color: "border-l-4 border-purple-600",
          },
          {
            title: "Transactions Today",
            value: statsResponse.data.transactionsToday,
            diff: statsResponse.data.transactionDiff,
            icon: <ClipboardList className="text-green-600 size-6" />,
            color: "border-l-4 border-green-600",
          },
          {
            title: "Restaurants Active",
            value: statsResponse.data.activeRestaurants,
            diff: statsResponse.data.activeRestaurantsDiff,
            icon: <Utensils className="text-yellow-600 size-6" />,
            color: "border-l-4 border-yellow-600",
          },
        ]);

        const rolesResponse = await axios.get(`${API_BASE_URL}/roles/fetch-all-roles`);
        setRoles(rolesResponse.data.data || []);
      } catch (error) {
        console.error("Error fetching initial data:", error);
      }
    };
    initialFetch();
  }, []);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

const exportToExcel = (data) => {
  // Add serial numbers and format data
  const formattedData = data.map((item, index) => ({
    "S.No": index + 1,
    "Transaction ID": item.id || "N/A",
    "Time": item.time || "N/A",
    "Type": item.type || "N/A",
    "From": item.from || "Unknown",
    "To": item.to || "Unknown",
    "Amount": item.amount ? parseFloat(item.amount.replace(/[^0-9.-]+/g,"")) : 0,
    "Status": item.status || "N/A",
  }));

  // Calculate total amount
  const totalAmount = formattedData.reduce((sum, item) => sum + item.Amount, 0);

  // Add total row
  formattedData.push({
    "S.No": "TOTAL",
    "Transaction ID": "",
    "Time": "",
    "Type": "",
    "From": "",
    "To": "",
    "Amount": totalAmount,
    "Status": "",
  });

  const ws = XLSX.utils.json_to_sheet(formattedData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Transactions");

  // Style the total row
  const totalRow = data.length + 2; // +2 because header is row 1 and data starts at row 2
  ws[`A${totalRow}`].s = { font: { bold: true } };
  ws[`G${totalRow}`].s = { font: { bold: true } };

  XLSX.writeFile(wb, `transactions_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
};

const exportToCSV = (data) => {
  // Add serial numbers and format data
  const formattedData = data.map((item, index) => ({
    "S.No": index + 1,
    "Transaction ID": item.id || "N/A",
    "Time": item.time || "N/A",
    "Type": item.type || "N/A",
    "From": item.from || "Unknown",
    "To": item.to || "Unknown",
    "Amount": item.amount || "₹0",
    "Status": item.status || "N/A",
  }));

  // Calculate total amount
  const totalAmount = formattedData.reduce((sum, item) => {
    const amount = parseFloat(item.Amount.replace(/[^0-9.-]+/g,"")) || 0;
    return sum + amount;
  }, 0);

  // Add total row
  formattedData.push({
    "S.No": "TOTAL",
    "Transaction ID": "",
    "Time": "",
    "Type": "",
    "From": "",
    "To": "",
    "Amount": `₹${totalAmount.toFixed(2)}`,
    "Status": "",
  });

  const ws = XLSX.utils.json_to_sheet(formattedData);
  const csv = XLSX.utils.sheet_to_csv(ws);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  saveAs(blob, `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`);
};

const exportToPDF = (data) => {
  const doc = new jsPDF();
  
  // Title and date
  doc.setFontSize(16);
  doc.text("Transaction Report", 14, 15);
  doc.setFontSize(10);
  doc.text(`Generated on: ${format(new Date(), "yyyy-MM-dd HH:mm")}`, 14, 22);

  // Prepare data with serial numbers
  const tableData = data.map((item, index) => [
    index + 1, // Serial number
    item.id || "N/A",
    item.time || "N/A",
    item.type || "N/A",
    item.from || "Unknown",
    item.to || "Unknown",
    item.amount || "₹0",
    item.status || "N/A",
  ]);

  // Calculate total amount
  const totalAmount = data.reduce((sum, item) => {
    const amount = parseFloat(item.amount?.replace(/[^0-9.-]+/g,"") || 0);
    return sum + amount;
  }, 0);

  autoTable(doc, {
    startY: 30,
    head: [["S.No", "ID", "Time", "Type", "From", "To", "Amount", "Status"]],
    body: tableData,
    foot: [["", "", "", "", "", "TOTAL", `₹${totalAmount.toFixed(2)}`, ""]],
    theme: "grid",
    styles: { fontSize: 8 },
    headStyles: { 
      fillColor: [0, 0, 77],
      textColor: 255,
      fontStyle: 'bold'
    },
    footStyles: {
      fillColor: [220, 220, 220],
      textColor: 0,
      fontStyle: 'bold'
    },
    didDrawPage: function(data) {
      // Page numbers
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
    }
  });

  doc.save(`transactions_${format(new Date(), "yyyy-MM-dd")}.pdf`);
};

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const data = await fetchExportData();

      if (!data || data.length === 0) {
        alert("No data available to export");
        return;
      }

      switch (exportFormat) {
        case "xlsx":
          exportToExcel(data);
          break;
        case "csv":
          exportToCSV(data);
          break;
        case "pdf":
          exportToPDF(data);
          break;
        default:
          console.error("Invalid export format");
      }
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setIsLoading(false);
      setIsExportModalOpen(false);
    }
  };

  return (
    <div className="p-6 space-y-6 font-sans">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-[#00004D]">Dashboard Overview</h1>
        <Button
          onClick={fetchDashboardData}
          disabled={isLoading}
          className="bg-[#00004D] cursor-pointer"
        >
          <RefreshCw className="mr-2 size-4" /> {isLoading ? "Refreshing..." : "Refresh"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className={`rounded-lg shadow-sm ${stat.color}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className="bg-muted p-2 rounded-full">{stat.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-sm text-green-600">+{stat.diff} from yesterday</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-lg shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Live Transactions</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-sm">● Live Updates</span>
            <Button
              size="sm"
              className="bg-[#00004D] cursor-pointer"
              onClick={() => setIsExportModalOpen(true)}
            >
              <Download className="mr-2 size-4" /> Export Data
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1">
              <Label className="text-sm px-1">Transaction Type</Label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="TopUp">Top Up</SelectItem>
                  <SelectItem value="Transfer">Transfer</SelectItem>
                  <SelectItem value="Refund">Refund</SelectItem>
                  <SelectItem value="Credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-sm px-1">User Type</Label>
              <Select value={userType} onValueChange={setUserType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role._id} value={role._id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-sm px-1">From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fromDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "dd-MM-yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <DatePicker
                    mode="single"
                    selected={fromDate}
                    onSelect={(date) => setFromDate(date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex flex-col gap-1">
              <Label className="text-sm px-1">To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !toDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "dd-MM-yyyy") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <DatePicker
                    mode="single"
                    selected={toDate}
                    onSelect={(date) => setToDate(date || null)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2 w-full sm:w-64">
              <label className="text-sm font-medium text-gray-700">Payment Method</label>
              <Select
                value={paymentMethod}
                onValueChange={(value) => setPaymentMethod(value)}
              >
                <SelectTrigger className="w-full h-10 text-sm">
                  <SelectValue placeholder="Select Payment Method" />
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

          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>To</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.time || "N/A"}</TableCell>
                    <TableCell>#{tx.id || "N/A"}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium
      ${tx.type === "Transfer"
                            ? "bg-blue-100 text-blue-700"
                            : tx.type === "TopUp"
                              ? "bg-purple-100 text-purple-700"
                              : tx.type === "Refund"
                                ? "bg-yellow-100 text-yellow-800"
                                : tx.type === "Credit"
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-600"
                          }
    `}
                      >
                        {tx.type || "N/A"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar name={tx.from} />
                        <div className="flex flex-col gap-1">
                          <span>{tx.from || "Unknown"}</span>
                          <span className="text-gray-600 text-[12px]">({tx.fromRoleName || "Unknown"})</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar name={tx.to} />
                        <div className="flex flex-col gap-1">
                          <span>{tx.to || "Unknown"}</span>
                          <span className="text-gray-600 text-[12px]">({tx.toRoleName || "Unknown"})</span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <span
                        className={`font-semibold ${tx.type === "Credit"
                          ? "text-green-600"
                          : tx.type === "TopUp"
                            ? "text-purple-600"
                            : tx.type === "Refund"
                              ? "text-yellow-600"
                              : tx.type === "Transfer"
                                ? "text-blue-600"
                                : "text-gray-600"
                          }`}
                      >
                        {tx.amount || "₹0"}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium
      ${tx.status === "Success"
                            ? "bg-green-100 text-green-700"
                            : tx.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : tx.status === "Failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-600"
                          }
    `}
                      >
                        {tx.status || "N/A"}
                      </span>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-2 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1}–
                {Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} records
              </p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage - 1);
                      }}
                    />
                  </PaginationItem>
                  {(() => {
                    const pagesPerBlock = 5;
                    const currentBlock = Math.floor((currentPage - 1) / pagesPerBlock);
                    const start = currentBlock * pagesPerBlock + 1;
                    const end = Math.min(start + pagesPerBlock - 1, totalPages);

                    return Array.from({ length: end - start + 1 }).map((_, i) => {
                      const pageNum = start + i;
                      return (
                        <PaginationItem key={pageNum}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === pageNum}
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(pageNum);
                            }}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    });
                  })()}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage + 1);
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-md border p-4">
          <h2 className="font-semibold mb-2">Export All Data</h2>
          <p className="text-sm mb-4 text-muted-foreground">
            Export complete transaction data for all users and categories
          </p>
          <Button
            className="w-full bg-[#00004D] cursor-pointer"
            onClick={() => {
              setIsExportModalOpen(true);
              setExportFormat("xlsx");
            }}
          >
            <CalendarIcon className="w-4 h-4 mr-2" /> Export All
          </Button>
        </div>
        <div className="rounded-md border p-4">
          <h2 className="font-semibold mb-2">Export by User Type</h2>
          <Select onValueChange={setUserType} value={userType}>
            <SelectTrigger className="w-full mb-4">
              <SelectValue placeholder="Select User Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role._id} value={role._id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="w-full bg-[#00004D] cursor-pointer"
            onClick={() => {
              setIsExportModalOpen(true);
              setExportFormat("xlsx");
            }}
          >
            <CalendarIcon className="w-4 h-4 mr-2" /> Export Selected
          </Button>
        </div>
        <div className="rounded-md border p-4">
          <h2 className="font-semibold mb-2">Export by Date Range</h2>
          <div className="flex gap-2 mb-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left",
                    !startDate && "text-muted-foreground cursor-pointer"
                  )}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {startDate ? format(startDate, "dd-MM-yyyy") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DatePicker
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => setStartDate(date || null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left",
                    !endDate && "text-muted-foreground cursor-pointer"
                  )}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {endDate ? format(endDate, "dd-MM-yyyy") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DatePicker
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => setEndDate(date || null)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <Button
            className="w-full bg-[#00004D] cursor-pointer"
            onClick={() => {
              setIsExportModalOpen(true);
              setExportFormat("xlsx");
            }}
          >
            <CalendarIcon className="w-4 h-4 mr-2" /> Export Range
          </Button>
        </div>
      </div>

      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Transactions</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label className="text-sm font-medium">Select Export Format</Label>
            <RadioGroup
              value={exportFormat}
              onValueChange={setExportFormat}
              className="mt-2"
            >
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
            <Button onClick={handleExport} disabled={isLoading}>
              {isLoading ? "Exporting..." : "Export"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}