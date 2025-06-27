
"use client"
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import {
  CalendarDays,
  Search,
  Download,
  FileText,
  FileSpreadsheet,
  FileSignature,
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import { format, startOfDay, endOfDay } from "date-fns";
import { debounce } from "lodash";
import { useAuth } from "@/context/AuthContext";

const RestaurantHistory = () => {
  const { user, loading } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState("all");
  const [date, setDate] = useState(new Date());
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [transactionType, setTransactionType] = useState("Transfer");
  const [sortConfig, setSortConfig] = useState({ key: "customer", direction: "a-z" });
  const [searchQuery, setSearchQuery] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [exportFormat, setExportFormat] = useState("csv");
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;
  const searchInputRef = useRef(null);

  const transactionTypes = ["Transfer", "Refund"];
  const [sortValue, setSortValue] = useState("");




  // Update sortConfig when sortValue changes
useEffect(() => {
  if (sortValue) {
    const [key, direction] = sortValue.split("-");
    setSortConfig({ key, direction });
  }
}, [sortValue]);

  // Fetch restaurant names
  useEffect(() => {
    const fetchRestaurants = async () => {
      if (!user || loading) return;

      setIsLoading(true);
      setError(null);
      try {
        const restaurantRes = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/restaurants/fetch-all-restaurant`,
          { withCredentials: true }
        );
        setRestaurants(restaurantRes.data.data || []);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch restaurants");
        console.error("Fetch restaurants error:", err.response?.data || err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRestaurants();
  }, [loading, user]);

  // Debounced fetch transactions
  const fetchTransactions = useCallback(
    debounce(async (params) => {
      try {
        setIsLoading(true);
        setError(null);
        const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/transactions/fetch-treasury-subcom-restaurant-history`, {
          params,
          withCredentials: true,
        });

        const formattedTransactions = (res.data.transactions || []).map((tx) => ({
          id: tx.id || "N/A",
          customer: tx.customer || "Unknown",
          customer_id: tx.customer_id || "N/A",
          amount: tx.amount || 0,
          dateTime: tx.datetime ? format(new Date(tx.datetime), "PPP HH:mm") : "N/A",
          dateTimeRaw: tx.datetime ? new Date(tx.datetime) : new Date(), // Store raw date for sorting
          type: tx.type || "Unknown",
          status: tx.status || "Completed",
        }));

        setTransactions(formattedTransactions);
        setTotalPages(res.data.pagination?.totalPages || 1);
        setTotalItems(res.data.pagination?.totalTransactions || formattedTransactions.length);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to fetch transactions");
        console.error("Fetch transactions error:", err.response?.data || err.message);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    []
  );

  // Fetch transactions based on filters
  useEffect(() => {
    if (!loading && user) {
      const queryParams = {
        transactionType,
        fromDate: format(startOfDay(date), "yyyy-MM-dd"),
        toDate: format(endOfDay(date), "yyyy-MM-dd"),
        search: searchQuery,
        page,
        limit,
      };
      if (selectedRestaurant !== "all") {
        const selected = restaurants.find((r) => r.restaurant_name === selectedRestaurant);
        if (selected) queryParams.restaurantId = selected.user_id;
      }
      fetchTransactions(queryParams);
    }
  }, [loading, user, selectedRestaurant, date, transactionType, searchQuery, page, fetchTransactions, restaurants]);

  // Handle search input
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  }, []);

  // Memoized sorted transactions
  const sortedTransactions = useMemo(() => {
    const sorted = [...transactions].sort((a, b) => {
      const directionMultiplier = sortConfig.direction === "asc" ? 1 : -1;
      switch (sortConfig.key) {
        case "customer":
          const customerA = a.customer || "";
          const customerB = b.customer || "";
          return directionMultiplier * customerA.localeCompare(customerB);
        case "amount":
          return directionMultiplier * (a.amount - b.amount);
        case "dateTime":
          return directionMultiplier * (a.dateTimeRaw - b.dateTimeRaw);
        default:
          return 0;
      }
    });
    return sorted;
  }, [transactions, sortConfig]);

  // Handle sort change
  const handleSortChange = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Export data function
 const exportData = async () => {
  setIsExporting(true);
  try {
    // Fetch ALL transactions without pagination
    const exportParams = {
      transactionType,
      fromDate: format(startOfDay(date), "yyyy-MM-dd"),
      toDate: format(endOfDay(date), "yyyy-MM-dd"),
      search: searchQuery,
      limit: 0, // 0 means no limit (get all)
    };
    
    if (selectedRestaurant !== "all") {
      const selected = restaurants.find((r) => r.restaurant_name === selectedRestaurant);
      if (selected) exportParams.restaurantId = selected.user_id;
    }

    const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/transactions/fetch-treasury-subcom-restaurant-history`, {
      params: exportParams,
      withCredentials: true,
    });

    // Format all transactions (not just the paginated ones)
    const allTransactions = (res.data.transactions || []).map((tx) => ({
      id: tx.id || "N/A",
      customer: tx.customer || "Unknown",
      customer_id: tx.customer_id || "N/A",
      amount: tx.amount || 0,
      dateTime: tx.datetime ? format(new Date(tx.datetime), "PPP HH:mm") : "N/A",
      dateTimeRaw: tx.datetime ? new Date(tx.datetime) : new Date(),
      type: tx.type || "Unknown",
      status: tx.status || "Completed",
    }));

    // Apply sorting to all transactions
    const sortedExportTransactions = [...allTransactions].sort((a, b) => {
      const directionMultiplier = sortConfig.direction === "asc" ? 1 : -1;
      switch (sortConfig.key) {
        case "customer":
          const customerA = a.customer || "";
          const customerB = b.customer || "";
          return directionMultiplier * customerA.localeCompare(customerB);
        case "amount":
          return directionMultiplier * (a.amount - b.amount);
        case "dateTime":
          return directionMultiplier * (a.dateTimeRaw - b.dateTimeRaw);
        default:
          return 0;
      }
    });

    // Prepare data for export
    const data = sortedExportTransactions.map((txn) => ({
      "Transaction ID": txn.id,
      Customer: txn.customer,
      "Customer ID": txn.customer_id,
      Amount: `₹${txn.amount.toFixed(2)}`,
      "Date & Time": txn.dateTime,
      Type: txn.type,
      Status: txn.status,
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
      saveAs(blob, `restaurant_transaction_history.${fileType}`);
    } else if (exportFormat === "pdf") {
      const doc = new jsPDF();
      doc.text("Restaurant Transaction History Report", 14, 10);
      autoTable(doc, {
        startY: 20,
        head: [["Transaction ID", "Customer", "Customer ID", "Amount", "Date & Time", "Type", "Status"]],
        body: data.map((txn) => Object.values(txn)),
        styles: { fontSize: 8 },
        headStyles: { fillColor: [7, 1, 73] },
      });
      doc.save("restaurant_transaction_history.pdf");
    }
  } catch (err) {
    setError("Failed to export data");
    console.error("Export error:", err);
  } finally {
    setIsExporting(false);
    setOpenDialog(false);
  }
};

  // Pagination handler
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  };

  if (!user) {
    return <div className="text-center py-8">Please log in to view your transaction history.</div>;
  }

  if (error) {
    return (
      <div className="text-center py-8">
        {error}{" "}
        <Button
          onClick={() => {
            setIsLoading(true);
            setRestaurants([]);
            setTransactions([]);
            // Re-fetch restaurants
            axios
              .get(`${import.meta.env.VITE_BASE_URL}/restaurants/fetch-all-restaurant`, {
                withCredentials: true,
              })
              .then((restaurantRes) => {
                setRestaurants(restaurantRes.data.data || []);
              })
              .catch((err) => {
                setError(err.response?.data?.message || "Failed to fetch restaurants");
                console.error("Fetch restaurants error:", err.response?.data || err.message);
              })
              .finally(() => {
                setIsLoading(false);
              });

            // Re-fetch transactions
            const queryParams = {
              transactionType,
              fromDate: format(startOfDay(date), "yyyy-MM-dd"),
              toDate: format(endOfDay(date), "yyyy-MM-dd"),
              search: searchQuery,
              page,
              limit,
            };
            if (selectedRestaurant !== "all") {
              const selected = restaurants.find((r) => r.restaurant_name === selectedRestaurant);
              if (selected) queryParams.restaurantId = selected.user_id;
            }
            fetchTransactions(queryParams);
          }}
          className="ml-2 bg-blue-700 hover:bg-blue-800"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-7xl mx-auto bg-gray-50">
      {/* Title */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <CardTitle className="text-xl sm:text-2xl font-bold" style={{ color: "#070149" }}>
            Restaurant Transaction History
          </CardTitle>
        </CardContent>
      </Card>

      {/* Controls */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Select value={selectedRestaurant} onValueChange={setSelectedRestaurant} disabled={isLoading}>
            <SelectTrigger className="w-full md:w-40 border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-700">
              <SelectValue placeholder="Select Restaurant" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Restaurants</SelectItem>
              {restaurants.map((restaurant) => (
                <SelectItem key={restaurant._id} value={restaurant.restaurant_name}>
                  {restaurant.restaurant_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full md:w-40 justify-between text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-700"
                disabled={isLoading}
              >
                {format(date, "PPP")}
                <CalendarDays className="ml-2 h-4 w-4 text-gray-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(selectedDate) => {
                  setDate(selectedDate || date);
                  setIsCalendarOpen(false);
                  setPage(1);
                }}
                initialFocus
                className="border-none shadow-sm"
              />
            </PopoverContent>
          </Popover>
          <Select value={transactionType} onValueChange={setTransactionType} disabled={isLoading}>
            <SelectTrigger className="w-full md:w-40 border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-700">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              {transactionTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
  value={sortValue}
  onValueChange={setSortValue}
  disabled={isLoading}
>
  <SelectTrigger className="w-full md:w-40 border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-700">
    <SelectValue placeholder="Sort By" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="customer-asc">Customer (A to Z)</SelectItem>
    <SelectItem value="customer-desc">Customer (Z to A)</SelectItem>
    <SelectItem value="amount-asc">Amount (Low to High)</SelectItem>
    <SelectItem value="amount-desc">Amount (High to Low)</SelectItem>
    <SelectItem value="dateTime-asc">Date & Time (Oldest First)</SelectItem>
    <SelectItem value="dateTime-desc">Date & Time (Newest First)</SelectItem>
  </SelectContent>
</Select>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search by name, customer ID, amount, type..."
              className="pl-8 text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-gray-700"
              disabled={isLoading}
              aria-label="Search transactions"
            />
          </div>
        </div>
        <Button
          onClick={() => setOpenDialog(true)}
          className="bg-[#2d2d71] text-white hover:bg-[#44447c] gap-2 transition-colors duration-200"
          disabled={isLoading || isExporting}
        >
          <Download size={16} /> Export
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100 text-gray-700 uppercase text-xs">
              <TableHead className="p-4 font-medium cursor-pointer" onClick={() => handleSortChange("dateTime")}>
                Date & Time {sortConfig.key === "dateTime" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="p-4 font-medium">Transaction ID</TableHead>
              <TableHead className="p-4 font-medium cursor-pointer" onClick={() => handleSortChange("customer")}>
                Customer {sortConfig.key === "customer" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="p-4 font-medium">Customer ID</TableHead>
              <TableHead className="p-4 font-medium cursor-pointer" onClick={() => handleSortChange("amount")}>
                Amount {sortConfig.key === "amount" && (sortConfig.direction === "asc" ? "↑" : "↓")}
              </TableHead>
              <TableHead className="p-4 font-medium">Type</TableHead>
              <TableHead className="p-4 font-medium">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="p-4 text-center text-gray-400">
                  Loading...
                </TableCell>
              </TableRow>
            ) : sortedTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-4 text-center text-gray-400">
                  No results found.
                </TableCell>
              </TableRow>
            ) : (
              sortedTransactions.map((transaction) => (
                <TableRow key={transaction.id} className="border-t hover:bg-gray-50 transition-colors duration-150">
                  <TableCell className="p-4 text-gray-600">{transaction.dateTime}</TableCell>
                  <TableCell className="p-4 text-gray-600">{transaction.id}</TableCell>
                  <TableCell className="p-4 text-gray-600">{transaction.customer}</TableCell>
                  <TableCell className="p-4 text-gray-500">{transaction.customer_id}</TableCell>
                  <TableCell
                    className={`p-4 font-semibold ${
                      transaction.type === "Refund" ? "text-red-600" : "text-green-600"
                    }`}
                  >
                    ₹{transaction.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="p-4 text-gray-600">{transaction.type}</TableCell>
                  <TableCell className="p-4">
                    <Badge
                      className={`${
                        transaction.status === "Completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      } font-medium`}
                    >
                      {transaction.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <Pagination className="mt-6 justify-end">
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious
        href="#"
        onClick={(e) => {
          e.preventDefault();
          handlePageChange(page - 1);
        }}
        disabled={page === 1 || isLoading}
        className={`transition-colors duration-200 ${
          page === 1 || isLoading
            ? "text-gray-400 cursor-not-allowed"
            : "text-gray-800 hover:bg-gray-100"
        }`}
      />
    </PaginationItem>

    {[...Array(Math.min(totalPages, 3))].map((_, i) => {
      const pageNum = i + 1;
      return (
        <PaginationItem key={pageNum}>
          <PaginationLink
            href="#"
            isActive={page === pageNum}
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(pageNum);
            }}
            disabled={isLoading}
            className={`px-3 py-1 rounded-md transition-colors duration-200 ${
              page === pageNum
                ? "bg-black text-white"
                : "text-gray-800 hover:bg-gray-100"
            }`}
          >
            {pageNum}
          </PaginationLink>
        </PaginationItem>
      );
    })}

    {totalPages > 3 && (
      <PaginationItem>
        <PaginationEllipsis className="text-gray-500" />
      </PaginationItem>
    )}

    <PaginationItem>
      <PaginationNext
        href="#"
        onClick={(e) => {
          e.preventDefault();
          handlePageChange(page + 1);
        }}
        disabled={page === totalPages || isLoading}
        className={`transition-colors duration-200 ${
          page === totalPages || isLoading
            ? "text-gray-400 cursor-not-allowed"
            : "text-gray-800 hover:bg-gray-100"
        }`}
      />
    </PaginationItem>
  </PaginationContent>
</Pagination>


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
              <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                Cancel
              </Button>
            </DialogClose>
            <Button
              onClick={exportData}
              disabled={isExporting || isLoading}
              className="bg-[#2d2d71] text-white hover:bg-[#44447c]"
            >
              {isExporting ? "Exporting..." : "Export"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestaurantHistory;