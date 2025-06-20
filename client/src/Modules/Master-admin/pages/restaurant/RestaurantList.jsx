import {
    Input
} from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { CalendarIcon, QrCode, Users, Wifi, Wallet, ChevronDownIcon, Search, Download, Eye, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardTitle } from "@/components/ui/card"
import { useState, useMemo } from "react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious
} from "@/components/ui/pagination"


// Mock dynamic customer data
const mockCustomers = Array.from({ length: 1247 }, (_, i) => ({
    id: `REST-${1001 + i}`,
    name: ["Rahul Sharma", "Priya Mehta", "Amit Kumar", "Neha Gupta", "Vikram Singh"][i % 5],
    category: `+91 98765 4321${i % 10}`,
    balance: Math.floor(Math.random() * 4000 + 500),
    status: i % 3 === 0 ? "Offline" : "Online",
    lastActive: ["Just now", "5 mins ago", "15 mins ago", "2 hours ago", "Yesterday"][i % 5]
}))
export default function RestaurantList() {
    const [search, setSearch] = useState("")
    const [status, setStatus] = useState("all")
    const [lastActive, setLastActive] = useState("all")
    const [sortBy, setSortBy] = useState("asc")
    const [regDate, setRegDate] = useState("")
    const [open, setOpen] = useState(false)
    const [date, setDate] = useState(undefined)
    const [page, setPage] = useState(1)
    const pageSize = 10
    const totalPages = Math.ceil(mockCustomers.length / pageSize)

    const paginatedCustomers = mockCustomers.slice((page - 1) * pageSize, page * pageSize)




    // Filtered & sorted data
    const filteredCustomers = useMemo(() => {
        return mockCustomers
            .filter((c) => {
                const matchSearch =
                    c.name.toLowerCase().includes(search.toLowerCase()) ||
                    c.phone.includes(search) ||
                    c.id.toLowerCase().includes(search.toLowerCase())

                const matchStatus = status === "all" || c.status === status

                const matchLastActive =
                    lastActive === "all" ||
                    (lastActive === "today" && c.lastActive === "2024-06-20") ||
                    (lastActive === "week" &&
                        new Date(c.lastActive) >=
                        new Date(new Date().setDate(new Date().getDate() - 7))) ||
                    (lastActive === "month" &&
                        new Date(c.lastActive) >=
                        new Date(new Date().setMonth(new Date().getMonth() - 1)))

                const matchReg =
                    !regDate || c.registered === new Date(regDate).toISOString().split("T")[0]

                return matchSearch && matchStatus && matchLastActive && matchReg
            })
            .sort((a, b) =>
                sortBy === "asc"
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name)
            )
    }, [search, status, lastActive, sortBy, regDate])

    const totalBalance = filteredCustomers.reduce((acc, c) => acc + c.balance, 0)
    const onlineCount = filteredCustomers.filter((c) => c.status === "online").length

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold text-[#00004D]">Restaurant User Check</h2>

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

                    <Button className="bg-[#00004D] text-white flex items-center gap-2 flex-1/5">
                        <QrCode className="size-4" />
                        Scan QR Code
                    </Button>
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
                                <SelectItem value="all">All Restaurant</SelectItem>
                                <SelectItem value="online">Online</SelectItem>
                                <SelectItem value="offline">Offline</SelectItem>
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
                                        setDate(selectedDate)
                                        setOpen(false)
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
                                <SelectItem value="high-balance">Balance (High–Low)</SelectItem>
                                <SelectItem value="low-balance">Balance (Low–High)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <Card className="border-l-4 border-green-400">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <CardTitle className="text-muted-foreground text-sm">Total Restaurant</CardTitle>
                            <div className="text-2xl font-bold mt-1">{filteredCustomers.length}</div>
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
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Restaurant List</h2>
                <Button className="bg-[#00004D] text-white">
                    <Download className="mr-2 h-4 w-4" /> Export List
                </Button>
            </div>

            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Restaurant ID</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Sales</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Last Active</TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedCustomers.map((cust) => (
                            <TableRow key={cust.id}>
                                <TableCell className="font-medium">#{cust.id}</TableCell>
                                <TableCell>{cust.name}</TableCell>
                                <TableCell>{cust.phone}</TableCell>
                                <TableCell>₹ {cust.balance.toLocaleString()}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant="ghost"
                                        className={`text-white ${cust.status.toLowerCase() === "online" ? "bg-green-500" : "bg-red-500"
                                            }`}
                                    >
                                        {cust.status}
                                    </Badge>

                                </TableCell>
                                <TableCell>{cust.lastActive}</TableCell>
                                <TableCell className="flex gap-2">
                                    <Button variant="link" className="text-blue-600 p-0 h-auto text-sm">
                                        <Eye className="mr-1 h-4 w-4" /> View
                                    </Button>
                                    <Button variant="link" className="text-green-600 p-0 h-auto text-sm">
                                        <Pencil className="mr-1 h-4 w-4" /> Edit
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, mockCustomers.length)} of {mockCustomers.length} customers
                </p>
                <div className="float-end">
                    <Pagination>
                        <PaginationContent>
                            <PaginationItem>
                                <PaginationPrevious
                                    href="#"
                                    onClick={(e) => {
                                        e.preventDefault()
                                        setPage((p) => Math.max(1, p - 1))
                                    }}
                                />
                            </PaginationItem>
                            {[...Array(Math.min(totalPages, 5))].map((_, i) => (
                                <PaginationItem key={i}>
                                    <PaginationLink
                                        href="#"
                                        isActive={page === i + 1}
                                        onClick={(e) => {
                                            e.preventDefault()
                                            setPage(i + 1)
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
                                        e.preventDefault()
                                        setPage((p) => Math.min(totalPages, p + 1))
                                    }}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            </div>
        </div>
    )
}
