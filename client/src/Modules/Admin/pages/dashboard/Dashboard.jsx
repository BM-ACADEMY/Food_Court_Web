// File: src/pages/Dashboard.tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as DatePicker } from "@/components/ui/calendar";

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
} from "lucide-react";
import { useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
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
  PaginationEllipsis,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
// import { Calendar as DatePicker } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";

const mockStats = [
  {
    title: "Customers Logged In",
    value: 252,
    diff: 12,
    icon: <Users className="text-blue-600 size-6" />,
    color: "border-l-4 border-blue-600",
  },
  {
    title: "Cards in Use",
    value: 183,
    diff: 8,
    icon: <CreditCard className="text-purple-600 size-6" />,
    color: "border-l-4 border-purple-600",
  },
  {
    title: "Transactions Today",
    value: 1436,
    diff: 23,
    icon: <ClipboardList className="text-green-600 size-6" />,
    color: "border-l-4 border-green-600",
  },
  {
    title: "Restaurants Active",
    value: 18,
    diff: 100,
    icon: <Utensils className="text-yellow-600 size-6" />,
    color: "border-l-4 border-yellow-600",
  },
];

const transactions = [
  {
    time: "Just now",
    id: "TRX-2598",
    type: "Top Up",
    from: "Customer (User 27)",
    to: "Restaurant (Vendor 12)",
    amount: "₹176",
    status: "Completed",
  },
  {
    time: "Just now",
    id: "TRX-2594",
    type: "Top Up",
    from: "Customer (User 47)",
    to: "Restaurant (Vendor 11)",
    amount: "₹50",
    status: "Completed",
  },
];

export default function Dashboard() {
  const [transactionType, setTransactionType] = useState("all");
  const [userType, setUserType] = useState("all");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [startDate, setStartDate] = useState(Date);
  const [endDate, setEndDate] = useState(Date);
  const itemsPerPage = 5 // Customize as needed
  const totalRecords = transactions.length
  const totalPages = Math.ceil(totalRecords / itemsPerPage)

  const [currentPage, setCurrentPage] = useState(1)

  const paginatedData = transactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page)
  }
  return (
    <div className="p-6 space-y-6 font-sans">
      <h1 className="text-3xl font-bold text-[#00004D]">Dashboard Overview</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {mockStats.map((stat) => (
          <Card key={stat.title} className={`rounded-lg shadow-sm ${stat.color}`}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className="bg-muted p-2 rounded-full">{stat.icon}</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-sm text-green-600">+{stat.diff}% from yesterday</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-lg shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Live Transactions</CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-green-600 text-sm">● Live Updates</span>
            <Button size="sm" className="bg-[#00004D] cursor-pointer">
              <Download className="mr-2 size-4 " /> Export Data
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Transaction Type */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm px-1">Transaction Type</Label>
              <Select value={transactionType} onValueChange={setTransactionType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Transaction Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="topup">Top Up</SelectItem>
                  <SelectItem value="withdraw">Withdraw</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* User Type */}
            <div className="flex flex-col gap-1">
              <Label className="text-sm px-1">User Type</Label>
              <Select value={userType} onValueChange={setUserType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* From Date */}
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
                  <DatePicker mode="single" selected={fromDate} onSelect={setFromDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {/* To Date */}
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
                  <DatePicker mode="single" selected={toDate} onSelect={setToDate} initialFocus />
                </PopoverContent>
              </Popover>
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
                {paginatedData.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>{tx.time}</TableCell>
                    <TableCell>#{tx.id}</TableCell>
                    <TableCell>{tx.type}</TableCell>
                    <TableCell>{tx.from}</TableCell>
                    <TableCell>{tx.to}</TableCell>
                    <TableCell>{tx.amount}</TableCell>
                    <TableCell>{tx.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-2 flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                Showing {(currentPage - 1) * itemsPerPage + 1}
                –
                {Math.min(currentPage * itemsPerPage, totalRecords)} of {totalRecords} records
              </p>

              <div className="float-end">
                <Pagination>
                  <PaginationContent>
                    {/* Previous */}
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage((p) => Math.max(1, p - 1));
                        }}
                      />
                    </PaginationItem>

                    {/* Dynamic 5-page block */}
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
                                setCurrentPage(pageNum);
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
                          setCurrentPage((p) => Math.min(totalPages, p + 1));
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            </div>



          </div>


        </CardContent>
      </Card>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Export All */}
        <div className="rounded-md border p-4">
          <h2 className="font-semibold mb-2">Export All Data</h2>
          <p className="text-sm mb-4 text-muted-foreground">
            Export complete transaction data for all users and categories
          </p>
          <Button className="w-full bg-[#00004D] cursor-pointer">
            <CalendarIcon className="w-4 h-4 mr-2" /> Export All
          </Button>
        </div>

        {/* Export by User Type */}
        <div className="rounded-md border p-4">
          <h2 className="font-semibold mb-2">Export by User Type</h2>
          <Select onValueChange={setUserType} defaultValue="">
            <SelectTrigger className="w-full mb-4">
              <SelectValue placeholder="Select User Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="restaurant">Restaurant</SelectItem>
            </SelectContent>
          </Select>
          <Button className="w-full bg-[#00004D] cursor-pointer">
            <CalendarIcon className="w-4 h-4 mr-2" /> Export Selected
          </Button>
        </div>

        {/* Export by Date Range */}
        <div className="rounded-md border p-4">
          <h2 className="font-semibold mb-2">Export by Date Range</h2>
          <div className="flex gap-2 mb-4">
            {/* Start Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(" justify-start text-left", !startDate && "text-muted-foreground cursor-pointer")}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {startDate ? format(startDate, "dd-MM-yyyy") : "Start Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DatePicker
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            {/* End Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(" justify-start text-left", !endDate && "text-muted-foreground cursor-pointer")}
                >
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {endDate ? format(endDate, "dd-MM-yyyy") : "End Date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <DatePicker
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>


          <Button className="w-full bg-[#00004D] cursor-pointer">
            <CalendarIcon className="w-4 h-4 mr-2" /> Export Range
          </Button>
        </div>
      </div>
    </div>
  );
}
