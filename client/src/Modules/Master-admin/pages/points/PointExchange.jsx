import React, { useState } from "react";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    History,
    Send,
    Users,
    DollarSign,
    ArrowRightLeft,
    Search,
    Filter,
    Eye
} from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";

const mockData = {
    treasuryBalance: 250000,
    treasuryChange: 50000,
    subcomFunds: 120000,
    memberCount: 8,
    transfersThisMonth: 32,
    totalTransferred: 75000,
};

const transactions = [
    { dateTime: "Feb 22, 2025 10:45 AM", transactionId: "#TRX-752", member: "Aditya Sharma", amount: "+ ₹7,000", status: "Completed", upi: "aditya@ybl", location: "Food Court" },
    { dateTime: "Feb 21, 2025 02:30 PM", transactionId: "#TRX-751", member: "Vikram Joshi", amount: "+ ₹4,000", status: "Completed", upi: "vikram@sbi", location: "Tech Hub" },
    { dateTime: "Feb 19, 2025 11:15 AM", transactionId: "#TRX-750", member: "Priya Gupta", amount: "+ ₹3,000", status: "Completed", upi: "priya@paytm", location: "North Campus" },
    { dateTime: "Feb 17, 2025 09:30 AM", transactionId: "#TRX-749", member: "Rahul Kumar", amount: "+ ₹5,000", status: "Completed", upi: "rahul@okaxis", location: "Main Campus" },
    { dateTime: "Feb 15, 2025 03:15 PM", transactionId: "#TRX-748", member: "Sneha Patel", amount: "+ ₹6,000", status: "Completed", upi: "sneha@hdfcb", location: "Library" },
    { dateTime: "Feb 14, 2025 01:20 PM", transactionId: "#TRX-747", member: "Amit Singh", amount: "+ ₹2,500", status: "Completed", upi: "amit@icici", location: "Admin Block" },
    { dateTime: "Feb 13, 2025 04:45 PM", transactionId: "#TRX-746", member: "Neha Reddy", amount: "+ ₹4,500", status: "Completed", upi: "neha@yesb", location: "Sports Complex" },
];

const treasuryMembers = [
    {
        name: "Rahul Kumar",
        initials: "RK",
        status: "Active",
        balance: 25000,
        budgetPercent: 83,
        memberId: "TS-001",
        lastTransfer: { amount: 5000, timeAgo: "2 days ago" },
        lastLogin: "Today, 10:45 AM",
    },
    {
        name: "Priya Gupta",
        initials: "PG",
        status: "Active",
        balance: 18500,
        budgetPercent: 62,
        memberId: "TS-002",
        lastTransfer: { amount: 3000, timeAgo: "5 days ago" },
        lastLogin: "Today, 09:22 AM",
    },
    {
        name: "Aditya Sharma",
        initials: "AS",
        status: "Active",
        balance: 22000,
        budgetPercent: 73,
        memberId: "TS-003",
        lastTransfer: { amount: 7000, timeAgo: "1 week ago" },
        lastLogin: "Yesterday, 4:15 PM",
    },
    {
        name: "Sneha Patel",
        initials: "SP",
        status: "Low Balance",
        balance: 800,
        budgetPercent: 4,
        memberId: "TS-004",
        lastTransfer: { amount: 10000, timeAgo: "2 weeks ago" },
        lastLogin: "Today, 08:37 AM",
    },
    {
        name: "Vikram Joshi",
        initials: "VJ",
        status: "Active",
        balance: 12500,
        budgetPercent: 42,
        memberId: "TS-005",
        lastTransfer: { amount: 4000, timeAgo: "3 days ago" },
        lastLogin: "Yesterday, 2:30 PM",
    },
    {
        name: "Ananya Mehta",
        initials: "AM",
        status: "Inactive",
        balance: 0,
        budgetPercent: 0,
        memberId: "TS-006",
        lastTransfer: null,
        lastLogin: "5 days ago",
    },
];

const statusBadgeColor = {
    Active: "bg-green-100 text-green-700",
    Inactive: "bg-red-100 text-red-700",
    "Low Balance": "bg-yellow-100 text-yellow-700",
};


function getColorFromInitials(initials) {
    const colors = ["#3b82f6", "#9333ea", "#10b981", "#f59e0b", "#ef4444", "#64748b"];
    const index = initials.charCodeAt(0) % colors.length;
    return colors[index];
}

function getBarColor(member) {
    if (member.status === "Inactive") return "bg-gray-300";
    if (member.status === "Low Balance") return "bg-red-500";
    return "bg-green-500";
}
const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

