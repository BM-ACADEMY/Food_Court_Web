// File: src/pages/TransactionHistory.tsx
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
    CalendarIcon,
    SortAsc, SortDesc,
    Pencil,
    Download,
    Edit,
    ChevronDownIcon
} from "lucide-react";

import { useState } from "react";
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

const stats = [
    {
        label: "Total Transactions",
        value: 12458,
        change: "+8.2%",
        positive: true,
        color: "#4f46e5", // Indigo
        icon: ClipboardList,
    },
    {
        label: "Total Revenue",
        value: 1245800,
        change: "+12.5%",
        positive: true,
        color: "#22c55e", // Green
        icon: DollarSign,
    },
    {
        label: "Avg. Transaction Value",
        value: 245,
        change: "-2.1%",
        positive: false,
        color: "#a855f7", // Purple
        icon: BarChart2,
    },
    {
        label: "Refunds",
        value: 24580,
        change: "-5.8%",
        positive: false,
        color: "#eab308", // Yellow
        icon: BadgeX,
    },
];


const mockTransactions = [
    {
        datetime: "Feb 22, 2025 14:35",
        id: "#TRX-8752",
        user: { name: "Rahul Patel", type: "Customer" },
        type: "Purchase",
        description: "Food purchase at Tasty Bites",
        location: "Main Campus",
        amount: -350,
    },
    {
        datetime: "Feb 22, 2025 13:20",
        id: "#TRX-8751",
        user: { name: "Aditya Sharma", type: "Subcom" },
        type: "Transfer",
        description: "Fund transfer to Events dept.",
        location: "North Campus",
        amount: 5000,
    },
];

const chartData = {
    day: [
        { label: "Mon", transactions: 45000, refunds: 15000, topups: 22000 },
        { label: "Tue", transactions: 60000, refunds: 8000, topups: 10000 },
        { label: "Wed", transactions: 52000, refunds: 7000, topups: 11000 },
        { label: "Thu", transactions: 68000, refunds: 10000, topups: 13000 },
        { label: "Fri", transactions: 75000, refunds: 9000, topups: 14000 },
        { label: "Sat", transactions: 64000, refunds: 5000, topups: 18000 },
        { label: "Sun", transactions: 30000, refunds: 6000, topups: 9000 },
    ],

    week: [
        { label: "Week 1", transactions: 320000, refunds: 45000, topups: 70000 },
        { label: "Week 2", transactions: 295000, refunds: 38000, topups: 65000 },
        { label: "Week 3", transactions: 310000, refunds: 42000, topups: 60000 },
        { label: "Week 4", transactions: 330000, refunds: 50000, topups: 75000 },
    ],

    month: [
        { label: "Jan", transactions: 1250000, refunds: 190000, topups: 210000 },
        { label: "Feb", transactions: 1100000, refunds: 170000, topups: 180000 },
        { label: "Mar", transactions: 1380000, refunds: 210000, topups: 230000 },
        { label: "Apr", transactions: 1440000, refunds: 220000, topups: 240000 },
        { label: "May", transactions: 1500000, refunds: 200000, topups: 250000 },
        { label: "Jun", transactions: 1340000, refunds: 185000, topups: 220000 },
    ],

    year: [
        { label: "2020", transactions: 15000000, refunds: 2200000, topups: 3000000 },
        { label: "2021", transactions: 16500000, refunds: 2500000, topups: 3200000 },
        { label: "2022", transactions: 17200000, refunds: 2600000, topups: 3400000 },
        { label: "2023", transactions: 18000000, refunds: 2400000, topups: 3700000 },
        { label: "2024", transactions: 19500000, refunds: 2800000, topups: 4000000 },
    ],
};

