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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>DATE & TIME</TableHead>
                <TableHead>TRANSACTION ID</TableHead>
                <TableHead>MEMBER</TableHead>
                <TableHead>AMOUNT</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>PAYMENT METHOD</TableHead>
                <TableHead>LOCATION</TableHead>
                <TableHead>ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleTransactions.map((tx, index) => {
                const member = tx.receiver_id?.name || "N/A";
                const transactionId = tx.transaction_id;
                const amount = `₹${parseFloat(tx.amount?.$numberDecimal || 0).toFixed(2)}`;
                const status = tx.status;
                const upi = tx.receiver_id?.phone_number || "—";
                const location = tx.location_id?.name || "—";
                const dateTime = new Date(tx.created_at).toLocaleString();

                return (
                  <TableRow key={index}>
                    <TableCell>{dateTime}</TableCell>
                    <TableCell>{transactionId}</TableCell>
                    <TableCell className="flex items-center gap-2">
                      <Avatar name={member} />
                      <span>
                        {member}{" "}
                        <span className="text-gray-500">
                          #{transactionId?.split("-")[1] || ""}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>{amount}</TableCell>
                    <TableCell className="text-green-600">{status}</TableCell>
                    <TableCell>{tx.payment_method || "—"}</TableCell>
                    <TableCell>{location}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" className="flex items-center gap-1">
                        <Eye className="w-4 h-4" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

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