const Avatar = ({ name }) => {
    const initials = name.split(' ')[0][0] + (name.split(' ')[1] ? name.split(' ')[1][0] : '');
    const color = getRandomColor();
    return (
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: color }}>
            {initials}
        </div>
    );
};
const TransactionRow = ({ dateTime, transactionId, member, amount, status, upi, location }) => (
    <TableRow>
        <TableCell>{dateTime}</TableCell>
        <TableCell>{transactionId}</TableCell>
        <TableCell className="flex items-center space-x-2">
            <Avatar name={member} />
            <span>{member} <span className="text-gray-500">#{transactionId.split('-')[1]}</span></span>
        </TableCell>
        <TableCell>{amount}</TableCell>
        <TableCell>
            <span className="text-green-600">{status}</span>
        </TableCell>
        <TableCell>{upi}</TableCell>
        <TableCell>{location}</TableCell>
        <TableCell>
            <a href="#" className="text-blue-600 hover:underline flex items-center">
                <Eye className="w-4 h-4 mr-1" /> View Details
            </a>
        </TableCell>
    </TableRow>
);
const PointExchange = () => {
    const [status, setStatus] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [visibleTransactions, setVisibleTransactions] = useState(transactions.slice(0, 5));

    const loadMore = () => {
        setVisibleTransactions(transactions);
    };
    return (
        <div className="p-6 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Subcommittee Fund Management</h2>
                    <p className="text-muted-foreground text-sm">
                        Add and manage funds for treasury subcommittee members
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <History className="w-4 h-4 mr-2" /> Transaction History
                    </Button>
                    <Button className="bg-[#00004D] cursor-pointer">
                        <Send className="w-4 h-4 mr-2" /> Bulk Fund Transfer
                    </Button>
                </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <CardComponent
                    title="Main Treasury Balance"
                    amount={`₹ ${mockData.treasuryBalance.toLocaleString()}`}
                    subtitle={`+₹ ${mockData.treasuryChange.toLocaleString()} from last month`}
                    icon={<DollarSign className="text-blue-600" />}
                    bg="blue-100"
                />
                <CardComponent
                    title="Total Subcom Funds"
                    amount={`₹ ${mockData.subcomFunds.toLocaleString()}`}
                    subtitle={`Distributed across ${mockData.memberCount} members`}
                    icon={<Users className="text-green-600" />}
                    bg="green-100"
                />
                <CardComponent
                    title="Transfers This Month"
                    amount={mockData.transfersThisMonth}
                    subtitle={`₹ ${mockData.totalTransferred.toLocaleString()} total transferred`}
                    icon={<ArrowRightLeft className="text-purple-600" />}
                    bg="purple-100"
                />
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-3 justify-between">
                <div className="w-full md:w-1/3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Search members by name or ID..."
                            className="pl-10"
                        />
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    <Select onValueChange={setStatus}>
                        <SelectTrigger className="min-w-[140px]">
                            <SelectValue placeholder="All Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select onValueChange={setSortBy}>
                        <SelectTrigger className="min-w-[180px]">
                            <SelectValue placeholder="Sort by" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="balance-high">Balance (High-Low)</SelectItem>
                            <SelectItem value="balance-low">Balance (Low-High)</SelectItem>
                            <SelectItem value="recent">Recent Activity</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="secondary" className="cursor-pointer">
                        <Filter className="w-4 h-4 mr-2" /> Filters
                    </Button>
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {treasuryMembers.map((member, idx) => (
                    <Card
                        key={idx}
                        className={`border-t-4 p-5 shadow ${member.status === "Active"
                            ? "border-green-500"
                            : member.status === "Low Balance"
                                ? "border-yellow-500"
                                : "border-red-500"
                            }`}
                    >
                        <CardContent className="p-0">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full w-10 h-10 flex items-center justify-center font-bold text-white text-sm" style={{ backgroundColor: getColorFromInitials(member.initials) }}>
                                        {member.initials}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold leading-tight">{member.name}</h3>
                                        <p className="text-sm text-muted-foreground">Current Balance</p>
                                    </div>
                                </div>
                                <Badge className={`text-xs ${statusBadgeColor[member.status]}`}>{member.status}</Badge>
                            </div>

                            <div className="mt-2 flex justify-between items-center">
                                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${getBarColor(member)}`}
                                        style={{ width: `${member.budgetPercent}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-bold text-blue-600 ml-2">
                                    ₹ {member.balance.toLocaleString()}
                                </span>
                            </div>

                            <p className="text-xs text-muted-foreground mt-1">
                                {member.budgetPercent}% of allocated budget
                            </p>

                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Member ID</p>
                                    <p className="font-medium">#{member.memberId}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Last Transfer</p>
                                    <p className="font-medium">
                                        {member.lastTransfer
                                            ? `₹ ${member.lastTransfer.amount.toLocaleString()} (${member.lastTransfer.timeAgo})`
                                            : "N/A"}
                                    </p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-muted-foreground">Last Login</p>
                                    <p className="font-medium">{member.lastLogin}</p>
                                </div>
                            </div>

                            <Button
                                className={`mt-4 w-full bg-[#00004D] cursor-pointer ${member.status === "Inactive"
                                    ? "bg-gray-300 pointer-events-none text-gray-600"
                                    : ""
                                    }`}
                            >
                                + Add Funds
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
            <div className="container mx-auto p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Fund Transfers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>DATE & TIME</TableHead>
                                    <TableHead>TRANSACTION ID</TableHead>
                                    <TableHead>MEMBER</TableHead>
                                    <TableHead>AMOUNT</TableHead>
                                    <TableHead>STATUS</TableHead>
                                    <TableHead>UPI ID</TableHead>
                                    <TableHead>LOCATION</TableHead>
                                    <TableHead>ACTIONS</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {visibleTransactions.map((transaction, index) => (
                                    <TransactionRow key={index} {...transaction} />
                                ))}
                            </TableBody>
                        </Table>
                        {visibleTransactions.length < transactions.length && (
                            <button
                                onClick={loadMore}
                                className="mt-4 text-blue-600 hover:underline"
                            >
                                View All Transactions
                            </button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const CardComponent = ({ title, amount, subtitle, icon, bg }) => (
    <div className="p-5 rounded-xl bg-white shadow flex justify-between items-center">
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <h3 className="text-2xl font-bold">{amount}</h3>
            <p className="text-sm text-green-600 mt-1">{subtitle}</p>
        </div>
        <div className={`p-3 rounded-full bg-${bg}`}>{icon}</div>
    </div>
);

export default PointExchange;
