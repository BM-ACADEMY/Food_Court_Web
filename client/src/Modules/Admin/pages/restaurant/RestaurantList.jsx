
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { format } from "date-fns";
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
  Lock,
  Unlock,
} from "lucide-react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import RestaurantDetailsModal from "./RestaurantDetailsModel";

const getRandomColor = () => {
  const colors = ["#FF6B6B", "#4ECDC4", "#556270", "#C7F464", "#FFA500"];
  return colors[Math.floor(Math.random() * colors.length)];
};

const Avatar = ({ name = "" }) => {
  const initials = name
    ? name.split(" ").map((word) => word[0]?.toUpperCase()).slice(0, 2).join("")
    : "R";
  const color = getRandomColor();

  return (
    <div
      className="w-9 h-9 min-w-[2.25rem] rounded-full flex items-center justify-center text-white font-semibold text-sm"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
};

export default function RestaurantList() {
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
    restaurants: [],
    totalRestaurants: 0,
    totalSales: 0,
    onlineCount: 0,
    totalPages: 0,
  });
  const [allRestaurants, setAllRestaurants] = useState([]); // New state for all restaurants
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);

  // Fetch paginated restaurants for display
  useEffect(() => {
    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/restaurants/fetch-all-restaurant-details`,
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
        console.error("Error fetching restaurants:", err);
        setError("Failed to load data. Please try again.");
        toast.error("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchRestaurants();
  }, [search, status, lastActive, regDate, sortBy, page, pageSize]);

  // Fetch all restaurants for export when export modal is opened
  useEffect(() => {
    if (isExportModalOpen) {
      const fetchAllRestaurants = async () => {
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/restaurants/fetch-all-restaurant-details`,
            {
              params: {
                search,
                status,
                lastActive,
                regDate: regDate ? format(new Date(regDate), "yyyy-MM-dd") : "",
                sortBy,
                page: 1,
                pageSize: 1000, // Set a high pageSize to fetch all records
              },
            }
          );
          setAllRestaurants(response.data.restaurants);
        } catch (err) {
          console.error("Error fetching all restaurants for export:", err);
          toast.error("Failed to fetch all restaurants for export.");
        }
      };
      fetchAllRestaurants();
    }
  }, [isExportModalOpen, search, status, lastActive, regDate, sortBy]);

  const { restaurants, totalRestaurants, totalSales, onlineCount, totalPages } = data;

  // Memoized paginated data
  const paginatedRestaurants = useMemo(() => restaurants, [restaurants]);

  // Export to Excel
  const exportToExcel = () => {
    if (allRestaurants.length === 0) {
      toast.error("No data available to export. Please try again.");
      return;
    }
    const data = allRestaurants.map((restaurant) => ({
      "Restaurant ID": restaurant.id || "N/A",
      Name: restaurant.name || "Unknown",
      Role: restaurant.receiver_role_name || "Restaurant", // Changed to receiver_role_name
      Sales: `₹${restaurant.sales.toLocaleString()}` || "₹0", // Fixed INR formatting
      Status: restaurant.status || "N/A",
      "Last Active": restaurant.lastActive || "N/A",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Restaurants");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(file, `restaurants_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  // Export to CSV
  const exportToCSV = () => {
    if (allRestaurants.length === 0) {
      toast.error("No data available to export. Please try again.");
      return;
    }
    const data = allRestaurants.map((restaurant) => ({
      "Restaurant ID": restaurant.id || "N/A",
      Name: restaurant.name || "Unknown",
      Role: restaurant.receiver_role_name || "Restaurant", // Changed to receiver_role_name
      Sales: `₹${restaurant.sales.toLocaleString()}` || "₹0", // Fixed INR formatting
      Status: restaurant.status || "N/A",
      "Last Active": restaurant.lastActive || "N/A",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const file = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(file, `restaurants_${format(new Date(), "yyyy-MM-dd")}.csv`);
  };

  // Export to PDF
  const exportToPDF = () => {
    if (allRestaurants.length === 0) {
      toast.error("No data available to export. Please try again.");
      return;
    }
    try {
      const doc = new jsPDF();
      doc.text("Restaurant List", 14, 20);
      autoTable(doc, {
        startY: 30,
        head: [
          ["Restaurant ID", "Name", "Role", "Sales", "Status", "Last Active"], // Removed Category
        ],
        body: allRestaurants.map((restaurant) => [
          restaurant.id || "N/A",
          restaurant.name || "Unknown",
          restaurant.receiver_role_name || "Restaurant", // Changed to receiver_role_name
          `₹${restaurant.sales.toLocaleString()}` || "₹0", // Fixed INR formatting
          restaurant.status || "N/A",
          restaurant.lastActive || "N/A",
        ]),
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 0, 77], textColor: [255, 255, 255] },
        margin: { top: 30 },
      });
      doc.save(`restaurants_${format(new Date(), "yyyy-MM-dd")}.pdf`);
    } catch (error) {
      console.error("Error exporting to PDF:", error);
      setError("Failed to export PDF. Please try again.");
      toast.error("Failed to export PDF. Please try again.");
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

  const handleToggleRestrict = async (restaurant) => {
    try {
      const updated = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/users/update-user-flag/${restaurant.user_id}`,
        {
          is_flagged: !restaurant.is_flagged,
        }
      );
      if (updated.data) {
        toast.success(`User ${!restaurant.is_flagged ? "restricted" : "unrestricted"} successfully`, {
          transition: Bounce,
        });
        // Refresh list
        const response = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/restaurants/fetch-all-restaurant-details`,
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
      }
    } catch (err) {
      console.error("Failed to toggle restriction", err);
      toast.error("Failed to update restriction");
    }
  };

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-3xl font-bold text-[#00004D]">Restaurant Check</h2>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative flex-1">
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
          {/* Status */}
          <div className="flex flex-col gap-1">
            <Label className="text-sm px-1">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Restaurants</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="Offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Registration Date */}
          <div className="flex flex-col gap-1">
            <Label htmlFor="date" className="text-sm px-1">Registration Date</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  id="date"
                  className="w-full justify-between font-normal"
                >
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

          {/* Last Active */}
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

          {/* Sort By */}
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
                <SelectItem value="high-balance">Sales (High–Low)</SelectItem>
                <SelectItem value="low-balance">Sales (Low–High)</SelectItem>
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
                <CardTitle className="text-muted-foreground text-sm">
                  Total Restaurants
                </CardTitle>
                <div className="text-2xl font-bold mt-1">{totalRestaurants}</div>
              </div>
              <Users className="bg-green-100 text-green-500 rounded-full p-2 size-10" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-blue-400">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <CardTitle className="text-muted-foreground text-sm">
                  Online Now
                </CardTitle>
                <div className="text-2xl font-bold mt-1">{onlineCount}</div>
              </div>
              <Wifi className="bg-blue-100 text-blue-500 rounded-full p-2 size-10" />
            </CardContent>
          </Card>
          <Card className="border-l-4 border-purple-400">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <CardTitle className="text-muted-foreground text-sm">
                  Total Sales
                </CardTitle>
                <div className="text-2xl font-bold mt-1">
                  ₹{totalSales.toLocaleString()}
                </div>
              </div>
              <Wallet className="bg-purple-100 text-purple-500 rounded-full p-2 size-10" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Restaurant List */}
      {!loading && !error && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Restaurant List</h2>
            <Button
              className="bg-[#00004D] text-white"
              onClick={() => setIsExportModalOpen(true)}
            >
              <Download className="mr-2 h-4 w-4" /> Export List
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Restaurant ID</TableHead>
                  <TableHead>Sender Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Sales</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRestaurants.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      No restaurants found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRestaurants.map((restaurant) => (
                    <TableRow key={restaurant.id}>
                      <TableCell className="font-medium">#{restaurant.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar name={restaurant.receiver_name} />
                          <p>{restaurant.receiver_name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-orange-500">
                          {restaurant.receiver_role_name || "Restaurant"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-medium ${
                            restaurant.sales > 100000
                              ? "text-green-600"
                              : restaurant.sales > 50000
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          ₹{restaurant.sales.toLocaleString()}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="ghost"
                          className={`text-white ${
                            restaurant.status.toLowerCase() === "online"
                              ? "bg-green-500"
                              : "bg-red-500"
                          }`}
                        >
                          {restaurant.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{restaurant.lastActive}</TableCell>
                      <TableCell className="flex gap-2">
                        <Button
                          variant="link"
                          className="text-blue-600 p-0 h-auto text-sm"
                          onClick={() => {
                            setSelectedRestaurant(restaurant);
                            setIsModalOpen(true);
                          }}
                        >
                          <Eye className="mr-1 h-4 w-4" /> View
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="cursor-pointer"
                          onClick={() => handleToggleRestrict(restaurant)}
                          title={restaurant.is_flagged ? "Unrestrict User" : "Restrict User"}
                        >
                          {restaurant.is_flagged ? (
                            <Lock className="w-4 h-4 text-red-600" />
                          ) : (
                            <Unlock className="w-4 h-4 text-green-600" />
                          )}
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

      {/* Restaurant Details Modal */}
      <div className="w-full max-w-none">
        <RestaurantDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          restaurant={selectedRestaurant}
        />
      </div>

      {/* Export Modal */}
      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Restaurants</DialogTitle>
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
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-4">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, totalRestaurants)} of {totalRestaurants} restaurants
          </p>

          <Pagination>
            <PaginationContent>
              {/* Prev */}
              <PaginationItem>
                <PaginationPrevious
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page > 1) setPage((p) => p - 1);
                  }}
                  className={page === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>

              {/* Show only 3 page numbers, centered around current page */}
              {(() => {
                const pagesToShow = 3;
                const half = Math.floor(pagesToShow / 2);
                let start = Math.max(1, page - half);
                let end = start + pagesToShow - 1;

                if (end > totalPages) {
                  end = totalPages;
                  start = Math.max(1, end - pagesToShow + 1);
                }

                return Array.from({ length: end - start + 1 }).map((_, i) => {
                  const pageNum = start + i;
                  return (
                    <PaginationItem key={pageNum}>
                      <PaginationLink
                        href="#"
                        isActive={page === pageNum}
                        onClick={(e) => {
                          e.preventDefault();
                          setPage(pageNum);
                        }}
                      >
                        {pageNum}
                      </PaginationLink>
                    </PaginationItem>
                  );
                });
              })()}

              {/* Next */}
              <PaginationItem>
                <PaginationNext
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    if (page < totalPages) setPage((p) => p + 1);
                  }}
                  className={page === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>

      )}
    </div>
  );
}