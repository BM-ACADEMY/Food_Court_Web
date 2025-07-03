import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

const getRandomColor = () => {
  const colors = ["#FF6B6B", "#4ECDC4", "#556270", "#C7F464", "#FFA500"];
  return colors[Math.floor(Math.random() * colors.length)];
};

const Avatar = ({ name = "" }) => {
  const initials =
    name?.split(" ")[0]?.[0]?.toUpperCase() +
    (name?.split(" ")[1]?.[0]?.toUpperCase() || "");
  const color = getRandomColor();

  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
      style={{ backgroundColor: color }}
    >
      {initials}
    </div>
  );
};

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);

  const loadTransactions = async () => {
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/transactions/fetch-all-recent-transaction`
      );
      setTransactions(res.data.data || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadMore = () => {
    setVisibleCount(transactions.length);
  };

  const visibleTransactions = transactions.slice(0, visibleCount);

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Recent Fund Transfers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table className="min-w-[1000px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">DATE & TIME</TableHead>
                  <TableHead className="whitespace-nowrap">TRANSACTION ID</TableHead>
                  <TableHead className="whitespace-nowrap">SENDER NAME</TableHead>
                  <TableHead className="whitespace-nowrap">RECEIVER NAME</TableHead>
                  <TableHead className="whitespace-nowrap">AMOUNT</TableHead>
                  <TableHead className="whitespace-nowrap">STATUS</TableHead>
                  <TableHead className="whitespace-nowrap">PAYMENT METHOD</TableHead>
                  {/* <TableHead className="whitespace-nowrap">ACTIONS</TableHead> */}
                </TableRow>
              </TableHeader>

              <TableBody>
                {visibleTransactions.map((tx, index) => {
                  const dateTime = new Date(tx.created_at).toLocaleString();
                  const amount = `₹${parseFloat(tx.amount || 0).toFixed(2)}`;
                  const status = tx.status || "N/A";

                  return (
                    <TableRow key={index}>
                      <TableCell className="whitespace-nowrap truncate">
                        {new Date(tx.created_at).toLocaleString("en-IN", {
                          dateStyle: "medium",
                          timeStyle: "short",
                          timeZone: "Asia/Kolkata",
                        })}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{tx.transaction_id}</TableCell>

                      {/* Sender Name */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Avatar name={tx.sender_name} />
                          <div className="flex flex-col">
                            <span className="text-gray-700">{tx.sender_name}</span>
                            <span className="text-xs text-gray-500">({tx.sender_role})</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Receiver Name */}
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Avatar name={tx.receiver_name} />
                          <div className="flex flex-col">
                            <span className="text-gray-700">{tx.receiver_name}</span>
                            <span className="text-xs text-gray-500">({tx.receiver_role})</span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">{amount}</TableCell>

                      <TableCell className="whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${status === "Success"
                            ? "bg-green-100 text-green-700"
                            : status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : status === "Failed"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                        >
                          {status}
                        </span>
                      </TableCell>

                      <TableCell className="whitespace-nowrap">
                        {tx.payment_method || "—"}
                      </TableCell>

                      {/* ACTIONS column */}
                      {/* <TableCell className="whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="flex items-center gap-1"
                          onClick={() => handleView(tx)}
                        >
                          <Eye className="w-4 h-4" /> View
                        </Button>
                      </TableCell> */}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {visibleTransactions.length < transactions.length && (
            <button
              onClick={loadMore}
              className="mt-4 text-blue-600 hover:underline"
            >
              View All Transactions
            </button>
          )}
        </CardContent>
      </Card>
    </div>

  );
}
