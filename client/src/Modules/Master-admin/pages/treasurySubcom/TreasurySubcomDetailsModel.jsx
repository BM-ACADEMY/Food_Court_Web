
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import axios from "axios";

const SessionDetailsModal = ({ session, isOpen, onClose }) => {
  const [sessionData, setSessionData] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (isOpen && session?.session_id) {
      fetchSessionTransactions();
    }
  }, [isOpen, session?.session_id, paymentMethodFilter]);

  const fetchSessionTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/treasurySubcom/fetch-single-treasurysubcom-details/${session.session_id}`,
        {
          params: { payment_method: paymentMethodFilter !== "all" ? paymentMethodFilter : undefined },
        }
      );
      setSessionData(response.data.session);
      setTransactions(response.data.transactions || []);
      setError(null);
    } catch (err) {
      console.error("Error fetching session transactions:", err);
      setError("Failed to load transaction history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setFilteredTransactions(
      paymentMethodFilter === "all"
        ? transactions
        : transactions.filter((tx) => tx.payment_method === paymentMethodFilter)
    );
    setCurrentPage(1);
  }, [transactions, paymentMethodFilter]);

  const totalItems = filteredTransactions.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  const transactionTypes = {
    transfer: "Transfer to Restaurant",
    topup: "Top Up",
    refund: "Refund from Restaurant",
    credit: "Credit",
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-[90vw] md:max-w-2xl lg:max-w-4xl xl:max-w-6xl w-full h-[90vh] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Session Details - {sessionData.treasury_name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Session Details */}
          <div>
            <h3 className="font-semibold text-lg">Session Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p><strong>Treasury Name:</strong> {sessionData.treasury_name || "N/A"}</p>
                <p><strong>Login Time:</strong> {sessionData.login_time || "N/A"}</p>
                <p><strong>Logout Time:</strong> {sessionData.logout_time || "N/A"}</p>
              </div>
              <div>
                <p><strong>Duration:</strong> {session.duration || "N/A"}</p>
                <p><strong>Location:</strong> {sessionData.location || "N/A"}</p>
                <p><strong>UPI:</strong> {sessionData.upi || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Transaction Filters */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
              <SelectTrigger className="w-[150px] sm:w-[180px]">
                <SelectValue placeholder="Filter by payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Methods</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
                <SelectItem value="Gpay">Gpay</SelectItem>
                <SelectItem value="Mess bill">Mess bill</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={() => setPaymentMethodFilter("all")}>Reset</Button>
          </div>

          {/* Transactions Table */}
          {loading && <p className="text-center text-gray-600 text-sm">Loading transactions...</p>}
          {error && <p className="text-center text-red-500 text-sm">{error}</p>}
          {!loading && !error && (
            <>
              <div className="overflow-y-auto min-h-[200px]">
                <Table className="min-w-[600px] sm:min-w-[800px] md:min-w-full table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">Transaction ID</TableHead>
                      <TableHead className="whitespace-nowrap">Type</TableHead>
                      <TableHead className="whitespace-nowrap">Amount</TableHead>
                      <TableHead className="whitespace-nowrap">Payment Method</TableHead>
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
                        <TableCell className="whitespace-nowrap">{transaction.payment_method}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {transaction.date && !isNaN(new Date(transaction.date).getTime())
                            ? format(new Date(transaction.date), "dd-MM-yyyy HH:mm")
                            : "N/A"}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">{transaction.description}</TableCell>
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
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="text-xs sm:text-sm"
                      />
                    </PaginationItem>
                    {[...Array(totalPages)].map((_, index) => (
                      <PaginationItem key={index + 1}>
                        <PaginationLink
                          onClick={() => setCurrentPage(index + 1)}
                          isActive={currentPage === index + 1}
                          className="text-xs sm:text-sm"
                        >
                          {index + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="text-xs sm:text-sm"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </div>
        <DialogFooter className="mt-4">
          <Button variant="default" onClick={onClose} className="text-xs sm:text-sm">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SessionDetailsModal;
