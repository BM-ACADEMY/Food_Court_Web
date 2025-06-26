// // File: src/pages/TransactionHistory.tsx
// import {
//   Card,
//   CardContent,
//   CardTitle,
// } from "@/components/ui/card";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from "@/components/ui/table";
// import { Button } from "@/components/ui/button";
// import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
// import {
//   BarChart,
//   Bar,
//   XAxis,
//   YAxis,
//   Tooltip,
//   Legend,
//   ResponsiveContainer,
// } from "recharts";
// import {
//   ClipboardList,
//   DollarSign,
//   BarChart2,
//   BadgeX,
//   SortAsc,
//   Download,
//   Edit,
//   ChevronDownIcon,
// } from "lucide-react";

// import { useState, useEffect } from "react";
// import { Input } from "@/components/ui/input";
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
// import { Calendar } from "@/components/ui/calendar";
// import { format } from "date-fns";
// import { Label } from "@/components/ui/label";
// import {
//   Pagination,
//   PaginationContent,
//   PaginationItem,
//   PaginationLink,
//   PaginationNext,
//   PaginationPrevious,
// } from "@/components/ui/pagination";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";
// import axios from "axios";

// // Static data (can be replaced with API calls later)
// const stats = [
//   {
//     label: "Total Transactions",
//     value: 12458,
//     change: "+8.2%",
//     positive: true,
//     color: "#4f46e5",
//     icon: ClipboardList,
//   },
//   {
//     label: "Total Revenue",
//     value: 1245800,
//     change: "+12.5%",
//     positive: true,
//     color: "#22c55e",
//     icon: DollarSign,
//   },
//   {
//     label: "Avg. Transaction Value",
//     value: 245,
//     change: "-2.1%",
//     positive: false,
//     color: "#a855f7",
//     icon: BarChart2,
//   },
//   {
//     label: "Refunds",
//     value: 24580,
//     change: "-5.8%",
//     positive: false,
//     color: "#eab308",
//     icon: BadgeX,
//   },
// ];

// const mockTransactions = [
//   {
//     datetime: "Feb 22, 2025 14:35",
//     id: "#TRX-8752",
//     user: { name: "Rahul Patel", type: "Customer" },
//     type: "Purchase",
//     description: "Food purchase at Tasty Bites",
//     location: "Main Campus",
//     amount: -350,
//   },
//   {
//     datetime: "Feb 22, 2025 13:20",
//     id: "#TRX-8751",
//     user: { name: "Aditya Sharma", type: "Subcom" },
//     type: "Transfer",
//     description: "Fund transfer to Events dept.",
//     location: "North Campus",
//     amount: 5000,
//   },
// ];

// const chartData = {
//   day: [
//     { label: "Mon", transactions: 45000, refunds: 15000, topups: 22000 },
//     { label: "Tue", transactions: 60000, refunds: 8000, topups: 10000 },
//     { label: "Wed", transactions: 52000, refunds: 7000, topups: 11000 },
//     { label: "Thu", transactions: 68000, refunds: 10000, topups: 13000 },
//     { label: "Fri", transactions: 75000, refunds: 9000, topups: 14000 },
//     { label: "Sat", transactions: 64000, refunds: 5000, topups: 18000 },
//     { label: "Sun", transactions: 30000, refunds: 6000, topups: 9000 },
//   ],
//   week: [
//     { label: "Week 1", transactions: 320000, refunds: 45000, topups: 70000 },
//     { label: "Week 2", transactions: 295000, refunds: 38000, topups: 65000 },
//     { label: "Week 3", transactions: 310000, refunds: 42000, topups: 60000 },
//     { label: "Week 4", transactions: 330000, refunds: 50000, topups: 75000 },
//   ],
//   month: [
//     { label: "Jan", transactions: 1250000, refunds: 190000, topups: 210000 },
//     { label: "Feb", transactions: 1100000, refunds: 170000, topups: 180000 },
//     { label: "Mar", transactions: 1380000, refunds: 210000, topups: 230000 },
//     { label: "Apr", transactions: 1440000, refunds: 220000, topups: 240000 },
//     { label: "May", transactions: 1500000, refunds: 200000, topups: 250000 },
//     { label: "Jun", transactions: 1340000, refunds: 185000, topups: 220000 },
//   ],
//   year: [
//     { label: "2020", transactions: 15000000, refunds: 2200000, topups: 3000000 },
//     { label: "2021", transactions: 16500000, refunds: 2500000, topups: 3200000 },
//     { label: "2022", transactions: 17200000, refunds: 2600000, topups: 3400000 },
//     { label: "2023", transactions: 18000000, refunds: 2400000, topups: 3700000 },
//     { label: "2024", transactions: 19500000, refunds: 2800000, topups: 4000000 },
//   ],
// };

