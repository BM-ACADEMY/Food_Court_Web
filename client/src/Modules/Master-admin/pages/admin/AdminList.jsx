import { useState, useEffect } from "react";
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
  Unlock,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
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
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AdminDetailsModal from "./AdminDetailsModel"; // Import the modal

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


export default function AdminList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [lastActive, setLastActive] = useState("all");
  const [sortBy, setSortBy] = useState("asc");
  const [regDate, setRegDate] = useState("");
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(undefined);
  const [page, setPage] = useState(1);
  const [admins, setAdmins] = useState([]);
  const [totalAdmins, setTotalAdmins] = useState(0);
  const [totalBalance, setTotalBalance] = useState(0);
  const [onlineCount, setOnlineCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [pageSize] = useState(10);

  const handleView = (admin) => {
    setSelectedAdmin(admin);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (admin) => {
    setSelectedAdmin(admin);
    setIsDetailsModalOpen(true);
  };
  const handleTransactionEdit = (admin) => {

  };

  useEffect(() => {
    const fetchAdmins = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `${import.meta.env.VITE_BASE_URL
          }/admins/fetch-all-admins-details?search=${encodeURIComponent(
            search
          )}&status=${status}&lastActive=${lastActive}&regDate=${date ? format(date, "yyyy-MM-dd") : ""
          }&sortBy=${sortBy}&page=${page}&pageSize=${pageSize}`
        );
        if (!response.ok) throw new Error("Failed to fetch admins");
        const data = await response.json();
        setAdmins(data.admins);
        setTotalAdmins(data.totalAdmins);
        setTotalBalance(data.totalBalance);
        setOnlineCount(data.onlineCount);
        setTotalPages(data.totalPages);
        setError(null);
      } catch (error) {
        console.error("Error fetching admins:", error);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchAdmins();
  }, [search, status, lastActive, regDate, sortBy, page]);

  // Export functions
  const exportToExcel = () => {
    const data = admins.map((admin) => ({
      "Admin ID": admin.id,
      Name: admin.name,
      Phone: admin.phone,
      Balance: `₹${admin.balance.toLocaleString()}`,
      Status: admin.status,
      "Last Active": admin.lastActive,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Admins");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(file, `admins_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const exportToCSV = () => {
    const data = admins.map((admin) => ({
      "Admin ID": admin.id,
      Name: admin.name,
      Phone: admin.phone,
      Balance: `₹${admin.balance.toLocaleString()}`,
      Status: admin.status,
      "Last Active": admin.lastActive,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const file = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(file, `admins_${format(new Date(), "yyyy-MM-dd")}.csv`);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Admin List", 14, 20);
      autoTable(doc, {
        startY: 30,
        head: [["Admin ID", "Name", "Phone", "Balance", "Status", "Last Active"]],
        body: admins.map((admin) => [
          admin.id || "N/A",
          admin.name || "Unknown",
          admin.phone || "N/A",
          `₹${admin.balance.toLocaleString()}` || "₹0",
          admin.status || "N/A",
          admin.lastActive || "N/A",
        ]),
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 0, 77], textColor: [255, 255, 255] },
        margin: { top: 30 },
      });
      doc.save(`admins_${format(new Date(), "yyyy-MM-dd")}.pdf`);
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


  // const handleToggleRestrict = async (user) => {
  //   try {
  //     const id = user._id;
  //     const updated = await axios.put(`${import.meta.env.VITE_BASE_URL}/users/update-user-flag/${id}`, {
  //       is_flagged: !user.is_flagged,
  //     });

  //     if (updated.data.success) {
  //       toast.success(`User ${!user.is_flagged ? "restricted" : "unrestricted"} successfully`);
  //       fetchUsers(); // Refresh list
  //     }
  //   } catch (err) {
  //     console.error("Failed to toggle restriction", err);
  //     toast.error("Failed to update restriction");
  //   }
  // };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-[#00004D]">Admin User Check</h2>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex flex-1/3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
            <Input
              placeholder="Search by name, ID or phone number..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {/* <Button className="bg-[#00004D] text-white flex items-center gap-2 flex-1/5">
            <QrCode className="size-4" />
            Scan QR Code
          </Button> */}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1">
            <Label className="text-sm px-1">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Admins</SelectItem>
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
            <Label className="text-sm px-1">Sort By</Label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Name (A-Z)</SelectItem>
                <SelectItem value="desc">Name (Z-A)</SelectItem>
                <SelectItem value="recent">Most Recent</SelectItem>
                <SelectItem value="high-balance">Balance (High–Low)</SelectItem>
                <SelectItem value="low-balance">Balance (Low–High)</SelectItem>
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
                <CardTitle className="text-muted-foreground text-sm">Total Admins</CardTitle>
                <div className="text-2xl font-bold mt-1">{totalAdmins}</div>
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
                <div className="text-2xl font-bold mt-1">₹{totalBalance.toLocaleString()}</div>
              </div>
              <Wallet className="bg-purple-100 text-purple-500 rounded-full p-2 size-10" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Admin List */}
      {!loading && !error && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Admin List</h2>
            <Button
              className="bg-[#00004D] text-white"
              onClick={() => setIsExportModalOpen(true)}
            >
              <Download className="mr-2 h-4 w-4" /> Export List
            </Button>
          </div>
          <div className="w-full overflow-x-auto">
            <Table className="min-w-[1000px]"> {/* enforce min width */}
              <TableHeader>
                <TableRow>
                  <TableHead>Admin ID</TableHead>
                  <TableHead>Sender Name</TableHead>
                  <TableHead>Receiver Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Permission</TableHead>

                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {admins.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">
                      No admins found
                    </TableCell>
                  </TableRow>
                ) : (
                  admins.map((admin) => (
                    <TableRow key={admin.id}>
                      <TableCell className="font-medium">#{admin.id}</TableCell>

                      {/* Sender Name */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar name={admin.sender_name} />
                          <div className="flex flex-col">
                            <span className="font-medium">{admin.sender_name}</span>
                            <span className="text-xs text-gray-500">{admin.sender_role_name}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Receiver Name */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar name={admin.receiver_name} />
                          <div className="flex flex-col">
                            <span className="font-medium">{admin.receiver_name}</span>
                            <span className="text-xs text-gray-500">{admin.receiver_role_name}</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>{admin.phone}</TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${admin.balance > 10000
                            ? "text-green-600"
                            : admin.balance > 0
                              ? "text-yellow-600"
                              : "text-red-600"
                            }`}
                        >
                          ₹{admin.balance.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="ghost"
                          className={`text-white ${admin.status.toLowerCase() === "online"
                            ? "bg-green-500"
                            : "bg-red-500"
                            }`}
                        >
                          {admin.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{admin.lastActive}</TableCell>
                      {/* <TableCell className="text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="cursor-pointer"
                          onClick={() => handleToggleRestrict(admin)}
                          title={admin.is_flagged ? "Unrestrict User" : "Restrict User"}
                        >
                          {admin.is_flagged ? (
                            <Lock className="w-4 h-4 text-red-600" />
                          ) : (
                            <Unlock className="w-4 h-4 text-green-600" />
                          )}
                        </Button>
                      </TableCell> */}
                      <TableCell className="flex gap-2">
                        <Button
                          variant="link"
                          className="text-blue-600 p-0 h-auto text-sm"
                          onClick={() => handleView(admin)}
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

      {/* Admin Details Modal */}
      <AdminDetailsModal
        admin={selectedAdmin}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedAdmin(null);
        }}
      />

      {/* Export Modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Admins</DialogTitle>
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
            {Math.min(page * pageSize, totalAdmins)} of {totalAdmins} admins
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