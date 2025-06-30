import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { format, differenceInMinutes } from "date-fns";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  CalendarIcon,
  Users,
  Wifi,
  Wallet,
  ChevronDownIcon,
  Search,
  Download,
  Eye,
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import CustomerDetailsModal from "./CustomersDetailsModel";

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

export default function CustomerList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [lastActive, setLastActive] = useState("all");
  const [sort, setSort] = useState("name-asc");
  const [regDate, setRegDate] = useState("");
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(undefined);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [data, setData] = useState({
    customers: [],
    totalCustomers: 0,
    totalBalance: 0,
    onlineCount: 0,
    totalPages: 0,
  });
  const [allCustomers, setAllCustomers] = useState([]); // New state for all customers
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [registrationType, setRegistrationType] = useState("all");

  // Fetch paginated customers for display
  useEffect(() => {
    const fetchCustomers = async () => {
      setLoading(true);
      setError(null);
      try {
        const [sortBy, sortOrder] = sort.split("-");
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/customers/fetch-all-customer-details`,
          {
            params: {
              search,
              status,
              lastActive,
              regDate: regDate ? format(new Date(regDate), "yyyy-MM-dd") : "",
              registration_type: registrationType,
              sortBy: sortBy === "name" ? sortOrder : sort,
              page,
              pageSize,
            },
          }
        );
        setData(response.data);
      } catch (err) {
        console.error("Error fetching customers:", err);
        const errorMsg = err.response?.data?.error || "Failed to load data. Please try again.";
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, [search, status, registrationType, lastActive, sort, regDate, page, pageSize]);

  // Fetch all customers for export when export modal is opened
  useEffect(() => {
    if (isExportModalOpen) {
      const fetchAllCustomers = async () => {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/customers/fetch-all-customer-details`,
            {
              params: {
                search,
                status,
                lastActive,
                regDate: regDate ? format(new Date(regDate), "yyyy-MM-dd") : "",
                registration_type: registrationType,
                sortBy: sort.split("-")[0] === "name" ? sort.split("-")[1] : sort,
                page: 1,
                pageSize: 1000, // Set a high pageSize to fetch all records
              },
            }
          );
          setAllCustomers(response.data.customers);
        } catch (err) {
          console.error("Error fetching all customers for export:", err);
          toast.error("Failed to fetch all customers for export.");
        }
      };
      fetchAllCustomers();
    }
  }, [isExportModalOpen, search, status, lastActive, regDate, registrationType, sort]);

  const { customers, totalCustomers, totalBalance, onlineCount, totalPages } = data;

  // Memoized paginated data
  const paginatedCustomers = useMemo(() => customers, [customers]);

  // Export functions using allCustomers
  const exportToExcel = () => {
    const data = allCustomers.map((customer) => ({
      "Customer ID": customer.id,
      "Name (Role)": `${customer.name || "Unknown"} (${customer.role || "Unknown"})`,
      Phone: customer.phone,
      Balance: `₹${customer.balance.toLocaleString()}`,
      Status: customer.status,
      "Registration Type": customer.registration_type,
      "Last Active": customer.lastActive,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Customers");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(file, `customers_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const exportToCSV = () => {
    const data = allCustomers.map((customer) => ({
      "Customer ID": customer.id,
      "Name (Role)": `${customer.name || "Unknown"} (${customer.role || "Unknown"})`,
      Phone: customer.phone,
      Balance: `₹${customer.balance.toLocaleString()}`,
      Status: customer.status,
      "Registration Type": customer.registration_type,
      "Last Active": customer.lastActive,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const file = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(file, `customers_${format(new Date(), "yyyy-MM-dd")}.csv`);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Customer List", 14, 20);
      autoTable(doc, {
        startY: 30,
        head: [["Customer ID", "Name (Role)", "Phone", "Balance", "Status", "Registration Type", "Last Active"]],
        body: allCustomers.map((customer) => [
          customer.id || "N/A",
          `${customer.name || "Unknown"} (${customer.role || "Unknown"})`,
          customer.phone || "N/A",
          `₹${customer.balance.toLocaleString()}` || "₹0",
          customer.status || "N/A",
          customer.registration_type || "N/A",
          customer.lastActive || "N/A",
        ]),
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 0, 77], textColor: [255, 255, 255] },
        margin: { top: 30 },
      });
      doc.save(`customers_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      setError("Failed to export PDF. Please try again.");
      toast.error("Failed to export PDF. Please try again.");
    }
  };

  const handleExport = () => {
    if (allCustomers.length === 0) {
      toast.error("No data available to export. Please try again.");
      return;
    }
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

  const handleViewCustomer = (customer) => {
    setSelectedCustomer(customer);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-3xl font-bold text-[#00004D]">Customer Check</h2>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
            <Input
              placeholder="Search by name, ID, or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {/* Status */}
          <div className="flex flex-col gap-1">
            <Label className="text-sm px-1 mb-3">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="Offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Registration Date */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="date" className="text-sm px-1 mb-3">
              Registration Date
            </Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" id="date" className="w-full justify-between font-normal">
                  {date ? format(date, "dd-MM-yyyy") : "Select date"}
                  <ChevronDownIcon className="ml-2 h-4 w-4 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  captionLayout="dropdown"
                  selected={date}
                  onSelect={(selectedDate) => {
                    setDate(selectedDate);
                    setRegDate(selectedDate ? format(selectedDate, "yyyy-MM-dd") : "");
                    setOpen(false);
                  }}
                  fromYear={2000}
                  toYear={2030}
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <Label className="text-sm px-1 mb-3">Customer Registration Type</Label>
            <Select value={registrationType} onValueChange={setRegistrationType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Registration Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Last Active */}
          <div className="flex flex-col gap-1">
            <Label className="text-sm px-1 mb-3">Last Active</Label>
            <Select value={lastActive} onValueChange={setLastActive}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Last Active" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="flex flex-col gap-1">
            <Label className="text-sm px-1 mb-3">Sort</Label>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name-asc">Name (A-Z)</SelectItem>
                <SelectItem value="name-desc">Name (Z-A)</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="high-balance">Balance (High-Low)</SelectItem>
                <SelectItem value="low-balance">Balance (Low-High)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Loading and Error States */}
      {loading && <p className="text-center text-muted-foreground">Loading...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}

      {/* Cards */}
      {!loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-green-400">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <CardTitle className="text-muted-foreground text-sm">Total Customers</CardTitle>
                <div className="text-2xl font-bold mt-1">{totalCustomers}</div>
              </div>
              <Users className="bg-green-100 text-green-500 rounded-full p-2 size-10" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-blue-400">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <CardTitle className="text-muted-foreground text-sm">Online Now</CardTitle>
                <div className="text-2xl font-bold mt-1">{onlineCount}</div>
              </div>
              <Wifi className="bg-blue-100 text-blue-500 rounded-full p-2 size-10" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-purple-400">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <CardTitle className="text-muted-foreground text-sm">Total Balance</CardTitle>
                <div className="text-2xl font-bold mt-1">₹{totalBalance?.toLocaleString()}</div>
              </div>
              <Wallet className="bg-purple-100 text-purple-500 rounded-full p-2 size-10" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Customer List */}
      {!loading && !error && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Customer List</h2>
            <Button
              className="bg-[#00004D] text-white"
              onClick={() => setIsExportModalOpen(true)}
            >
              <Download className="mr-2 h-4 w-4" /> Export List
            </Button>
          </div>
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Customer ID</TableHead>
                  <TableHead className="whitespace-nowrap">Customer Name</TableHead>
                  <TableHead className="whitespace-nowrap">Phone</TableHead>
                  <TableHead className="whitespace-nowrap">Balance</TableHead>
                  <TableHead className="whitespace-nowrap">Status</TableHead>
                  <TableHead className="whitespace-nowrap">Registration Type</TableHead>
                  <TableHead className="whitespace-nowrap">Last Active</TableHead>
                  <TableHead className="whitespace-nowrap">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCustomers?.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium whitespace-nowrap">#{customer.id}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Avatar name={customer.name} />
                        <div className="flex flex-col gap-1">
                          <span className="font-medium">{customer.name || "Unknown"}</span>
                          <span
                            className={`text-sm ${
                              customer.role === "Customer"
                                ? "text-blue-500"
                                : customer.role === "Restaurant"
                                ? "text-orange-500"
                                : "text-gray-400"
                            }`}
                          >
                            {customer.role || "Unknown"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{customer.phone || "N/A"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span
                        className={`font-semibold ${
                          customer.balance > 0
                            ? "text-green-600"
                            : customer.balance < 0
                            ? "text-red-600"
                            : "text-gray-500"
                        }`}
                      >
                        ₹{customer.balance.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge
                        variant="ghost"
                        className={`text-white ${
                          customer.status.toLowerCase() === "online" ? "bg-green-500" : "bg-red-500"
                        }`}
                      >
                        {customer.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded text-white text-sm font-medium ${
                          customer.registration_type === "online"
                            ? "bg-pink-500"
                            : customer.registration_type === "offline"
                            ? "bg-blue-600"
                            : "bg-gray-400"
                        }`}
                      >
                        {customer.registration_type || "Unknown"}
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{customer.lastActive || "N/A"}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex gap-2">
                        <Button
                          variant="link"
                          className="text-blue-600 p-0 h-auto text-sm"
                          onClick={() => handleViewCustomer(customer)}
                        >
                          <Eye className="mr-1 h-4 w-4" /> View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
      <div className="w-full max-w-none">
        {selectedCustomer && (
          <CustomerDetailsModal
            customer={selectedCustomer}
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
          />
        )}
      </div>
      {/* Export Modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Customers</DialogTitle>
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

      {/* Pagination */}
      {!loading && !error && totalPages > 0 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCustomers)} of{" "}
            {totalCustomers} customers
          </p>
          <div className="float-end">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.max(1, p - 1));
                    }}
                  />
                </PaginationItem>
                {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={page === i + 1}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(i + 1);
                      }}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      setPage((p) => Math.min(totalPages, p + 1));
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </div>
      )}
    </div>
  );
}