export default function TransactionHistory() {
    const [transactionType, setTransactionType] = useState("all");
    const [userType, setUserType] = useState("all");
    const [location, setLocation] = useState("all");
    const [fromDate, setFromDate] = useState(undefined);
    const [toDate, setToDate] = useState(undefined);
    const [search, setSearch] = useState("");
    const [quickFilter, setQuickFilter] = useState("day");
    const [openTo, setOpenTo] = useState(false)

    const [openFrom, setOpenFrom] = useState(false)
    const filteredTransactions = mockTransactions.filter((txn) => {
        const matchType = transactionType === "all" || txn.type.toLowerCase().includes(transactionType);
        const matchUser = userType === "all" || txn.user.type.toLowerCase().includes(userType);
        const matchLocation = location === "all" || txn.location.toLowerCase().includes(location);
        const matchSearch =
            search.trim() === "" ||
            txn.id.toLowerCase().includes(search.toLowerCase()) ||
            txn.user.name.toLowerCase().includes(search.toLowerCase());
        return matchType && matchUser && matchLocation && matchSearch;
    });

    return (
        <div className="p-6 space-y-6">
            <h1 className="text-3xl font-bold text-[#00004D]">Transaction History</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                        <Card
                            key={s.label}
                            className="border-l-4 p-4"
                            style={{ borderLeftColor: s.color }}
                        >
                            <CardContent className="p-0">
                                <div className="flex justify-between items-start">
                                    {/* Left: Text Info */}
                                    <div>
                                        <CardTitle className="text-sm font-medium text-muted-foreground">
                                            {s.label}
                                        </CardTitle>
                                        <div className="text-2xl font-bold mt-2">
                                            {s.label.includes("Revenue") || s.label.includes("Value") || s.label === "Refunds"
                                                ? `₹${s.value.toLocaleString()}`
                                                : s.value.toLocaleString()}
                                        </div>
                                        <p className={`text-sm mt-1 ${s.positive ? "text-green-600" : "text-red-500"}`}>
                                            {s.change} from last month
                                        </p>
                                    </div>

                                    {/* Right: Icon with matching color */}
                                    <Icon
                                        className="size-6 p-1 rounded-full"
                                        style={{
                                            color: s.color,

                                            backgroundColor: `${s.color}20`, // 20 = ~12.5% opacity in hex
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
                        <ToggleGroup type="single" value={quickFilter} onValueChange={setQuickFilter}>
                            {["day", "week", "month", "year"].map((val) => (
                                <ToggleGroupItem key={val} value={val} className="capitalize">
                                    {val}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData[quickFilter] || []}>
                            <XAxis dataKey="label" />
                            <YAxis />
                            <Tooltip formatter={(value) => `₹${value}`} />
                            <Legend />
                            <Bar
                                dataKey="transactions"
                                fill="#4f46e5"
                                name="Transactions"
                                radius={[10, 10, 0, 0]}   // top-left, top-right, bottom-right, bottom-left
                                barSize={30}              // 👈 controls bar thickness
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
                </CardContent>
            </Card>

            {/* Filters */}
            <Card>
                <CardContent className="p-6 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                        {/* Heading */}
                        <h2 className="text-lg font-semibold">All Transactions</h2>

                        {/* Buttons */}
                        <div className="flex flex-wrap gap-2">
                            <Button className="bg-[#00004D] text-white flex items-center gap-2 text-sm px-3 py-2">
                                <SortAsc className="size-4" />
                                View By
                            </Button>

                            <Button className="bg-green-600 text-white flex items-center gap-2 text-sm px-3 py-2">
                                <Edit className="size-4" />
                                Edit Transaction
                            </Button>

                            <Button className="bg-[#00004D] text-white flex items-center gap-2 text-sm px-3 py-2">
                                <Download className="size-4" />
                                Export
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Select value={transactionType} onValueChange={setTransactionType}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Transaction Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="purchase">Purchase</SelectItem>
                                <SelectItem value="transfer">Transfer</SelectItem>
                                <SelectItem value="settlement">Settlement</SelectItem>
                                <SelectItem value="admin">Admin Transfer</SelectItem>
                                <SelectItem value="topup">Top-up</SelectItem>
                                <SelectItem value="refund">Refund</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={userType} onValueChange={setUserType}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="User Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Users</SelectItem>
                                <SelectItem value="customer">Customer</SelectItem>
                                <SelectItem value="restaurant">Restaurant</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={location} onValueChange={setLocation}>
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="Location" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Locations</SelectItem>
                                <SelectItem value="main">Main Campus</SelectItem>
                                <SelectItem value="north">North Campus</SelectItem>
                                <SelectItem value="south">South Campus</SelectItem>
                            </SelectContent>
                        </Select>

                        <Input
                            className="w-full"
                            placeholder="Search by name, transaction ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>


                    {/* Date Range Picker */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* From Date */}
                        <div className="flex flex-col gap-1">
                            <Label htmlFor="from-date" className="text-sm px-1">From Date</Label>
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
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        captionLayout="dropdown"
                                        selected={fromDate}
                                        onSelect={(date) => {
                                            setFromDate(date)
                                            setOpenFrom(false)
                                        }}
                                        fromYear={2000}
                                        toYear={2030}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* To Date */}
                        <div className="flex flex-col gap-1">
                            <Label htmlFor="to-date" className="text-sm px-1">To Date</Label>
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
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        captionLayout="dropdown"
                                        selected={toDate}
                                        onSelect={(date) => {
                                            setToDate(date)
                                            setOpenTo(false)
                                        }}
                                        fromYear={2000}
                                        toYear={2030}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>



                    <div className="flex flex-wrap items-center gap-2 pt-2">
                        <span className="font-bold">Quick Filter :</span>
                        {[
                            "Today",
                            "Yesterday",
                            "Last 7 Days",
                            "This Month",
                            "High Value (≥₹10000)",
                            "Refunds Only",
                            "Top-ups Only",
                            "Admin Transfers",
                        ].map((filter) => (
                            <Button
                                key={filter}
                                variant={quickFilter === filter ? "default" : "outline"}
                                size="sm"
                                className={quickFilter === filter ? "bg-[#00004D] text-white" : ""}
                                onClick={() => setQuickFilter(filter)}
                            >
                                {filter}
                            </Button>

                        ))}
                    </div>


                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date & Time</TableHead>
                                    <TableHead>Transaction ID</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Description</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.map((txn) => (
                                    <TableRow key={txn.id}>
                                        <TableCell>{txn.datetime}</TableCell>
                                        <TableCell className="font-semibold">{txn.id}</TableCell>
                                        <TableCell>
                                            <div className="font-medium">{txn.user.name}</div>
                                            <div className="text-xs text-muted-foreground">{txn.user.type}</div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="capitalize rounded px-2 py-1 text-xs font-medium bg-gray-100">
                                                {txn.type}
                                            </span>
                                        </TableCell>
                                        <TableCell>{txn.description}</TableCell>
                                        <TableCell>{txn.location}</TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {txn.amount < 0 ? (
                                                <span className="text-red-500">- ₹{Math.abs(txn.amount)}</span>
                                            ) : (
                                                <span className="text-green-600">+ ₹{txn.amount}</span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    <div className="pt-4 float-end">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious href="#" />
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#">1</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#" isActive>
                                        2
                                    </PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationLink href="#">3</PaginationLink>
                                </PaginationItem>
                                <PaginationItem>
                                    <PaginationNext href="#" />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>


                </CardContent>
            </Card>
        </div>
    );
}

