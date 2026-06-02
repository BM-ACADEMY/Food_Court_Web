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
import { Card, CardContent } from "@/components/ui/card";
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
     <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-2xl lg:max-w-4xl xl:max-w-6xl w-full h-[90vh] max-h-[90vh] overflow-y-auto p-0 border-0 rounded-xl shadow-2xl">
        <DialogHeader className="bg-[#00004D] px-6 py-4 text-white">
          <DialogTitle className="text-xl sm:text-2xl font-bold tracking-wide">Treasury Subcom Profile &middot; #{subcomData?.id}</DialogTitle>
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
                <AvatarImage src={subcomData.avatar || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-[#00004D] to-blue-600 text-white text-3xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="text-center sm:text-left">
                <h2 className="text-3xl font-bold text-[#00004D]">{subcomData.name}</h2>
                <div className="flex items-center justify-center sm:justify-start gap-3 mt-2">
                  <Badge variant="outline" className="bg-white px-3 py-1 font-mono text-xs shadow-sm border-blue-200 text-blue-700">
                    #{subcomData.id}
                  </Badge>
                  <Badge
                    variant="ghost"
                    className={`px-3 py-1 text-white text-xs font-semibold shadow-sm ${
                      subcomData.status?.toLowerCase() === "online"
                        ? "bg-emerald-500 hover:bg-emerald-600"
                        : "bg-rose-500 hover:bg-rose-600"
                    }`}
                  >
                    {subcomData?.status?.toUpperCase() || "N/A"}
                  </Badge>
                </div>
              </div>
            </div>

            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-1">
                <Label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Name</Label>
                {isEditing ? (
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 border-gray-300 focus-visible:ring-[#00004D]"
                  />
                ) : (
                  <p className="text-gray-900 font-medium text-lg">{subcomData?.name || "N/A"}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Phone</Label>
                {isEditing ? (
                  <Input
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 border-gray-300 focus-visible:ring-[#00004D]"
                    type="tel"
                  />
                ) : (
                  <p className="text-gray-900 font-medium text-lg">{subcomData?.phone || "N/A"}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Email</Label>
                {isEditing ? (
                  <Input
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 border-gray-300 focus-visible:ring-[#00004D]"
                    type="email"
                  />
                ) : (
                  <p className="text-gray-900 font-medium text-lg">{subcomData?.email || "N/A"}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Registration Date</Label>
                <p className="text-gray-900 font-medium text-lg">
                  {subcomData?.registrationDate && !isNaN(new Date(subcomData.registrationDate).getTime())
                    ? format(new Date(subcomData.registrationDate), "MMM dd, yyyy")
                    : "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Last Active</Label>
                <p className="text-gray-900 font-medium text-lg">
                  {subcomData?.lastActive && !isNaN(new Date(subcomData.lastActive).getTime())
                    ? formatDistanceToNow(new Date(subcomData.lastActive), { addSuffix: true })
                    : "N/A"}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-gray-500 uppercase font-semibold tracking-wider">Wallet Balance</Label>
                <p className="text-[#00004D] font-bold text-2xl">
                  ₹{subcomData?.balance?.toLocaleString() || "0.00"}
                </p>
              </div>
            </div>
            </CardContent>
            </Card>
            {error && <p className="text-red-500 bg-red-50 p-3 rounded-md text-sm mt-4">{error}</p>}
            <div className="flex justify-end gap-3 mt-4">
              {isEditing ? (
                <>
                  <Button variant="outline" className="border-gray-300" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button className="bg-[#00004D] hover:bg-blue-900 shadow-md" onClick={handleSave}>Save Changes</Button>
                </>
              ) : (
                <Button className="bg-[#00004D] hover:bg-blue-900 shadow-md" onClick={handleEdit}>Edit Information</Button>
              )}
            </div>
          </TabsContent>

          {/* Transaction History Tab */}
          <TabsContent value="transactions" className="space-y-4 w-full mt-6 animate-in fade-in duration-300">
            <Card className="shadow-sm border-gray-200">
              <CardContent className="p-0">
                <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50/50 rounded-t-xl gap-3">
                  <h3 className="font-semibold text-gray-700">Recent Activity</h3>
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Select value={filter} onValueChange={setFilter}>
                      <SelectTrigger className="w-full sm:w-[150px] bg-white border-gray-200 focus:ring-[#00004D] text-xs sm:text-sm">
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
                      <SelectTrigger className="w-full sm:w-[150px] bg-white border-gray-200 focus:ring-[#00004D] text-xs sm:text-sm">
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
                      <SelectTrigger className="w-full sm:w-[150px] bg-white border-gray-200 focus:ring-[#00004D] text-xs sm:text-sm">
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
                    <Button variant="outline" className="text-xs sm:text-sm border-gray-300" onClick={handleReset}>Reset</Button>
                  </div>
                </div>

                {loading && <p className="text-center text-gray-500 py-10 text-sm">Loading transactions...</p>}
                {error && <p className="text-center text-red-500 py-10 text-sm">{error}</p>}

                {!loading && !error && (
                  <div className="p-0">
                    <div className="overflow-x-auto w-full">
                      <Table className="min-w-[800px] table-fixed">
                        <TableHeader className="bg-gray-50/80">
                          <TableRow className="border-b-gray-200">
                            <TableHead className="whitespace-nowrap text-gray-500 font-semibold h-12">Transaction ID</TableHead>
                            <TableHead className="whitespace-nowrap text-gray-500 font-semibold h-12">Type</TableHead>
                            <TableHead className="whitespace-nowrap text-gray-500 font-semibold h-12">Amount</TableHead>
                            <TableHead className="whitespace-nowrap text-gray-500 font-semibold h-12">Sender</TableHead>
                            <TableHead className="whitespace-nowrap text-gray-500 font-semibold h-12">Receiver</TableHead>
                            <TableHead className="whitespace-nowrap text-gray-500 font-semibold h-12">Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentTransactions.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={5} className="text-center">
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                  </div>
                                  <p className="text-gray-500 font-medium text-sm">No transactions found for the selected filters.</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            currentTransactions.map((transaction) => (
                              <TableRow key={transaction.id} className="hover:bg-gray-50/50 transition-colors">
                                <TableCell className="whitespace-nowrap font-medium text-gray-900">#{transaction.id}</TableCell>
                                <TableCell className="whitespace-nowrap capitalize text-gray-600">
                                  <Badge variant="secondary" className="font-normal bg-gray-100 text-gray-700">
                                    {transactionTypes[transaction.type] || transaction.type}
                                  </Badge>
                                </TableCell>
                                <TableCell className="whitespace-nowrap font-semibold">
                                  <span className="text-gray-900">₹{transaction.amount.toLocaleString()}</span>
                                  {transaction.type === "transfer" && (
                                    <span className="text-rose-500 text-xs ml-1 font-medium bg-rose-50 px-2 py-0.5 rounded-full">Debit</span>
                                  )}
                                  {(transaction.type === "topup" || transaction.type === "credit") && (
                                    <span className="text-emerald-600 text-xs ml-1 font-medium bg-emerald-50 px-2 py-0.5 rounded-full">Credit</span>
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
                                <TableCell className="whitespace-nowrap text-gray-500 text-sm">
                                  {transaction.date && !isNaN(new Date(transaction.date).getTime())
                                    ? format(new Date(transaction.date), "dd-MM-yyyy HH:mm")
                                    : "N/A"}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>

                {totalPages > 1 && (
                  <div className="p-4 border-t border-gray-100">
                    <Pagination className="flex justify-center sm:justify-start">
                      <PaginationContent>
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

export default TreasurySubcomDetailsModal;