// export default function TransactionHistory() {
//   const [transactionType, setTransactionType] = useState("all");
//   const [userType, setUserType] = useState("all");
//   const [selectedLocation, setSelectedLocation] = useState("all"); // For selected location
//   const [locations, setLocations] = useState([]); // For storing all locations
//   const [roles, setRoles] = useState([]); // For storing all roles
//   const [fromDate, setFromDate] = useState(undefined);
//   const [toDate, setToDate] = useState(undefined);
//   const [search, setSearch] = useState("");
//   const [quickFilter, setQuickFilter] = useState("day");
//   const [openTo, setOpenTo] = useState(false);
//   const [openFrom, setOpenFrom] = useState(false);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState(null);

//   // Fetch locations and roles when component mounts
//   useEffect(() => {
//     const fetchData = async () => {
//       setLoading(true);
//       setError(null);
//       try {
//         // Fetch locations
//         const locationResponse = await axios.get(
//           `${import.meta.env.VITE_BASE_URL}/locations/fetch-all-locations`
//         );
//         setLocations(locationResponse.data.data || []);

//         // Fetch roles
//         const roleResponse = await axios.get(
//           `${import.meta.env.VITE_BASE_URL}/roles/fetch-all-roles` // Adjust endpoint as needed
//         );
//         setRoles(roleResponse.data.data || []);
//       } catch (err) {
//         console.error("Error fetching data:", err);
//         setError("Failed to load locations or roles. Please try again.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   // Filter transactions
//   const filteredTransactions = mockTransactions.filter((txn) => {
//     const matchType =
//       transactionType === "all" || txn.type.toLowerCase().includes(transactionType.toLowerCase());
//     const matchUser =
//       userType === "all" || txn.user.type.toLowerCase().includes(userType.toLowerCase());
//     const matchLocation =
//       selectedLocation === "all" || txn.location.toLowerCase().includes(selectedLocation.toLowerCase());
//     const matchSearch =
//       search.trim() === "" ||
//       txn.id.toLowerCase().includes(search.toLowerCase()) ||
//       txn.user.name.toLowerCase().includes(search.toLowerCase());
//     return matchType && matchUser && matchLocation && matchSearch;
//   });

//   if (loading) {
//     return <div className="p-6">Loading...</div>;
//   }

//   if (error) {
//     return <div className="p-6 text-red-500">{error}</div>;
//   }

//   return (
//     <div className="p-6 space-y-6">
//       <h1 className="text-3xl font-bold text-[#00004D]">Transaction History</h1>
//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
//         {stats.map((s) => {
//           const Icon = s.icon;
//           return (
//             <Card
//               key={s.label}
//               className="border-l-4 p-4"
//               style={{ borderLeftColor: s.color }}
//             >
//               <CardContent className="p-0">
//                 <div className="flex justify-between items-start">
//                   <div>
//                     <CardTitle className="text-sm font-medium text-muted-foreground">
//                       {s.label}
//                     </CardTitle>
//                     <div className="text-2xl font-bold mt-2">
//                       {s.label.includes("Revenue") || s.label.includes("Value") || s.label === "Refunds"
//                         ? `₹${s.value.toLocaleString()}`
//                         : s.value.toLocaleString()}
//                     </div>
//                     <p className={`text-sm mt-1 ${s.positive ? "text-green-600" : "text-red-500"}`}>
//                       {s.change} from last month
//                     </p>
//                   </div>
//                   <Icon
//                     className="size-6 p-1 rounded-full"
//                     style={{
//                       color: s.color,
//                       backgroundColor: `${s.color}20`,
//                     }}
//                   />
//                 </div>
//               </CardContent>
//             </Card>
//           );
//         })}
//       </div>

