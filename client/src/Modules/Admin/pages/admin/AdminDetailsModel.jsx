import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import axios from "axios";
import { format, formatDistanceToNow } from "date-fns";

const AdminDetailsModal = ({ admin, isOpen, onClose }) => {
  const [adminData, setAdminData] = useState(admin || {});
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: admin?.name || "",
    phone: admin?.phone || "",
    email: admin?.email || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditingId, setIsEditingId] = useState("");
  const itemsPerPage = 5;

  useEffect(() => {
    if (isOpen && admin?.id) {
      fetchAdminDetails();
      fetchTransactions();
    }
  }, [isOpen, admin?.id]);

  const fetchAdminDetails = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/admins/fetch-single-admin-details/${
          admin.id
        }`
      );
      setAdminData(response.data);
      setFormData({
        name: response.data.name || "",
        phone: response.data.phone || "",
        email: response.data.email || "",
      });
      setIsEditingId(response.data.user_id || "");
      setError(null);
    } catch (err) {
      console.error("Error fetching admin details:", err);
      setError("Failed to load admin details. Please try again.");
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/admins/fetch-single-admins-transactions/${
          admin.id
        }/transactions`
      );

      setTransactions(response.data.data || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to load transaction history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (edit) => {
    setIsEditing(true);
    setIsEditingId(edit.user_id || admin.id);
    setFormData({
      name: adminData.name || "",
      phone: adminData.phone || "",
      email: adminData.email || "",
    });
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        setError("Name is required.");
        return;
      }
      if (!formData.phone.match(/^\d{10}$/)) {
        setError("Phone number must be 10 digits.");
        return;
      }
      if (!formData.email.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
        setError("Invalid email format.");
        return;
      }

      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/users/update-user`,
        {
          user_id: isEditingId,
          name: formData.name,
          phone_number: formData.phone,
          email: formData.email,
        }
      );
      setAdminData((prev) => ({
        ...prev,
        name: response.data.name,
        phone: response.data.phone_number,
        email: response.data.email,
      }));
      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error("Error updating admin:", err);
      setError("Failed to update admin information. Please try again.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const transactionTypes = {
    transfer: "Transfer to Restaurant",
    topup: "Top Up",
    refund: "Refund from Restaurant",
    credit: "Credit",
  };

  useEffect(() => {
    if (filter === "all") {
      setFilteredTransactions(transactions);
    } else {
      setFilteredTransactions(transactions.filter((tx) => tx.type === filter));
    }
    setCurrentPage(1);
  }, [filter, transactions]);

  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const initials = adminData.name
    ? adminData.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "XX";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
     <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-2xl lg:max-w-4xl xl:max-w-6xl w-full h-[90vh] max-h-[90vh] overflow-y-auto p-0 border-0 rounded-xl shadow-2xl">
        <DialogHeader className="bg-[#00004D] px-6 py-4 text-white">
          <DialogTitle className="text-xl sm:text-2xl font-bold tracking-wide">Admin Profile &middot; #{adminData?.id}</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6">
        <Tabs defaultValue="info" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg mb-4">
            <TabsTrigger value="info" className="data-[state=active]:bg-[#00004D] data-[state=active]:text-white rounded-md transition-all font-medium text-xs sm:text-sm">User Information</TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-[#00004D] data-[state=active]:text-white rounded-md transition-all font-medium text-xs sm:text-sm">Transaction History</TabsTrigger>
          </TabsList>

          {/* User Information Tab */}
          <TabsContent value="info" className="space-y-6 w-full mt-6 animate-in fade-in duration-300">
           <div className="flex flex-col sm:flex-row items-center gap-6 p-6 bg-blue-50/50 rounded-xl border border-blue-100 shadow-sm">
              <Avatar className="h-24 w-24 border-4 border-white shadow-md">
                <AvatarImage src={adminData.avatar || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-[#00004D] to-blue-600 text-white text-3xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold text-gray-900">{adminData.name}</h2>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                  <Badge variant="secondary" className="bg-white border-blue-200 text-blue-700">Admin</Badge>
                  <span className="text-sm font-medium text-gray-500">#{adminData.id}</span>
                </div>
              </div>
            </div>
            
            <Card className="border-gray-100 shadow-sm">
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Contact Details</h3>
                  {isEditing ? (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setIsEditing(false)} className="h-8 text-xs">
                        Cancel
                      </Button>
                      <Button size="sm" onClick={handleSave} className="h-8 text-xs bg-[#00004D] hover:bg-blue-900 text-white">Save</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => handleEdit(adminData)} className="h-8 text-xs border-gray-300 text-gray-700 hover:bg-gray-50">
                      Edit Information
                    </Button>
                  )}
                </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge
                  variant="ghost"
                  className={`text-white mt-1 ${
                    adminData?.status?.toLowerCase() === "online"
                      ? "bg-green-500"
                      : "bg-red-500"
                  }`}
                >
                  {adminData?.status}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Name</Label>
                {isEditing ? (
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                ) : (
                  <p className="mt-1 text-gray-600">{adminData?.name || "N/A"}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Phone</Label>
                {isEditing ? (
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1"
                    type="tel"
                  />
                ) : (
                  <p className="mt-1 text-gray-600">{adminData?.phone || "N/A"}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                {isEditing ? (
                  <Input
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1"
                    type="email"
                  />
                ) : (
                  <p className="mt-1 text-gray-600">{adminData?.email || "N/A"}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Registration Date</Label>
                <p className="mt-1 text-gray-600">
                  {adminData?.registrationDate && !isNaN(new Date(adminData.registrationDate).getTime())
                    ? format(new Date(adminData.registrationDate), "MMM dd, yyyy")
                    : "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Active</Label>
                <p className="mt-1 text-gray-600">
                  {adminData?.lastActive && !isNaN(new Date(adminData.lastActive).getTime())
                    ? formatDistanceToNow(new Date(adminData.lastActive), {
                        addSuffix: true,
                      })
                    : "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Balance</Label>
                <p className="mt-1 text-gray-600">
                  ₹{adminData?.balance?.toLocaleString() || "0.00"}
                </p>
              </div>
            </div>
            {error && <p className="text-red-500 mt-4 text-sm font-medium">{error}</p>}
            </CardContent>
            </Card>
          </TabsContent>

          {/* Transaction History Tab */}
          <TabsContent value="transactions" className="space-y-4 w-full mt-6 animate-in fade-in duration-300">
            <Card className="border-gray-100 shadow-sm overflow-hidden">
              <CardContent className="p-0 sm:p-6">
           <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 p-4 sm:p-0">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white border-gray-200 focus:ring-[#00004D]">
                  <SelectValue placeholder="Filter transactions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transactions</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="topup">Topup</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="refund">Refund</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {loading && <p className="text-center text-gray-500 py-10 text-sm">Loading transactions...</p>}
            {error && <p className="text-center text-red-500 py-10 text-sm">{error}</p>}
            {!loading && !error && (
              <div className="p-0">
                <div className="overflow-x-auto w-full">
                  <Table className="min-w-[800px] table-fixed">
                    <TableHeader className="bg-gray-50/80">
                      <TableRow className="border-gray-100 hover:bg-transparent">
                        <TableHead className="whitespace-nowrap font-semibold text-gray-600">Transaction ID</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold text-gray-600">Type</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold text-gray-600">Amount</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold text-gray-600">Sender</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold text-gray-600">Receiver</TableHead>
                        <TableHead className="whitespace-nowrap font-semibold text-gray-600">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="whitespace-nowrap">
                            #{transaction.id}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {transactionTypes[transaction.type] || transaction.type}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            ₹{transaction.amount.toLocaleString()}
                            {transaction.type === "transfer" && (
                              <span className="text-red-500"> (Debit)</span>
                            )}
                            {(transaction.type === "topup" ||
                              transaction.type === "credit") && (
                              <span className="text-green-500"> (Credit)</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{transaction.sender?.name || "N/A"}</span>
                              <span className="text-xs text-gray-500">{transaction.sender?.role || "N/A"} &middot; {transaction.sender?.user_id || "N/A"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-900">{transaction.receiver?.name || "N/A"}</span>
                              <span className="text-xs text-gray-500">{transaction.receiver?.role || "N/A"} &middot; {transaction.receiver?.user_id || "N/A"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {transaction.date && !isNaN(new Date(transaction.date).getTime())
                              ? format(new Date(transaction.date), "dd-MM-yyyy HH:mm")
                              : "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                      {currentTransactions.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-gray-500">
                            <div className="flex flex-col items-center justify-center">
                              <svg className="w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                              No transactions found for the selected filter.
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                {totalPages > 1 && (
                  <div className="p-4 border-t border-gray-100">
                  <Pagination className="flex justify-center sm:justify-start">
                    <PaginationContent className="flex-wrap gap-1">
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="cursor-pointer hover:text-[#00004D]"
                        />
                      </PaginationItem>
                      {[...Array(totalPages)].map((_, index) => (
                        <PaginationItem key={index + 1}>
                          <PaginationLink
                            onClick={() => handlePageChange(index + 1)}
                            isActive={currentPage === index + 1}
                            className={currentPage === index + 1 ? "bg-[#00004D] hover:bg-blue-900 text-white cursor-pointer" : "cursor-pointer"}
                          >
                            {index + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="cursor-pointer hover:text-[#00004D]"
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  </div>
                )}
              </div>
            )}
            </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
        <DialogFooter className="bg-gray-50 px-6 py-4 border-t border-gray-100 rounded-b-xl mt-0">
          <Button variant="outline" onClick={onClose} className="border-gray-300 font-medium">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminDetailsModal;