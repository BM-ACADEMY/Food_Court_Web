import React, { useState, useEffect, useRef } from "react";
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
    Eye,
    PiggyBank
} from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import AddPointForm from "./AddPointForm";
import axios from "axios";
import RecentTransactions from "./RecentTransactions";
import { useAuth } from "@/context/AuthContext";
import AddFundModalForm from "./AddFundsForm";
import DashboardCards from "./DashboardCards";



const transactions = [
    { dateTime: "Feb 22, 2025 10:45 AM", transactionId: "#TRX-752", member: "Aditya Sharma", amount: "+ ₹7,000", status: "Completed", upi: "aditya@ybl", location: "Food Court" },
    { dateTime: "Feb 21, 2025 02:30 PM", transactionId: "#TRX-751", member: "Vikram Joshi", amount: "+ ₹4,000", status: "Completed", upi: "vikram@sbi", location: "Tech Hub" },
    { dateTime: "Feb 19, 2025 11:15 AM", transactionId: "#TRX-750", member: "Priya Gupta", amount: "+ ₹3,000", status: "Completed", upi: "priya@paytm", location: "North Campus" },
    { dateTime: "Feb 17, 2025 09:30 AM", transactionId: "#TRX-749", member: "Rahul Kumar", amount: "+ ₹5,000", status: "Completed", upi: "rahul@okaxis", location: "Main Campus" },
    { dateTime: "Feb 15, 2025 03:15 PM", transactionId: "#TRX-748", member: "Sneha Patel", amount: "+ ₹6,000", status: "Completed", upi: "sneha@hdfcb", location: "Library" },
    { dateTime: "Feb 14, 2025 01:20 PM", transactionId: "#TRX-747", member: "Amit Singh", amount: "+ ₹2,500", status: "Completed", upi: "amit@icici", location: "Admin Block" },
    { dateTime: "Feb 13, 2025 04:45 PM", transactionId: "#TRX-746", member: "Neha Reddy", amount: "+ ₹4,500", status: "Completed", upi: "neha@yesb", location: "Sports Complex" },
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


const roleIdFieldMap = {
    "role-1": "master_admin_id",
    "role-2": "admin_id",
    "role-3": "treasury_subcom_id",
    "role-4": "restaurant_id",
    "role-5": "customer_id",
};

const PointExchange = () => {
    const [status, setStatus] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const { user } = useAuth();
    const [roles, setRoles] = useState([]);
    const [users, setUsers] = useState([]);
    const [visibleTransactions, setVisibleTransactions] = useState(transactions.slice(0, 5));
    const [open, setOpen] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState("");
    const [page, setPage] = useState(1);
    const [selectedReceiver, setSelectedReceiver] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const transactionRef = useRef(null);

    const scrollToTransactions = () => {
        transactionRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    const loadMore = () => {
        setVisibleTransactions(transactions);
    };

    useEffect(() => {
        fetchAllRoles();
        if (selectedRoleId) {
            fetchUsers(selectedRoleId, 1);
        }
    }, [searchTerm, status, sortBy]);

    const fetchAllRoles = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/roles/fetch-all-roles`);
            const fetchedRoles = res.data.data || [];
            setRoles(fetchedRoles);

            // Auto-select "Treasury Subcom" role on load
            const treasuryRole = fetchedRoles.find(role => role.name.toLowerCase().includes("treasury"));
            if (treasuryRole) {
                setSelectedRoleId(treasuryRole.role_id);
                fetchUsers(treasuryRole.role_id, 1);
            }
        } catch (err) {
            console.error("Failed to fetch roles:", err);
        }
    };

    const fetchUsers = async (roleId, pageNum = 1) => {
        try {
            const query = new URLSearchParams({
                page: pageNum,
                search: searchTerm || "",
                status: status || "all",
                sort: sortBy || "",
            });

            const res = await axios.get(`${import.meta.env.VITE_BASE_URL}/users/with-balance-by-role/${roleId}?${query}`);

            if (pageNum === 1) {
                setUsers(res.data.data);
            } else {
                setUsers((prev) => [...prev, ...res.data.data]);
            }

            setPage(pageNum);
        } catch (err) {
            console.error("Failed to fetch users:", err);
        }
    };

    const handleRoleSelect = (roleId) => {
        setSelectedRoleId(roleId);
        fetchUsers(roleId, 1);
    };

    const handleLoadMore = () => {
        fetchUsers(selectedRoleId, page + 1);
    };

    return (
        <div className=" min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h2 className="text-2xl font-bold">Subcommittee Fund Management</h2>
                    <p className="text-muted-foreground text-sm">
                        Add and manage funds for treasury subcommittee members
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-start">
                    {/* Credit Master Admin Point Button */}
                    <Button variant="secondary" className="w-full sm:w-auto" onClick={() => setOpen(true)}>
                        <PiggyBank className="w-4 h-4 mr-2" /> Credit Master Admin Point
                    </Button>

                    {/* Transaction History Button */}
                    <Button variant="outline" className="w-full sm:w-auto" onClick={scrollToTransactions}>
                        <History className="w-4 h-4 mr-2" /> Transaction History
                    </Button>

                    {/* Modal Dialog */}
                    <Dialog open={open} onOpenChange={setOpen}>
                        <DialogContent className="max-w-sm">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 font-bold text-[#00004D]">
                                    <PiggyBank className="w-5 h-5 text-yellow-500" />
                                    Credit Master Admin Point
                                </DialogTitle>
                            </DialogHeader>

                            <AddPointForm onSuccess={() => setOpen(false)} />
                        </DialogContent>
                    </Dialog>
                </div>

            </div>

            {/* Cards */}
            <div >
                <DashboardCards />
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-3 justify-between">
                <div className="w-full md:w-1/3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                            placeholder="Search members by name or ID..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                    <Select value={selectedRoleId} onValueChange={handleRoleSelect}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select Role" />
                        </SelectTrigger>
                        <SelectContent>
                            {roles.map((role) => (
                                <SelectItem key={role._id} value={role.role_id}>
                                    {role.name}
                                </SelectItem>
                            ))}
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

                    {/* <Button variant="secondary" className="cursor-pointer">
                        <Filter className="w-4 h-4 mr-2" /> Filters
                    </Button> */}
                </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {users.map((user, idx) => {
                    const initials = user.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
                    const balance = user.balance || 0;
                    const status = balance === 0 ? "Inactive" : balance < 1000 ? "Low Balance" : "Active";
                    const budgetPercent = Math.min(Math.round((balance / 30000) * 100), 100); // adjust max budget logic as needed
                    const fieldKey = roleIdFieldMap[user.role_id?.role_id] || "user_id";
                    const rawId = user[fieldKey] || "";
                    const memberId = rawId?.slice(-5).toUpperCase() || "N/A";

                    const lastTransfer = user.lastTransaction
                        ? {
                            amount: parseFloat(user.lastTransaction.amount?.toString() || "0"),
                            timeAgo: user.lastTransaction.timeAgo || "recently"
                        }
                        : null;

                    return (
                        <Card
                            key={idx}
                            className={`border-t-4 p-5 shadow ${status === "Active"
                                ? "border-green-500"
                                : status === "Low Balance"
                                    ? "border-yellow-500"
                                    : "border-red-500"
                                }`}
                        >
                            <CardContent className="p-0">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="rounded-full w-10 h-10 flex items-center justify-center font-bold text-white text-sm"
                                            style={{ backgroundColor: getColorFromInitials(initials) }}
                                        >
                                            {initials}
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold leading-tight">{user.name}</h3>
                                            <p className="text-sm text-muted-foreground">Current Balance</p>
                                        </div>
                                    </div>
                                    <Badge className={`text-xs ${statusBadgeColor[status]}`}>{status}</Badge>
                                </div>

                                <div className="mt-2 flex justify-between items-center">
                                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${getBarColor({ status })}`}
                                            style={{ width: `${budgetPercent}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-bold text-blue-600 ml-2">
                                        ₹ {balance.toLocaleString()}
                                    </span>
                                </div>

                                <p className="text-xs text-muted-foreground mt-1">
                                    {budgetPercent}% of allocated budget
                                </p>

                                <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Member ID</p>
                                        <p className="font-medium">#{memberId}</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Last Transfer</p>
                                        <p className="font-medium">
                                            {lastTransfer
                                                ? `₹ ${lastTransfer.amount.toLocaleString()} (${new Date(lastTransfer.timeAgo).toLocaleString("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "2-digit",
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                    hour12: true,
                                                })})`
                                                : "N/A"}
                                        </p>

                                    </div>
                                    <div className="col-span-2">
                                        <p className="text-muted-foreground">Last Login</p>
                                        <p className="font-medium">
                                            {user.lastLogin
                                                ? new Intl.DateTimeFormat("en-US", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "2-digit",
                                                    hour: "numeric",
                                                    minute: "2-digit",
                                                    hour12: true,
                                                }).format(new Date(user.lastLogin))
                                                : "N/A"}
                                        </p>
                                    </div>

                                </div>

                                <Button
                                    className={`mt-4 w-full bg-[#00004D] cursor-pointer
                                        }`}
                                    onClick={() => {
                                        setSelectedReceiver(user); // pass entire user or just user._id
                                        setOpenModal(true);
                                    }}
                                >
                                    + Add Funds
                                </Button>
                            </CardContent>
                        </Card>

                    );
                })}
                <Dialog open={openModal} onOpenChange={setOpenModal}>
                    <DialogContent className="sm:max-w-[500px]">
                        {selectedReceiver && (
                            <AddFundModalForm
                                senderId={user._id}
                                receiver={selectedReceiver}
                                onClose={() => setOpenModal(false)}
                            />
                        )}
                    </DialogContent>
                </Dialog>
            </div>

            <div className="mt-3" ref={transactionRef}>
                <RecentTransactions />
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
