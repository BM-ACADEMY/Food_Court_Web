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
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-2xl lg:max-w-4xl xl:max-w-6xl w-full h-[90vh] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Admin Details - #{adminData?.id}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="info">User Information</TabsTrigger>
            <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          </TabsList>

          {/* User Information Tab */}
          <TabsContent value="info" className="space-y-4 w-full">
            <div className="flex items-center space-x-4 mb-4">
              <Avatar className="h-15 w-15">
                <AvatarImage src={adminData.avatar || undefined} />
                <AvatarFallback className="bg-blue-700 text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-xl font-semibold">{adminData.name}</h2>
                <p className="text-gray-500">#{adminData.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            {error && <p className="text-red-500">{error}</p>}
            <div className="flex justify-end gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save</Button>
                </>
              ) : (
                <Button onClick={() => handleEdit(adminData)}>Edit Information</Button>
              )}
            </div>
          </TabsContent>

          {/* Transaction History Tab */}
          <TabsContent value="transactions" className="space-y-4 w-full">
           <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[150px] sm:w-[180px]">
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
            {loading && <p className="text-center text-gray-600">Loading transactions...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}
            {!loading && !error && (
              <>
                <div className="overflow-x-auto w-full">
                  <Table className="min-w-[1000px] table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="whitespace-nowrap">Transaction ID</TableHead>
                        <TableHead className="whitespace-nowrap">Type</TableHead>
                        <TableHead className="whitespace-nowrap">Amount</TableHead>
                        <TableHead className="whitespace-nowrap">Date</TableHead>
                        <TableHead className="whitespace-nowrap">Description</TableHead>
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
                            {transaction.date && !isNaN(new Date(transaction.date).getTime())
                              ? format(new Date(transaction.date), "dd-MM-yyyy HH:mm")
                              : "N/A"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {transaction.description || "N/A"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {currentTransactions.length === 0 && (
                    <p className="text-center text-gray-600 mt-4">
                      No transactions found for the selected filter.
                    </p>
                  )}
                </div>
                {totalPages > 1 && (
                  <Pagination className="mt-4">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        />
                      </PaginationItem>
                      {[...Array(totalPages)].map((_, index) => (
                        <PaginationItem key={index + 1}>
                          <PaginationLink
                            onClick={() => handlePageChange(index + 1)}
                            isActive={currentPage === index + 1}
                          >
                            {index + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminDetailsModal;