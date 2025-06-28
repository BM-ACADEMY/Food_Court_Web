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
import TreasurySubcomDetailsModal from "./TreasurySubcomDetailsModel";

export default function TreasurySubcomList() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [lastActive, setLastActive] = useState("all");
  const [sortBy, setSortBy] = useState("asc");
  const [regDate, setRegDate] = useState("");
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(undefined);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [data, setData] = useState({
    treasurySubcoms: [],
    totalTreasurySubcoms: 0,
    totalBalance: 0,
    onlineCount: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [selectedSubcom, setSelectedSubcom] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);


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

  // Fetch data from backend
  useEffect(() => {
    const fetchTreasurySubcoms = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/treasurySubcom/fetch-all-treasurysubcom-details`,
          {
            params: {
              search,
              status,
              lastActive,
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
        console.error("Error fetching treasury subcoms:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchTreasurySubcoms();
  }, [search, status, lastActive, regDate, sortBy, page, pageSize]);

  const { treasurySubcoms, totalTreasurySubcoms, totalBalance, onlineCount, totalPages } = data;

  // Memoized filtered data for rendering
  const paginatedTreasurySubcoms = useMemo(() => treasurySubcoms, [treasurySubcoms]);

  // Handle View and Edit
  const handleView = (subcom) => {
    setSelectedSubcom(subcom);
    setIsDetailsModalOpen(true);
  };

  const handleEdit = (subcom) => {
    setSelectedSubcom(subcom);
    setIsDetailsModalOpen(true);
  };

  // Export functions
  const exportToExcel = () => {
    const data = paginatedTreasurySubcoms.map((subcom) => ({
      "Treasury Subcom ID": subcom.id,
      Name: subcom.name,
      Phone: subcom.phone,
      Balance: `₹${subcom.balance.toLocaleString()}`,
      Status: subcom.status,
      "Last Active": subcom.lastActive,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "TreasurySubcoms");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(file, `treasury_subcoms_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const exportToCSV = () => {
    const data = paginatedTreasurySubcoms.map((subcom) => ({
      "Treasury Subcom ID": subcom.id,
      Name: subcom.name,
      Phone: subcom.phone,
      Balance: `₹${subcom.balance.toLocaleString()}`,
      Status: subcom.status,
      "Last Active": subcom.lastActive,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const file = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(file, `treasury_subcoms_${format(new Date(), "yyyy-MM-dd")}.csv`);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Treasury Subcom List", 14, 20);
      autoTable(doc, {
        startY: 30,
        head: [
          [
            "Treasury Subcom ID",
            "Name",
            "Phone",
            "Balance",
            "Status",
            "Last Active",
          ],
        ],
        body: paginatedTreasurySubcoms.map((subcom) => [
          subcom.id || "N/A",
          subcom.name || "Unknown",
          subcom.phone || "N/A",
          `₹${subcom.balance.toLocaleString()}` || "₹0",
          subcom.status || "N/A",
          subcom.lastActive || "N/A",
        ]),
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 0, 77], textColor: [255, 255, 255] },
        margin: { top: 30 },
      });
      doc.save(`treasury_subcoms_${format(new Date(), "yyyy-MM-dd")}.pdf`);
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
      <h2 className="text-3xl font-bold text-[#00004D]">Treasury Subcom Check</h2>

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
                <SelectItem value="all">All Treasury Subcoms</SelectItem>
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
                <CardTitle className="text-muted-foreground text-sm">Total Treasury Subcoms</CardTitle>
                <div className="text-2xl font-bold mt-1">{totalTreasurySubcoms}</div>
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

      {/* Treasury Subcom List */}
      {!loading && !error && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Treasury Subcom List</h2>
            <Button className="bg-[#00004D] text-white" onClick={() => setIsExportModalOpen(true)}>
              <Download className="mr-2 h-4 w-4" /> Export List
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Treasury Subcom ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedTreasurySubcoms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No treasury subcoms found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedTreasurySubcoms.map((subcom) => (
                    <TableRow key={subcom.id}>
                      <TableCell className="font-medium">#{subcom.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar name={subcom.sender_name} />
                          <div className="flex flex-col gap-1">
                            <span>{subcom.sender_name}</span>
                            <span className="text-[12px] text-gray-500">({subcom.sender_role_name})</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar name={subcom.receiver_name} />
                          <div className="flex flex-col gap-1">
                            <span>{subcom.receiver_name}</span>
                            <span className="text-[12px] text-gray-500">({subcom.receiver_role_name})</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>{subcom.phone}</TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${subcom.balance > 10000
                            ? "text-green-600"
                            : subcom.balance > 0
                              ? "text-yellow-600"
                              : "text-red-600"
                            }`}
                        >
                          ₹{subcom.balance.toLocaleString()}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="ghost"
                          className={`text-white ${subcom.status.toLowerCase() === "online"
                            ? "bg-green-500"
                            : "bg-red-500"
                            }`}
                        >
                          {subcom.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {subcom.lastActive && !isNaN(new Date(subcom.lastActive).getTime())
                          ? format(new Date(subcom.lastActive), "dd-MM-yyyy HH:mm")
                          : "N/A"}
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          variant="link"
                          className="text-blue-600 p-0 h-auto text-sm"
                          onClick={() => handleView(subcom)}
                        >
                          <Eye className="mr-1 h-4 w-4" /> View
                        </Button>
                        {/* <Button
                          variant="link"
                          className="text-green-600 p-0 h-auto text-sm"
                          onClick={() => handleEdit(subcom)}
                        >
                          <Pencil className="mr-1 h-4 w-4" /> Edit
                        </Button> */}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Treasury Subcom Details Modal */}
      <TreasurySubcomDetailsModal
        subcom={selectedSubcom}
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedSubcom(null);
        }}
      />

      {/* Export Modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Treasury Subcoms</DialogTitle>
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
            {Math.min(page * pageSize, totalTreasurySubcoms)} of{" "}
            {totalTreasurySubcoms} treasury subcoms
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