//       <Card>
//         <CardContent className="p-6">
//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-lg font-semibold">Transaction Overview</h2>
//             <ToggleGroup type="single" value={quickFilter} onValueChange={setQuickFilter}>
//               {["day", "week", "month", "year"].map((val) => (
//                 <ToggleGroupItem key={val} value={val} className="capitalize">
//                   {val}
//                 </ToggleGroupItem>
//               ))}
//             </ToggleGroup>
//           </div>
//           <ResponsiveContainer width="100%" height={300}>
//             <BarChart data={chartData[quickFilter] || []}>
//               <XAxis dataKey="label" />
//               <YAxis />
//               <Tooltip formatter={(value) => `₹${value}`} />
//               <Legend />
//               <Bar
//                 dataKey="transactions"
//                 fill="#4f46e5"
//                 name="Transactions"
//                 radius={[10, 10, 0, 0]}
//                 barSize={30}
//               />
//               <Bar
//                 dataKey="refunds"
//                 fill="#ef4444"
//                 name="Refunds"
//                 radius={[10, 10, 0, 0]}
//                 barSize={30}
//               />
//               <Bar
//                 dataKey="topups"
//                 fill="#10b981"
//                 name="Top-ups"
//                 radius={[10, 10, 0, 0]}
//                 barSize={30}
//               />
//             </BarChart>
//           </ResponsiveContainer>
//         </CardContent>
//       </Card>

//       {/* Filters */}
//       <Card>
//         <CardContent className="p-6 space-y-4">
//           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
//             <h2 className="text-lg font-semibold">All Transactions</h2>
//             <div className="flex flex-wrap gap-2">
//               <Button className="bg-[#00004D] text-white flex items-center gap-2 text-sm px-3 py-2">
//                 <Download className="size-4" />
//                 Export
//               </Button>
//             </div>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//             <Select value={transactionType} onValueChange={setTransactionType}>
//               <SelectTrigger className="w-full">
//                 <SelectValue placeholder="Transaction Type" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Types</SelectItem>
//                 <SelectItem value="Credit">Credit</SelectItem>
//                 <SelectItem value="Refund">Refund</SelectItem>
//                 <SelectItem value="TopUp">TopUp</SelectItem>
//                 <SelectItem value="Transfer">Transfer</SelectItem>
//               </SelectContent>
//             </Select>

//             <Select value={userType} onValueChange={setUserType}>
//               <SelectTrigger className="w-full">
//                 <SelectValue placeholder="User Type" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Users</SelectItem>
//                 {roles.map((role) => (
//                   <SelectItem key={role._id} value={role.name.toLowerCase()}>
//                     {role.name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>

//             <Select value={selectedLocation} onValueChange={setSelectedLocation}>
//               <SelectTrigger className="w-full">
//                 <SelectValue placeholder="Select Location" />
//               </SelectTrigger>
//               <SelectContent>
//                 <SelectItem value="all">All Locations</SelectItem>
//                 {locations.map((loc) => (
//                   <SelectItem key={loc._id} value={loc.name.toLowerCase()}>
//                     {loc.name}
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>

//             <Input
//               className="w-full"
//               placeholder="Search by name, transaction ID..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//             />
//           </div>

//           {/* Date Range Picker */}
//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//             <div className="flex flex-col gap-1">
//               <Label htmlFor="from-date" className="text-sm px-1">
//                 From Date
//               </Label>
//               <Popover open={openFrom} onOpenChange={setOpenFrom}>
//                 <PopoverTrigger asChild>
//                   <Button
//                     variant="outline"
//                     id="from-date"
//                     className="w-full justify-between font-normal"
//                   >
//                     {fromDate ? format(fromDate, "dd-MM-yyyy") : "Select date"}
//                     <ChevronDownIcon className="ml-2 h-4 w-4 text-muted-foreground" />
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-auto p-0" align="start">
//                   <Calendar
//                     mode="single"
//                     captionLayout="dropdown"
//                     selected={fromDate}
//                     onSelect={(date) => {
//                       setFromDate(date);
//                       setOpenFrom(false);
//                     }}
//                     fromYear={2000}
//                     toYear={2030}
//                   />
//                 </PopoverContent>
//               </Popover>
//             </div>

