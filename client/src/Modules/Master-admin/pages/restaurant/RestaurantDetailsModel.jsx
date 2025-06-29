import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import axios from "axios";
import { Loader2 } from "lucide-react";

export default function RestaurantDetailsModal({ isOpen, onClose, restaurant }) {
  const [restaurantDetails, setRestaurantDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [isEditingId, setIsEditingId] = useState("");
  const [activeTab, setActiveTab] = useState("user-info"); // Track active tab
  const pageSize = 5;

  useEffect(() => {
    if (isOpen && restaurant?.id) {
      const fetchRestaurantDetails = async () => {
        setLoading(true);
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/restaurants/fetch-single-restaurant-details/${restaurant.id}`
          );
          setRestaurantDetails(response.data);
          setFormData({
            name: response.data.name || "",
            phone: response.data.phone || "",
            email: response.data.email || "",
          });
          setError(null);
        } catch (err) {
          console.error("Error fetching restaurant details:", err);
          setError("Failed to load restaurant details.");
        } finally {
          setLoading(false);
        }
      };

      const fetchTransactions = async () => {
        setLoading(true);
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_BASE_URL}/restaurants/fetch-single-restaurant-transactions/${restaurant.id}/transactions`,
            {
              params: {
                filter,
                page: currentPage,
                pageSize,
              },
            }
          );
          setTransactions(response.data.data || []);
          setTotalItems(response.data.total || 0);
          setTotalPages(response.data.totalPages || 1);
          setCurrentPage(response.data.currentPage || 1);
          setError(null);
        } catch (err) {
          console.error("Error fetching transactions:", err);
          setError("Failed to load transactions.");
        } finally {
          setLoading(false);
        }
      };

      fetchRestaurantDetails();
      // Only fetch transactions if on the transactions tab
      if (activeTab === "transactions") {
        fetchTransactions();
      }
    }
  }, [isOpen, restaurant, filter, currentPage, activeTab]);

  const handleEdit = (edit) => {

    setIsEditing(true);
    setIsEditingId(edit.user_id);
    setFormData({
      name: restaurantDetails?.name || "",
      phone: restaurantDetails?.phone || "",
      email: restaurantDetails?.email || "",
    });
  };

  const handleSave = async () => {
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_BASE_URL}/users/update-user/${isEditingId}`,
        {
          id: restaurant.id,
          name: formData.name,
          phone_number: formData.phone,
          email: formData.email,
        }
      );
      setRestaurantDetails(response.data);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      console.error("Error updating restaurant:", err);
      setError("Failed to update restaurant information. Please try again.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const transactionTypes = {
    transfer: "Transfer to Customer",
    topup: "Top Up",
    refund: "Refund to Customer",
    credit: "Credit",
    treasury_topup: "Treasury Top Up",
  };

  if (!isOpen || !restaurant) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-2xl lg:max-w-4xl xl:max-w-6xl w-full h-[90vh] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle  className="text-lg sm:text-xl">Restaurant Details - #{restaurantDetails?.id}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <p className="text-center text-red-500">{error}</p>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="user-info">User Information</TabsTrigger>
              <TabsTrigger value="transactions">Transaction History</TabsTrigger>
            </TabsList>
            <TabsContent value="user-info">
              <Card>
                <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Restaurant ID</Label>
                      <p className="font-medium">#{restaurantDetails?.id}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">User ID</Label>
                      <p className="font-medium">{restaurantDetails?.user_id || "N/A"}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Name</Label>
                      {isEditing ? (
                        <Input
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      ) : (
                        <p className="font-medium">{restaurantDetails?.name || "N/A"}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Phone</Label>
                      {isEditing ? (
                        <Input
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="mt-1"
                        />
                      ) : (
                        <p className="font-medium">{restaurantDetails?.phone || "N/A"}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Email</Label>
                      {isEditing ? (
                        <Input
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="mt-1"
                          type="email"
                        />
                      ) : (
                        <p className="font-medium">{restaurantDetails?.email || "N/A"}</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Sales</Label>
                      <p className="font-medium">
                        ₹{restaurantDetails?.sales ? restaurantDetails.sales.toLocaleString() : "0.00"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Status</Label>
                      <Badge
                        variant="ghost"
                        className={`text-white ${
                          restaurantDetails?.status?.toLowerCase() === "online"
                            ? "bg-green-500"
                            : "bg-red-500"
                        }`}
                      >
                        {restaurantDetails?.status || "N/A"}
                      </Badge>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Last Active</Label>
                      <p className="font-medium">
                        {restaurantDetails?.lastActive
                          ? format(new Date(restaurantDetails.lastActive), "dd-MM-yyyy HH:mm")
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Registration Date</Label>
                      <p className="font-medium">
                        {restaurantDetails?.registrationDate
                          ? format(new Date(restaurantDetails.registrationDate), "dd-MM-yyyy")
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Total Transactions</Label>
                      <p className="font-medium">{restaurantDetails?.totalTransactions || 0}</p>
                    </div>
                  </div>
                  {error && <p className="text-red-500 mt-4">{error}</p>}
                  <div className="flex justify-end gap-2 mt-4">
                    {isEditing ? (
                      <>
                        <Button variant="outline" onClick={() => setIsEditing(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSave}>Save</Button>
                      </>
                    ) : (
                      <Button onClick={() => handleEdit(restaurantDetails)}>Edit Information</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="transactions" className="space-y-4 w-full">
              <div className="flex justify-end mb-4">
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
                        {transactions.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center">
                              No transactions found for the selected filter.
                            </TableCell>
                          </TableRow>
                        ) : (
                          transactions.map((tx) => (
                            <TableRow key={tx.id}>
                              <TableCell className="whitespace-nowrap">#{tx.id}</TableCell>
                              <TableCell className="whitespace-nowrap capitalize">
                                {transactionTypes[tx.type] || tx.type}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                ₹{tx.amount.toLocaleString()}
                                {tx.type === "transfer" && (
                                  <span className="text-red-500"> (Debit)</span>
                                )}
                                {(tx.type === "topup" ||
                                  tx.type === "credit" ||
                                  tx.type === "treasury_topup") && (
                                  <span className="text-green-500"> (Credit)</span>
                                )}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {format(new Date(tx.date), "dd-MM-yyyy HH:mm")}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">{tx.description || "N/A"}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
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
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}