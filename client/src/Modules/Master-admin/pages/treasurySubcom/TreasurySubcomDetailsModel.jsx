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

const TreasurySubcomDetailsModal = ({ subcom, isOpen, onClose }) => {
  const [subcomData, setSubcomData] = useState(subcom || {});
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: subcom?.name || "",
    phone: subcom?.phone || "",
    email: subcom?.email || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [isEditingId, setIsEditingId] = useState("");
  const [locations, setLocations] = useState([]);
  const [upis, setUpis] = useState([]);
  const [locationId, setLocationId] = useState("");
  const [upiId, setUpiId] = useState("");
  const itemsPerPage = 5;

  const handleReset = () => {
    setLocationId("");
    setUpiId("");
    setFilter("all");
  }
  const fetchLocationsAndUpi = async () => {
    setLoading(true);
    try {
      const locationRes = await axios.get(`${import.meta.env.VITE_BASE_URL}/locations/fetch-all-locations`);
      setLocations(locationRes.data.data);

      const upiRes = await axios.get(`${import.meta.env.VITE_BASE_URL}/upis/fetch-all-upis`);
      setUpis(upiRes.data.data);
    } catch (err) {
      console.error("Error fetching locations or UPIs:", err);
      setError("Failed to load locations or UPIs. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && subcom?.id) {
      fetchSubcomDetails();
      fetchTransactions();
    }
  }, [isOpen, subcom?.id, locationId, upiId]);

  useEffect(() => {
    fetchLocationsAndUpi();
  }, []);

  const fetchSubcomDetails = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/treasurySubcom/fetch-single-treasurysubcom-details/${subcom.id}`
      );
      setSubcomData(response.data);
      setFormData({
        name: response.data.name || "",
        phone: response.data.phone || "",
        email: response.data.email || "",
      });
      setIsEditingId(response.data.user_id || "");
      setError(null);
    } catch (err) {
      console.error("Error fetching treasury subcom details:", err);
      setError("Failed to load subcom details. Please try again.");
    }
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/treasurySubcom/fetch-single-treasurysubcom-transactions/${subcom.id}/transactions`,
        {
          params: { location_id: locationId, upi_id: upiId },
        }
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

  const handleEdit = () => {
    setIsEditing(true);
    setIsEditingId(subcomData.user_id || subcom.id);
    setFormData({
      name: subcomData.name || "",
      phone: subcomData.phone || "",
      email: subcomData.email || "",
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
      setSubcomData((prev) => ({
        ...prev,
        name: response.data.name,
        phone: response.data.phone_number,
        email: response.data.email,
      }));
      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error("Error updating treasury subcom:", err);
      setError("Failed to update subcom information. Please try again.");
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
    let filtered = transactions;

    if (filter !== "all") {
      filtered = filtered.filter((tx) => tx.type === filter);
    }

    // if (locationId !== "all") {
    //   filtered = filtered.filter((tx) => tx.locationId === locationId);
    // }

    // if (upiId !== "all") {
    //   filtered = filtered.filter((tx) => tx.upiId === upiId);
    // }

    setFilteredTransactions(filtered);
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

  const initials = subcomData.name
    ? subcomData.name
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
<DialogTitle className="text-lg sm:text-xl">Treasury Subcom Details - #{subcomData?.id}</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="flex flex-col sm:flex-row w-full gap-2 mb-4">
            <TabsTrigger value="info" className="text-xs sm:text-sm">User Information</TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs sm:text-sm">Transaction History</TabsTrigger>
          </TabsList>

          {/* User Information Tab */}
          <TabsContent value="info" className="space-y-4 overflow-y-hidden">
           <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <Avatar className="h-12 w-12 sm:h-16 sm:w-16">
                <AvatarImage src={subcomData.avatar || undefined} />
                <AvatarFallback className="bg-blue-700 text-white text-sm sm:text-base">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-lg sm:text-xl font-semibold">{subcomData.name}</h2>
                <p className="text-gray-500 text-sm">#{subcomData.id}</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Badge
                  variant="ghost"
                  className={`text-white mt-1 ${subcomData.status?.toLowerCase() === "online" ? "bg-green-500" : "bg-red-500"}`}
                >
                  {subcomData?.status}
                </Badge>
              </div>
              <div>
                <Label className="text-sm font-medium">Name</Label>
                {isEditing ? (
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 text-sm"
                  />
                ) : (
                  <p className="mt-1 text-gray-700 text-sm">{subcomData?.name || "N/A"}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Phone</Label>
                {isEditing ? (
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 text-sm"
                    type="tel"
                  />
                ) : (
                  <p className="mt-1 text-gray-700 text-sm">{subcomData?.phone || "N/A"}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                {isEditing ? (
                  <Input
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 text-sm"
                    type="email"
                  />
                ) : (
                  <p className="mt-1 text-gray-700 text-sm">{subcomData?.email || "N/A"}</p>
                )}
              </div>
              <div>
                <Label className="text-sm font-medium">Registration Date</Label>
                <p className="mt-1 text-gray-700 text-sm">
                  {subcomData?.registrationDate && !isNaN(new Date(subcomData.registrationDate).getTime())
                    ? format(new Date(subcomData.registrationDate), "MMM dd, yyyy")
                    : "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Last Active</Label>
                <p className="mt-1 text-gray-700 text-sm">
                  {subcomData?.lastActive && !isNaN(new Date(subcomData.lastActive).getTime())
                    ? formatDistanceToNow(new Date(subcomData.lastActive), { addSuffix: true })
                    : "N/A"}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Balance</Label>
                <p className="mt-1 text-gray-700 text-sm">
                  ₹{subcomData?.balance?.toLocaleString() || "0.00"}
                </p>
              </div>
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <div className="flex justify-end gap-2">
              {isEditing ? (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(false)} className="text-xs sm:text-sm">
                    Cancel
                  </Button>
                  <Button onClick={handleSave} className="text-xs sm:text-sm">Save</Button>
                </>
              ) : (
                <Button onClick={handleEdit} className="text-xs sm:text-sm">Edit Information</Button>
              )}
            </div>
          </TabsContent>

          {/* Transaction History Tab */}
          <TabsContent value="transactions" className="space-y-4 overflow-y-hidden">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mb-4">
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-[150px] sm:w-[180px]">
                  <SelectValue placeholder="Filter transactions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs sm:text-sm">All Transactions</SelectItem>
                  <SelectItem value="transfer" className="text-xs sm:text-sm">Transfer</SelectItem>
                  <SelectItem value="topup" className="text-xs sm:text-sm">Topup</SelectItem>
                  <SelectItem value="credit" className="text-xs sm:text-sm">Credit</SelectItem>
                  <SelectItem value="refund" className="text-xs sm:text-sm">Refund</SelectItem>
                </SelectContent>
              </Select>

              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger className="w-full sm:w-[160px] text-xs sm:text-sm">
                  <SelectValue placeholder="Filter by location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs sm:text-sm">All Locations</SelectItem>
                  {locations.map((loc) => (
                    <SelectItem key={loc._id} value={loc._id} className="text-xs sm:text-sm">
                      {loc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={upiId} onValueChange={setUpiId}>
                <SelectTrigger className="w-full sm:w-[160px] text-xs sm:text-sm">
                  <SelectValue placeholder="Filter by UPI" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs sm:text-sm">All UPIs</SelectItem>
                  {upis.map((upi) => (
                    <SelectItem key={upi._id} value={upi._id} className="text-xs sm:text-sm">
                      {upi.upiName} - ({upi.upiId})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="text-xs sm:text-sm" onClick={handleReset}>Reset</Button>
            </div>

            {/* Loading/Error */}
            {loading && <p className="text-center text-gray-600 text-sm">Loading transactions...</p>}
            {error && <p className="text-center text-red-500 text-sm">{error}</p>}

            {/* Transactions Table */}
            {!loading && !error && (
              <>
                <div className="overflow-y-auto min-h-[200px]">
                  {/* Mobile View: Card-like layout */}
                  {/* <div className="sm:hidden flex flex-col gap-4">
                    {currentTransactions.map((transaction) => (
                      <div key={transaction.id} className="border rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex flex-col gap-2">
                          <div className="flex justify-between">
                            <span className="font-medium text-xs">Transaction ID:</span>
                            <span className="text-xs">#{transaction.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-xs">Type:</span>
                            <span className="text-xs">{transactionTypes[transaction.type] || transaction.type}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-xs">Amount:</span>
                            <span className="text-xs">
                              ₹{transaction.amount.toLocaleString()}
                              {transaction.type === "transfer" && (
                                <span className="text-red-500"> (Debit)</span>
                              )}
                              {(transaction.type === "topup" || transaction.type === "credit") && (
                                <span className="text-green-500"> (Credit)</span>
                              )}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-xs">Date:</span>
                            <span className="text-xs">
                              {transaction.date && !isNaN(new Date(transaction.date).getTime())
                                ? format(new Date(transaction.date), "dd-MM-yyyy HH:mm")
                                : "N/A"}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium text-xs">Description:</span>
                            <span className="text-xs">{transaction.description || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div> */}

                  {/* Desktop View: Table layout */}
                 <Table className="min-w-[600px] sm:min-w-[800px] md:min-w-full table-fixed">
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
                          <TableCell className="whitespace-nowrap">#{transaction.id}</TableCell>
                          <TableCell className="whitespace-nowrap">
                            {transactionTypes[transaction.type] || transaction.type}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            ₹{transaction.amount.toLocaleString()}
                            {transaction.type === "transfer" && (
                              <span className="text-red-500"> (Debit)</span>
                            )}
                            {(transaction.type === "topup" || transaction.type === "credit") && (
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
                    <p className="text-center text-gray-600 mt-4 text-sm">
                      No transactions found for the selected filter.
                    </p>
                  )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination className="mt-4 flex justify-center sm:justify-start">
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                          className="text-xs sm:text-sm"
                        />
                      </PaginationItem>
                      {[...Array(totalPages)].map((_, index) => (
                        <PaginationItem key={index + 1}>
                          <PaginationLink
                            onClick={() => handlePageChange(index + 1)}
                            isActive={currentPage === index + 1}
                            className="text-xs sm:text-sm"
                          >
                            {index + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          className="text-xs sm:text-sm"
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
        <DialogFooter className="mt-4">
          <Button variant="default" onClick={onClose} className="text-xs sm:text-sm">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TreasurySubcomDetailsModal;