//             <div className="flex flex-col gap-1">
//               <Label htmlFor="to-date" className="text-sm px-1">
//                 To Date
//               </Label>
//               <Popover open={openTo} onOpenChange={setOpenTo}>
//                 <PopoverTrigger asChild>
//                   <Button
//                     variant="outline"
//                     id="to-date"
//                     className="w-full justify-between font-normal"
//                   >
//                     {toDate ? format(toDate, "dd-MM-yyyy") : "Select date"}
//                     <ChevronDownIcon className="ml-2 h-4 w-4 text-muted-foreground" />
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-auto p-0" align="start">
//                   <Calendar
//                     mode="single"
//                     captionLayout="dropdown"
//                     selected={toDate}
//                     onSelect={(date) => {
//                       setToDate(date);
//                       setOpenTo(false);
//                     }}
//                     fromYear={2000}
//                     toYear={2030}
//                   />
//                 </PopoverContent>
//               </Popover>
//             </div>
//           </div>

//           <div className="flex flex-wrap items-center gap-2 pt-2">
//             <span className="font-bold">Quick Filter :</span>
//             {[
//               "Today",
//               "Yesterday",
//               "Last 7 Days",

//             ].map((filter) => (
//               <Button
//                 key={filter}
//                 variant={quickFilter === filter ? "default" : "outline"}
//                 size="sm"
//                 className={quickFilter === filter ? "bg-[#00004D] text-white" : ""}
//                 onClick={() => setQuickFilter(filter)}
//               >
//                 {filter}
//               </Button>
//             ))}
//           </div>

//           <div className="overflow-x-auto">
//             <Table>
//               <TableHeader>
//                 <TableRow>
//                   <TableHead>Date & Time</TableHead>
//                   <TableHead>Transaction ID</TableHead>
//                   <TableHead>User</TableHead>
//                   <TableHead>Type</TableHead>
//                   <TableHead>Description</TableHead>
//                   <TableHead>Location</TableHead>
//                   <TableHead className="text-right">Amount</TableHead>
//                 </TableRow>
//               </TableHeader>
//               <TableBody>
//                 {filteredTransactions.map((txn) => (
//                   <TableRow key={txn.id}>
//                     <TableCell>{txn.datetime}</TableCell>
//                     <TableCell className="font-semibold">{txn.id}</TableCell>
//                     <TableCell>
//                       <div className="font-medium">{txn.user.name}</div>
//                       <div className="text-xs text-muted-foreground">{txn.user.type}</div>
//                     </TableCell>
//                     <TableCell>
//                       <span className="capitalize rounded px-2 py-1 text-xs font-medium bg-gray-100">
//                         {txn.type}
//                       </span>
//                     </TableCell>
//                     <TableCell>{txn.description}</TableCell>
//                     <TableCell>{txn.location}</TableCell>
//                     <TableCell className="text-right font-semibold">
//                       {txn.amount < 0 ? (
//                         <span className="text-red-500">- ₹{Math.abs(txn.amount)}</span>
//                       ) : (
//                         <span className="text-green-600">+ ₹{txn.amount}</span>
//                       )}
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </div>

//           <div className="pt-4 float-end">
//             <Pagination>
//               <PaginationContent>
//                 <PaginationItem>
//                   <PaginationPrevious href="#" />
//                 </PaginationItem>
//                 <PaginationItem>
//                   <PaginationLink href="#">1</PaginationLink>
//                 </PaginationItem>
//                 <PaginationItem>
//                   <PaginationLink href="#" isActive>
//                     2
//                   </PaginationLink>
//                 </PaginationItem>
//                 <PaginationItem>
//                   <PaginationLink href="#">3</PaginationLink>
//                 </PaginationItem>
//                 <PaginationItem>
//                   <PaginationNext href="#" />
//                 </PaginationItem>
//               </PaginationContent>
//             </Pagination>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }



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
  Download,
  ChevronDownIcon,
  Pencil,
  Save,
} from "lucide-react";
import { useState, useEffect } from "react";
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
import { useAuth } from "@/context/AuthContext"; // Assuming you have an AuthContext

export default function TransactionHistory() {
  const { user } = useAuth(); // Get logged-in user from AuthContext
  const [transactionType, setTransactionType] = useState("all");
  const [userType, setUserType] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [locations, setLocations] = useState([]);
  const [roles, setRoles] = useState([]);
  const [fromDate, setFromDate] = useState(undefined);
  const [toDate, setToDate] = useState(undefined);
  const [search, setSearch] = useState("");
  const [quickFilter, setQuickFilter] = useState("last 7 days");
  const [chartView, setChartView] = useState("daily");
  const [openTo, setOpenTo] = useState(false);
  const [openFrom, setOpenFrom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    totalRevenue: 0,
    avgTransactionValue: 0,
    totalRefunds: 0,
  });
  const [chartData, setChartData] = useState({ hourly: [], daily: [], weekly: [] });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalPages: 1,
    totalTransactions: 0,
  });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("xlsx");
  const [editingTransactionId, setEditingTransactionId] = useState(null);
  const [editFormData, setEditFormData] = useState({
    amount: "",
    transaction_type: "",
    payment_method: "",
    status: "",
    remarks: "",
    location_id: "",
  });

  // Fetch data (locations, roles, transactions)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const locationResponse = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/locations/fetch-all-locations`
        );
        setLocations(locationResponse.data.data || []);

        const roleResponse = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/roles/fetch-all-roles`
        );
        setRoles(roleResponse.data.data || []);

        const params = {
          transactionType,
          userType,
          location: selectedLocation,
          fromDate: fromDate ? format(fromDate, "yyyy-MM-dd") : undefined,
          toDate: toDate ? format(toDate, "yyyy-MM-dd") : undefined,
          quickFilter: fromDate || toDate ? undefined : quickFilter,
          search,
          page: pagination.page,
          limit: pagination.limit,
        };
        const transactionResponse = await axios.get(
          `${import.meta.env.VITE_BASE_URL}/transactions/history`,
          { params }
        );
        setTransactions(transactionResponse.data.transactions || []);
        setStats(transactionResponse.data.stats || {
          totalTransactions: 0,
          totalRevenue: 0,
          avgTransactionValue: 0,
          totalRefunds: 0,
        });
        setChartData(transactionResponse.data.chartData || { hourly: [], daily: [], weekly: [] });
        setPagination(transactionResponse.data.pagination || {
          page: 1,
          limit: 10,
          totalPages: 1,
          totalTransactions: 0,
        });
      } catch (err) {
        console.error("Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [
    transactionType,
    userType,
    selectedLocation,
    fromDate,
    toDate,
    quickFilter,
    search,
    pagination.page,
    pagination.limit,
  ]);

  // Handle edit button click
  const handleEditClick = (txn) => {
    setEditingTransactionId(txn.id);
    setEditFormData({
      amount: txn.amount.toString(),
      transaction_type: txn.type,
      payment_method: txn.payment_method || "",
      status: txn.status || "Pending",
      remarks: txn.remarks || "",
      location_id: txn.location_id || "",
    });
  };

  // Handle save button click
  const handleSaveEdit = async (transactionId) => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/transactions/update-transaction/${transactionId}`,
        {
          ...editFormData,
          edited_by_id: user._id, // From useAuth
        }
      );
      if (response.data.success) {
        setTransactions((prev) =>
          prev.map((txn) =>
            txn.id === transactionId
              ? {
                ...txn,
                amount: parseFloat(editFormData.amount),
                type: editFormData.transaction_type,
                payment_method: editFormData.payment_method,
                status: editFormData.status,
                remarks: editFormData.remarks,
                location_id: editFormData.location_id,
                edited_at: new Date(),
              }
              : txn
          )
        );
        setEditingTransactionId(null);
        setEditFormData({
          amount: "",
          transaction_type: "",
          payment_method: "",
          status: "",
          remarks: "",
          location_id: "",
        });
      }
    } catch (err) {
      console.error("Error updating transaction:", err);
      setError("Failed to update transaction. Please try again.");
    }
  };

  // Export functions
  const exportToExcel = () => {
    const data = transactions.map((txn) => ({
      "Date & Time": txn.datetime,
      "Transaction ID": txn.id,
      "User Name": txn.user.name,
      "User Type": txn.user.type,
      Type: txn.type,
      Description: txn.description,
      Location: txn.location,
      Amount: txn.amount < 0 ? `-₹${Math.abs(txn.amount)}` : `₹${txn.amount}`,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(file, `transactions_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const exportToCSV = () => {
    const data = transactions.map((txn) => ({
      "Date & Time": txn.datetime,
      "Transaction ID": txn.id,
      "User Name": txn.user.name,
      "User Type": txn.user.type,
      Type: txn.type,
      Description: txn.description,
      Location: txn.location,
      Amount: txn.amount < 0 ? `-₹${Math.abs(txn.amount)}` : `₹${txn.amount}`,
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const csv = XLSX.utils.sheet_to_csv(ws);
    const file = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(file, `transactions_${format(new Date(), "yyyy-MM-dd")}.csv`);
  };

  const exportToPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text("Transaction History", 14, 20);
      autoTable(doc, {
        startY: 30,
        head: [["Date & Time", "Transaction ID", "User Name", "User Type", "Type", "Description", "Location", "Amount"]],
        body: transactions.map((txn) => [
          txn.faktiskt || "N/A",
          txn.id || "N/A",
          txn.user?.name || "Unknown",
          txn.user?.type || "Unknown",
          txn.type || "N/A",
          txn.description || "N/A",
          txn.location || "N/A",
          txn.amount < 0 ? `-₹${Math.abs(txn.amount) || 0}` : `₹${txn.amount || 0}`,
        ]),
        theme: "grid",
        styles: { fontSize: 8 },
        headStyles: { fillColor: [0, 0, 77], textColor: [255, 255, 255] },
        margin: { top: 30 },
      });
      doc.save(`transactions_${format(new Date(), "yyyy-MM-dd")}.pdf`);
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

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold text-[#00004D]">Transaction History</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Transactions", value: stats.totalTransactions, icon: ClipboardList, color: "#4f46e5" },
          { label: "Total Revenue", value: stats.totalRevenue, icon: DollarSign, color: "#22c55e" },
          { label: "Avg. Transaction Value", value: stats.avgTransactionValue, icon: BarChart2, color: "#a855f7" },
          { label: "Refunds", value: stats.totalRefunds, icon: BadgeX, color: "#eab308" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <Card
              key={s.label}
              className="border-l-4 p-4"
              style={{ borderLeftColor: s.color }}
            >
              <CardContent className="p-0">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {s.label}
                    </CardTitle>
                    <div className="text-2xl font-bold mt-2">
                      {s.label.includes("Revenue") || s.label.includes("Value") || s.label === "Refunds"
                        ? `₹${s.value.toLocaleString()}`
                        : s.value.toLocaleString()}
                    </div>
                  </div>
                  <Icon
                    className="size-6 p-1 rounded-full"
                    style={{
                      color: s.color,
                      backgroundColor: `${s.color}20`,
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
            <ToggleGroup type="single" value={chartView} onValueChange={setChartView}>
              {["hourly", "daily", "weekly"].map((val) => (
                <ToggleGroupItem key={val} value={val} className="capitalize">
                  {val}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
          {chartData[chartView]?.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData[chartView]}>
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => `₹${value}`} />
                <Legend />
                <Bar
                  dataKey="transactions"
                  fill="#4f46e5"
                  name="Transactions"
                  radius={[10, 10, 0, 0]}
                  barSize={30}
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
          ) : (
            <div className="text-center text-muted-foreground h-[300px] flex items-center justify-center">
              No data available for {chartView} view
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-lg font-semibold">All Transactions</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                className="bg-[#00004D] text-white flex items-center gap-2 text-sm px-3 py-2"
                onClick={() => setIsExportModalOpen(true)}
                aria-label="Export transactions"
              >
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
                <SelectItem value="Credit">Credit</SelectItem>
                <SelectItem value="Refund">Refund</SelectItem>
                <SelectItem value="TopUp">TopUp</SelectItem>
                <SelectItem value="Transfer">Transfer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={userType} onValueChange={setUserType}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role._id} value={role.name}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {locations.map((loc) => (
                  <SelectItem key={loc._id} value={loc._id}>
                    {loc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              className="w-full"
              placeholder="Search by name, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <Label htmlFor="from-date" className="text-sm">
                From Date
              </Label>
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
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    captionLayout="vertical"
                    selected={fromDate}
                    onSelect={(date) => {
                      setFromDate(date);
                      setOpenFrom(false);
                      setQuickFilter("");
                    }}
                    fromYear={2000}
                    toYear={2030}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1">
              <Label htmlFor="to-date" className="text-sm">
                To Date
              </Label>
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
                <PopoverContent className="w-auto p-0" align="center">
                  <Calendar
                    mode="single"
                    captionLayout="vertical"
                    selected={toDate}
                    onSelect={(date) => {
                      setToDate(date);
                      setOpenTo(false);
                      setQuickFilter("");
                    }}
                    fromYear={2000}
                    toYear={2030}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-2">
            <span className="font-bold">Quick Filter:</span>
            {["Today", "Yesterday", "Last 7 Days"].map((filter) => (
              <Button
                key={filter}
                variant={quickFilter === filter.toLowerCase() ? "default" : "outline"}
                size="sm"
                className={quickFilter === filter.toLowerCase() ? "bg-[#00004D] text-white" : ""}
                onClick={() => {
                  setQuickFilter(filter.toLowerCase());
                  setFromDate(undefined);
                  setToDate(undefined);
                }}
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
                  {/* <TableHead className="text-right">Actions</TableHead> */}
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((txn) => (
                  <TableRow key={txn.id}>
                    <TableCell>{txn.datetime}</TableCell>
                    <TableCell className="font-semibold">{txn.id}</TableCell>
                    <TableCell>
                      <div className="font-medium">{txn.user.name}</div>
                      <div className="text-xs text-muted-foreground">{txn.user.type}</div>
                    </TableCell>
                    <TableCell>
                      {editingTransactionId === txn.id ? (
                        <Select
                          value={editFormData.transaction_type}
                          onValueChange={(value) =>
                            setEditFormData((prev) => ({ ...prev, transaction_type: value }))
                          }
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {["Transfer", "TopUp", "Refund", "Credit"].map((type) => (
                              <SelectItem key={type} value={type}>
                                {type}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="capitalize rounded px-2 py-1 text-xs font-medium bg-gray-100">
                          {txn.type}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {editingTransactionId === txn.id ? (
                        <Input
                          value={editFormData.remarks}
                          onChange={(e) =>
                            setEditFormData((prev) => ({ ...prev, remarks: e.target.value }))
                          }
                          placeholder="Enter remarks"
                        />
                      ) : (
                        txn.description
                      )}
                    </TableCell>
                    <TableCell>
                      {editingTransactionId === txn.id ? (
                        <Select
                          value={editFormData.location_id}
                          onValueChange={(value) =>
                            setEditFormData((prev) => ({ ...prev, location_id: value }))
                          }
                        >
                          <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Select Location" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map((loc) => (
                              <SelectItem key={loc._id} value={loc._id}>
                                {loc.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        txn.location
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {editingTransactionId === txn.id ? (
                        <Input
                          type="number"
                          value={editFormData.amount}
                          onChange={(e) =>
                            setEditFormData((prev) => ({ ...prev, amount: e.target.value }))
                          }
                          placeholder="Enter amount"
                        />
                      ) : txn.amount < 0 ? (
                        <span className="text-red-500">- ₹{Math.abs(txn.amount)}</span>
                      ) : (
                        <span className="text-green-600">+ ₹{txn.amount}</span>
                      )}
                    </TableCell>
                    {/* <TableCell className="text-right">
                      {editingTransactionId === txn.id ? (
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleSaveEdit(txn.id)}
                          aria-label="Save transaction"
                        >
                          <Save className="size-4 mr-2" />
                          Save
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(txn)}
                          aria-label="Edit transaction"
                        >
                          <Pencil className="size-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </TableCell> */}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="pt-4 w-full overflow-x-auto">
            <div className="min-w-[300px] whitespace-nowrap flex justify-end">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.max(prev.page - 1, 1),
                        }))
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: pagination.totalPages || 1 }, (_, i) => i + 1).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink
                        href="#"
                        isActive={p === pagination.page}
                        onClick={() => setPagination((prev) => ({ ...prev, page: p }))}
                      >
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          page: Math.min(prev.page + 1, pagination.totalPages),
                        }))
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>

        </CardContent>
      </Card>

      <Dialog open={isExportModalOpen} onOpenChange={setIsExportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Transactions</DialogTitle>
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
    </div>
  );
}
