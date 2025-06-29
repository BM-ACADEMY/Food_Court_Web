import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarIcon,
  QrCode,
  Users,
  Wifi,
  Wallet,
  ChevronDownIcon,
  Search,
  Download,
  Eye,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import SessionDetailsModal from "./TreasurySubcomDetailsModel";

export default function TreasurySubcomList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [lastActive, setLastActive] = useState("all");
  const [paymentMethod, setPaymentMethod] = useState("all");
  const [sortBy, setSortBy] = useState("asc");
  const [regDate, setRegDate] = useState("");
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(undefined);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [data, setData] = useState({
    loginSessions: [],
    totalLoginSessions: 0,
    totalBalance: 0,
    onlineCount: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [selectedSession, setSelectedSession] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Fetch data from backend
  useEffect(() => {
    const fetchLoginSessions = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/treasurySubcom/fetch-all-treasurysubcom-details`,
          {
            params: {
              search,
              status,
              lastActive,
              payment_method: paymentMethod !== "all" ? paymentMethod : undefined,
              regDate: regDate ? format(new Date(regDate), "yyyy-MM-dd") : "",
              sortBy,
              page,
              pageSize,
            },
          }
        );
        setData(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching login sessions:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchLoginSessions();
  }, [search, status, lastActive, paymentMethod, regDate, sortBy, page, pageSize]);

  const { loginSessions, totalLoginSessions, totalBalance, onlineCount, totalPages } = data;

  // Memoized filtered data
  const paginatedLoginSessions = useMemo(() => loginSessions, [loginSessions]);

  // Handle View
  const handleView = (session) => {
    setSelectedSession(session);
    setIsDetailsModalOpen(true);
  };

  // Export functions
  const exportToExcel = () => {
    const data = paginatedLoginSessions.map((session) => ({
      "Session ID": session.session_id,
      "Treasury Name": session.treasury_name,
      "Login Time": session.login_time,
      "Logout Time": session.logout_time,
      Duration: session.duration,
      Location: session.location,
      UPI: session.upi,
      "Gpay Amount": `₹${session.gpay_amount}`,
      "Cash Amount": `₹${session.cash_amount}`,
      "Mess Bill Amount": `₹${session.mess_bill_amount}`,
      Status: session.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "LoginSessions");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(file, `login_sessions_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const exportToCSV = () => {
    const data = paginatedLoginSessions.map((session) => ({
      "Session ID": session.session_id,
      "Treasury Name": session.treasury_name,
      "Login Time": session.login_time,
      "Logout Time": session.logout_time,
      Duration: session.duration,
      Location: session.location,
      UPI: session.upi,
      "Gpay Amount": `₹${session.gpay_amount}`,
      "Cash Amount": `₹${session.cash_amount}`,
      "Mess Bill Amount": `₹${session.mess_bill_amount}`,
      Status: session.status,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const file = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(file, `login_sessions_${format(new Date(), "yyyy-MM-dd")}.csv`);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Login Sessions List", 14, 20);
      autoTable(doc, {
        startY: 30,
        head: [
          [
            "Session ID",
            "Treasury Name",
            "Login Time",
            "Logout Time",
            "Duration",
            "Location",
            "UPI",
            "Gpay Amount",
            "Cash Amount",
            "Mess Bill Amount",
            "Status",
          ],
        ],
        body: paginatedLoginSessions.map((session) => [
          session.session_id,
          session.treasury_name,
          session.login_time,
          session.logout_time,
          session.duration,
          session.location,
          session.upi,
          `₹${session.gpay_amount}`,
          `₹${session.cash_amount}`,
          `₹${session.mess_bill_amount}`,
          session.status,
        ]),
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 0, 77], textColor: [255, 255, 255] },
        margin: { top: 30 },
      });
      doc.save(`login_sessions_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      setError("Failed to export PDF. Please try again.");
    }
  };

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

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-[#00004D]">Treasury Subcom Sessions</h2>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex flex-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
            <Input
              placeholder="Search by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-sm px-1">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sessions</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="Offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <Label htmlFor="date" className="text-sm px-1">Registration Date</Label>
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
          <div className="flex flex-col gap-1">
            <Label className="text-sm px-1">Last Active</Label>
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
          <div className="flex flex-col gap-1">
            <Label className="text-sm px-1">Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Filter by payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Methods</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Gpay">Gpay</SelectItem>
                <SelectItem value="Mess bill">Mess bill</SelectItem>
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
                <CardTitle className="text-muted-foreground text-sm">Total Sessions</CardTitle>
                <div className="text-2xl font-bold mt-1">{totalLoginSessions}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-blue-400">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <CardTitle className="text-muted-foreground text-sm">Online Now</CardTitle>
                <div className="text-2xl font-bold mt-1">{onlineCount}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-purple-400">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <CardTitle className="text-muted-foreground text-sm">Total Transaction Amount</CardTitle>
                <div className="text-2xl font-bold mt-1">₹{totalBalance.toLocaleString()}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Session List */}
      {!loading && !error && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Session List</h2>
            <Button className="bg-[#00004D] text-white" onClick={() => setIsExportModalOpen(true)}>
              <Download className="mr-2 h-4 w-4" /> Export List
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Session ID</TableHead>
                  <TableHead>Treasury Name</TableHead>
                  <TableHead>Login Time</TableHead>
                  <TableHead>Logout Time</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>UPI</TableHead>
                  <TableHead>Gpay Amount</TableHead>
                  <TableHead>Cash Amount</TableHead>
                  <TableHead>Mess Bill Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLoginSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center">
                      No sessions found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLoginSessions.map((session) => (
                    <TableRow key={session?.session_id}>
                      <TableCell className="font-medium">#{session?.session_id}</TableCell>
                      <TableCell>{session?.treasury_name}</TableCell>
                      <TableCell>{session?.login_time}</TableCell>
                      <TableCell>{session?.logout_time}</TableCell>
                      <TableCell>{session?.duration}</TableCell>
                      <TableCell>{session?.location}</TableCell>
                      <TableCell>{session?.upi}</TableCell>
                      <TableCell>₹{session?.gpay_amount}</TableCell>
                      <TableCell>₹{session?.cash_amount}</TableCell>
                      <TableCell>₹{session?.mess_bill_amount}</TableCell>
                      <TableCell>
                        <Badge
                          variant="ghost"
                          className={`text-white ${session.status.toLowerCase() === "online" ? "bg-green-500" : "bg-red-500"}`}
                        >
                          {session.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="link"
                          className="text-blue-600 p-0 h-auto text-sm"
                          onClick={() => handleView(session)}
                        >
                          <Eye className="mr-1 h-4 w-4" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      <SessionDetailsModal
        session={selectedSession}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedSession(null);
        }}
      />

      {/* Export Modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Session List</DialogTitle>
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
            <Button
              variant="outline"
              onClick={() => setIsExportModalOpen(false)}
            >
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
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, totalLoginSessions)} of{" "}
            {totalLoginSessions} sessions
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