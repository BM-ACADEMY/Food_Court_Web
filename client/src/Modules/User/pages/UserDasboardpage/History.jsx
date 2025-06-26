import {
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

const TransactionHistory = () => {
  const { user } = useAuth();
  const [filter, setFilter] = useState("All");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch transactions from the backend
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/transactions/fetch-all-transaction`,
        { withCredentials: true }
      );
      const allTransactions = res.data.data;
      console.log("Fetched Transactions:", allTransactions); // Debug log

      // Filter transactions where the user is either sender or receiver
      const userTransactions = allTransactions.filter(
        (tx) =>
          tx.sender_id?._id === user?._id || tx.receiver_id?._id === user?._id
      );
      console.log("User Transactions:", userTransactions); // Debug log

      // Group transactions by date
      const grouped = groupTransactionsByDate(userTransactions);
      setTransactions(grouped);
    } catch (err) {
      console.error("Fetch transactions failed:", err);
      setError("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  // Group transactions by date
  const groupTransactionsByDate = (txs) => {
    const groups = {};
    txs.forEach((tx) => {
      const date = new Date(tx.created_at);
      const dateKey = getDateKey(date);

      // Determine description based on transaction type and user role
      let description = "";
      if (tx.transaction_type === "Transfer") {
        description =
          tx.sender_id._id === user?._id
            ? `Paid to ${tx.receiver_id.name}`
            : `Received from ${tx.sender_id.name}`;
      } else if (tx.transaction_type === "TopUp") {
        description = "Added to Wallet";
      } else if (tx.transaction_type === "Refund") {
        description =
          tx.sender_id._id === user?._id
            ? `Refunded to ${tx.receiver_id.name}`
            : `Refunded from ${tx.sender_id.name}`;
      }

      const amount =
        tx.sender_id._id === user?._id
          ? -parseFloat(tx.amount)
          : parseFloat(tx.amount);

      if (!groups[dateKey]) {
        groups[dateKey] = { date: dateKey, items: [] };
      }
      groups[dateKey].items.push({
        name: description,
        time: formatDateTime(date),
        amount,
        _id: tx._id,
        transaction_type: tx.transaction_type, // Include for display
      });
    });

    return Object.values(groups).sort((a, b) => {
      const dateA = new Date(a.items[0].time.split("•")[0]);
      const dateB = new Date(b.items[0].time.split("•")[0]);
      return dateB - dateA;
    });
  };

  // Get date key (e.g., "Today", "Yesterday", or formatted date)
  const getDateKey = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return "Today";
    } else if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  // Format date and time for display
  const formatDateTime = (date) => {
    return `${date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })} • ${date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    })}`;
  };

  // Parse time for sorting
  const parseTime = (str) => {
    const [datePart, timePart] = str.split("•").map((s) => s.trim());
    return new Date(`${datePart} ${timePart}`);
  };

  // Apply filter
  const filteredTransactions =
    filter === "All"
      ? transactions
      : transactions.filter((group) => group.date === filter);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    } else {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return <div>Loading transactions...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  if (!user) {
    return <div>Please log in to view your transaction history.</div>;
  }

  return (
    <Card className="mt-10 w-full max-w-6xl p-6 rounded-2xl shadow-md bg-white mx-auto">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl md:text-2xl font-bold text-[#00004d]">
          Transaction History
        </CardTitle>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="text-gray-500">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {["All", "Today", "Yesterday"].map((option) => (
              <DropdownMenuItem
                key={option}
                onClick={() => setFilter(option)}
                className={filter === option ? "font-semibold text-blue-600" : ""}
              >
                {option}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="p-0">
        <div className="max-h-[600px] md:max-h-[400px] overflow-y-auto pr-2">
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-4">No transactions found.</div>
          ) : (
            filteredTransactions.map((group, groupIndex) => (
              <div key={groupIndex} className="mb-4">
                <div className="px-4 py-2 text-sm font-medium text-gray-500 bg-gray-50 sticky top-0 z-10">
                  {group.date}
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Type</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.items
                      .slice()
                      .sort((a, b) => parseTime(b.time) - parseTime(a.time))
                      .map((item, index) => (
                        <TableRow key={item._id} className="items-center">
                          <TableCell className="align-middle">
                            <div
                              className={`w-8 h-8 flex items-center justify-center rounded-full ${
                                item.amount > 0
                                  ? "bg-green-100 text-green-600"
                                  : "bg-red-100 text-red-600"
                              }`}
                            >
                              {item.amount > 0 ? (
                                <ArrowDownRight className="w-4 h-4" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="align-middle text-left">
                            <p className="font-medium">{item.name}</p>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Clock className="w-3 h-3 mr-1" />
                              {item.time}
                            </div>
                          </TableCell>
                          <TableCell className="align-middle text-right font-medium">
                            <span
                              className={
                                item.amount > 0
                                  ? "text-green-600"
                                  : "text-red-600"
                              }
                            >
                              {item.amount > 0 ? "+" : "-"}₹
                              {Math.abs(item.amount).toFixed(2)}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;